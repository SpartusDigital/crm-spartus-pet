import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.service.findMany({ where: { tenantId, active: true }, orderBy: { name: 'asc' } });
  }

  async create(tenantId: string, data: any) {
    return this.prisma.service.create({ data: { tenantId, ...data } });
  }

  async update(tenantId: string, id: string, data: any) {
    const s = await this.prisma.service.findFirst({ where: { id, tenantId } });
    if (!s) throw new NotFoundException('Serviço não encontrado');
    return this.prisma.service.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    const s = await this.prisma.service.findFirst({ where: { id, tenantId } });
    if (!s) throw new NotFoundException('Serviço não encontrado');
    return this.prisma.service.update({ where: { id }, data: { active: false } });
  }
}
