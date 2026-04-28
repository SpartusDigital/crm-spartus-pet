import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhitelabelService {
  constructor(private prisma: PrismaService) {}

  async getTheme(tenantIdOrSlug: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { OR: [{ id: tenantIdOrSlug }, { slug: tenantIdOrSlug }, { customDomain: tenantIdOrSlug }] },
      include: { theme: true, settings: true },
    });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');

    return {
      name: tenant.name,
      slug: tenant.slug,
      theme: tenant.theme,
      settings: {
        petTypeLabel: tenant.settings?.petTypeLabel ?? 'Pet',
        currency: tenant.settings?.currency ?? 'BRL',
        timezone: tenant.settings?.timezone ?? 'America/Sao_Paulo',
      },
    };
  }

  async updateTheme(tenantId: string, data: any) {
    return this.prisma.tenantTheme.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  }

  async updateSettings(tenantId: string, data: any) {
    return this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  }

  async getTenantByDomain(domain: string) {
    return this.prisma.tenant.findFirst({
      where: { OR: [{ customDomain: domain }, { slug: domain }] },
      include: { theme: true, settings: true },
    });
  }
}
