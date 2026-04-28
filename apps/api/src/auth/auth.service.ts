import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(tenantSlug: string, email: string, password: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new UnauthorizedException('Tenant não encontrado');

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });

    if (!user || !user.active) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.tenant, dto.email, dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (existing) throw new BadRequestException('Slug já em uso');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const tenant = await this.prisma.tenant.create({
      data: {
        slug: dto.tenantSlug,
        name: dto.businessName,
        theme: { create: {} },
        settings: { create: {} },
        users: {
          create: {
            email: dto.email,
            passwordHash,
            name: dto.name,
            role: 'OWNER',
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    const payload = { sub: user.id, tenantId: tenant.id, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: tenant.id },
    };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true, avatarUrl: true, tenantId: true,
        tenant: { select: { id: true, slug: true, name: true, plan: true } },
      },
    });
  }
}
