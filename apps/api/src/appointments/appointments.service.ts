import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // Verifica agendamentos vencidos a cada 10 minutos
    setTimeout(() => this.autoCompleteOverdue(), 15_000);
    setInterval(() => this.autoCompleteOverdue(), 10 * 60 * 1000);
  }

  // Conclui automaticamente agendamentos que passaram 30 min do horário de término
  // e ainda estão como SCHEDULED, CONFIRMED ou IN_PROGRESS.
  // Registra a transação financeira sem precisar de ação manual no PDV.
  private async autoCompleteOverdue() {
    try {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000);

      const overdue = await this.prisma.appointment.findMany({
        where: {
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
          endsAt: { lt: cutoff },
        },
        include: { service: true },
      });

      for (const appt of overdue) {
        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: { status: 'COMPLETED' },
        });

        await this.prisma.transaction.upsert({
          where: { appointmentId: appt.id },
          create: {
            tenantId: appt.tenantId,
            appointmentId: appt.id,
            customerId: appt.customerId,
            type: 'INCOME',
            amount: appt.price,
            category: 'Serviço',
            description: `Serviço: ${appt.service.name}`,
            status: 'PAID',
            paidAt: new Date(),
          },
          update: { status: 'PAID', paidAt: new Date() },
        });

        await this.prisma.petRecord.create({
          data: {
            petId: appt.petId,
            type: 'OTHER',
            date: new Date(),
            title: appt.service.name,
            cost: appt.price,
          },
        });
      }
    } catch {
      // Erro silencioso — não derruba o servidor se o banco estiver indisponível
    }
  }

  async create(tenantId: string, dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({ where: { id: dto.serviceId, tenantId } });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    const conflicts = await this.prisma.appointment.count({
      where: {
        tenantId,
        assignedToId: dto.assignedToId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          { startsAt: { gte: new Date(dto.startsAt), lt: new Date(dto.endsAt) } },
          { endsAt: { gt: new Date(dto.startsAt), lte: new Date(dto.endsAt) } },
        ],
      },
    });

    if (conflicts > 0) throw new BadRequestException('Horário já ocupado');

    return this.prisma.appointment.create({
      data: {
        tenantId,
        petId: dto.petId,
        customerId: dto.customerId,
        serviceId: dto.serviceId,
        assignedToId: dto.assignedToId,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        price: dto.price ?? service.price,
        notes: dto.notes,
      },
      include: { pet: true, customer: true, service: true, assignedTo: true },
    });
  }

  async findAll(tenantId: string, filters: { date?: string; status?: string; assignedToId?: string; from?: string; to?: string }) {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.date) {
      const day = new Date(filters.date);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.startsAt = { gte: day, lt: nextDay };
    } else if (filters.from || filters.to) {
      where.startsAt = {};
      if (filters.from) where.startsAt.gte = new Date(filters.from);
      if (filters.to) where.startsAt.lte = new Date(filters.to);
    }

    return this.prisma.appointment.findMany({
      where,
      include: { pet: true, customer: true, service: true, assignedTo: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const a = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: { pet: { include: { records: { orderBy: { date: 'desc' }, take: 5 } } }, customer: true, service: true, assignedTo: true, transaction: true },
    });
    if (!a) throw new NotFoundException('Agendamento não encontrado');
    return a;
  }

  async update(tenantId: string, id: string, dto: UpdateAppointmentDto) {
    const existing = await this.findOne(tenantId, id);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.startsAt && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt && { endsAt: new Date(dto.endsAt) }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.cancelReason && { cancelReason: dto.cancelReason }),
        ...(dto.price && { price: dto.price }),
      },
      include: { pet: true, customer: true, service: true },
    });

    if (dto.status === 'COMPLETED') {
      await this.prisma.transaction.upsert({
        where: { appointmentId: id },
        create: {
          tenantId,
          appointmentId: id,
          customerId: updated.customerId,
          type: 'INCOME',
          amount: updated.price,
          category: 'Serviço',
          description: `Serviço: ${updated.service.name}`,
          status: 'PAID',
          paidAt: new Date(),
        },
        update: { status: 'PAID', paidAt: new Date() },
      });

      await this.prisma.petRecord.create({
        data: {
          petId: updated.petId,
          type: 'OTHER',
          date: new Date(),
          title: updated.service.name,
          description: updated.notes ?? undefined,
          cost: updated.price,
        },
      });
    }

    return updated;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.appointment.delete({ where: { id } });
  }

  async getAvailableSlots(tenantId: string, date: string, serviceId: string, userId?: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId } });
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, tenantId } });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    const day = new Date(date);
    const [startH, startM] = (settings?.workingHoursStart ?? '08:00').split(':').map(Number);
    const [endH, endM] = (settings?.workingHoursEnd ?? '18:00').split(':').map(Number);
    const buffer = settings?.appointmentBuffer ?? 15;
    const duration = service.durationMin;

    let current = new Date(day);
    current.setHours(startH, startM, 0, 0);
    const endTime = new Date(day);
    endTime.setHours(endH, endM, 0, 0);

    const existing = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        ...(userId && { assignedToId: userId }),
        startsAt: { gte: new Date(day), lt: endTime },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    const slots: { startsAt: string; endsAt: string; available: boolean }[] = [];
    while (current.getTime() + duration * 60000 <= endTime.getTime()) {
      const slotEnd = new Date(current.getTime() + duration * 60000);
      const isOccupied = existing.some((a) => current < a.endsAt && slotEnd > a.startsAt);
      slots.push({ startsAt: current.toISOString(), endsAt: slotEnd.toISOString(), available: !isOccupied });
      current = new Date(current.getTime() + (duration + buffer) * 60000);
    }

    return slots;
  }
}
