import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone: dto.phone } },
    });
    if (existing) throw new ConflictException('Cliente com este telefone já existe');

    return this.prisma.customer.create({
      data: { ...dto, tenantId },
      include: { _count: { select: { pets: true } } },
    });
  }

  async findAll(tenantId: string, search?: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, active: true },
      include: {
        pets: { where: { active: true }, select: { id: true, name: true, species: true, photoUrl: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q),
    );
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        pets: { where: { active: true }, include: { _count: { select: { appointments: true } } } },
        appointments: { orderBy: { startsAt: 'desc' }, take: 10, include: { service: true, pet: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(tenantId, id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.customer.update({ where: { id }, data: { active: false } });
  }
}
