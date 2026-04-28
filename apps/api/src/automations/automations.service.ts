import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(private prisma: PrismaService, private whatsapp: WhatsappService) {}

  findAll(tenantId: string) {
    return this.prisma.automation.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
  }

  create(tenantId: string, data: any) {
    return this.prisma.automation.create({ data: { tenantId, ...data, actions: JSON.stringify(data.actions) } });
  }

  update(tenantId: string, id: string, data: any) {
    return this.prisma.automation.update({ where: { id }, data });
  }

  remove(tenantId: string, id: string) {
    return this.prisma.automation.delete({ where: { id } });
  }

  async runTrigger(tenantId: string, trigger: string, context: { appointmentId?: string; petId?: string; customerId?: string }) {
    const automations = await this.prisma.automation.findMany({ where: { tenantId, trigger, active: true } });

    for (const automation of automations) {
      try {
        const actions = JSON.parse(automation.actions as string);
        for (const action of actions) {
          if (action.type === 'send_whatsapp') {
            const msg = await this.buildMessage(tenantId, action.template, context);
            if (msg.phone) await this.whatsapp.sendMessage(tenantId, msg.phone, msg.text);
          }
        }
        await this.prisma.automation.update({
          where: { id: automation.id },
          data: { runCount: { increment: 1 }, lastRunAt: new Date() },
        });
      } catch (err: any) {
        this.logger.error(`Automation ${automation.id} failed: ${err.message}`);
      }
    }
  }

  private async buildMessage(tenantId: string, template: string, context: any) {
    let phone = '';
    let text = template;

    if (context.appointmentId) {
      const appt = await this.prisma.appointment.findUnique({
        where: { id: context.appointmentId },
        include: { customer: true, pet: true, service: true },
      });
      if (appt) {
        phone = appt.customer.phone;
        const date = appt.startsAt.toLocaleDateString('pt-BR');
        const time = appt.startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        text = template
          .replace('{cliente}', appt.customer.name)
          .replace('{pet}', appt.pet.name)
          .replace('{servico}', appt.service.name)
          .replace('{data}', date)
          .replace('{hora}', time);
      }
    }

    return { phone, text };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleReminders() {
    const tenants = await this.prisma.tenant.findMany({ where: { active: true }, include: { settings: true } });
    for (const tenant of tenants) {
      if (!tenant.settings?.whatsappEnabled) continue;
      const in24h = new Date(Date.now() + 23 * 60 * 60 * 1000);
      const in25h = new Date(Date.now() + 25 * 60 * 60 * 1000);
      const appointments = await this.prisma.appointment.findMany({
        where: { tenantId: tenant.id, status: { in: ['SCHEDULED', 'CONFIRMED'] }, startsAt: { gte: in24h, lt: in25h }, remindedAt: null },
      });
      for (const appt of appointments) {
        await this.runTrigger(tenant.id, 'HOURS_24_BEFORE', { appointmentId: appt.id });
        await this.prisma.appointment.update({ where: { id: appt.id }, data: { remindedAt: new Date() } });
      }
    }
  }
}
