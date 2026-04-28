import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CreatePetRecordDto } from './dto/create-pet-record.dto';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePetDto) {
    return this.prisma.pet.create({
      data: { ...dto, tenantId, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined },
      include: { customer: true },
    });
  }

  async findAll(tenantId: string, customerId?: string) {
    return this.prisma.pet.findMany({
      where: { tenantId, ...(customerId && { customerId }), active: true },
      include: { customer: true, _count: { select: { appointments: true, records: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const pet = await this.prisma.pet.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        records: { orderBy: { date: 'desc' } },
        vaccines: { orderBy: { appliedAt: 'desc' } },
        appointments: {
          orderBy: { startsAt: 'desc' },
          take: 10,
          include: { service: true },
        },
      },
    });
    if (!pet) throw new NotFoundException('Pet não encontrado');
    return pet;
  }

  async update(tenantId: string, id: string, dto: UpdatePetDto) {
    await this.findOne(tenantId, id);
    return this.prisma.pet.update({
      where: { id },
      data: { ...dto, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined },
      include: { customer: true },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.pet.update({ where: { id }, data: { active: false } });
  }

  async addRecord(petId: string, tenantId: string, dto: CreatePetRecordDto) {
    const pet = await this.prisma.pet.findFirst({ where: { id: petId, tenantId } });
    if (!pet) throw new NotFoundException('Pet não encontrado');

    return this.prisma.petRecord.create({
      data: { petId, ...dto, date: new Date(dto.date) },
    });
  }

  async addVaccine(petId: string, tenantId: string, data: any) {
    const pet = await this.prisma.pet.findFirst({ where: { id: petId, tenantId } });
    if (!pet) throw new NotFoundException('Pet não encontrado');

    return this.prisma.vaccine.create({
      data: {
        petId,
        ...data,
        appliedAt: new Date(data.appliedAt),
        nextDoseAt: data.nextDoseAt ? new Date(data.nextDoseAt) : undefined,
      },
    });
  }

  async getUpcomingVaccines(tenantId: string) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 30);

    return this.prisma.vaccine.findMany({
      where: {
        pet: { tenantId, active: true },
        nextDoseAt: { gte: new Date(), lte: nextWeek },
      },
      include: { pet: { include: { customer: true } } },
      orderBy: { nextDoseAt: 'asc' },
    });
  }
}
