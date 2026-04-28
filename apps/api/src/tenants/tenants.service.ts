import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, lastLoginAt: true },
    });
  }

  async createUser(tenantId: string, data: any) {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: { tenantId, ...data, passwordHash, password: undefined },
    });
  }

  async updateUser(tenantId: string, userId: string, data: any) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async removeUser(tenantId: string, userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { active: false } });
  }
}
