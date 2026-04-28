import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async sendMessage(tenantId: string, phone: string, message: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId } });
    if (!settings?.whatsappEnabled || !settings.whatsappInstance) return;
    await this.sendDirect(settings.whatsappInstance, phone, message);
  }

  async sendDirect(instance: string, phone: string, message: string) {
    const apiUrl = this.config.get('EVOLUTION_API_URL', 'http://localhost:8080');
    const apiKey = this.config.get('EVOLUTION_API_KEY', '');
    const cleanPhone = phone.replace(/\D/g, '');
    const number = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return axios.post(
      `${apiUrl}/message/sendText/${instance}`,
      { number: `${number}@s.whatsapp.net`, text: message },
      { headers: { apikey: apiKey } },
    );
  }

  async handleWebhook(tenantSlug: string, payload: any) {
    if (payload.event !== 'messages.upsert') return;
    const message = payload.data?.messages?.[0];
    if (!message || message.key.fromMe) return;

    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return;

    const phone = message.key.remoteJid.replace('@s.whatsapp.net', '');
    const body = message.message?.conversation ?? message.message?.extendedTextMessage?.text ?? '';

    const customer = await this.prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone: { contains: phone.slice(-10) } },
    });

    let conv = await this.prisma.whatsappConversation.findUnique({
      where: { tenantId_waChatId: { tenantId: tenant.id, waChatId: message.key.remoteJid } },
    });

    if (!conv) {
      conv = await this.prisma.whatsappConversation.create({
        data: {
          tenantId: tenant.id,
          customerId: customer?.id,
          waChatId: message.key.remoteJid,
          contactName: payload.data?.pushName,
          contactPhone: phone,
          unreadCount: 1,
          lastMessageAt: new Date(),
        },
      });
    } else {
      await this.prisma.whatsappConversation.update({
        where: { id: conv.id },
        data: { unreadCount: { increment: 1 }, lastMessageAt: new Date() },
      });
    }

    await this.prisma.whatsappMessage.create({
      data: { conversationId: conv.id, waMessageId: message.key.id, direction: 'IN', body, sentAt: new Date(message.messageTimestamp * 1000) },
    });
  }

  async getConversations(tenantId: string) {
    return this.prisma.whatsappConversation.findMany({
      where: { tenantId },
      include: { customer: true, messages: { orderBy: { sentAt: 'desc' }, take: 1 } },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getMessages(tenantId: string, conversationId: string) {
    const conv = await this.prisma.whatsappConversation.findFirst({ where: { id: conversationId, tenantId } });
    if (!conv) return [];
    await this.prisma.whatsappConversation.update({ where: { id: conversationId }, data: { unreadCount: 0 } });
    return this.prisma.whatsappMessage.findMany({ where: { conversationId }, orderBy: { sentAt: 'asc' } });
  }

  async replyToConversation(tenantId: string, conversationId: string, message: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId } });
    const conv = await this.prisma.whatsappConversation.findFirst({ where: { id: conversationId, tenantId } });
    if (!conv) return;

    if (settings?.whatsappEnabled && settings.whatsappInstance) {
      await this.sendDirect(settings.whatsappInstance, conv.contactPhone, message).catch(() => {});
    }

    return this.prisma.whatsappMessage.create({
      data: { conversationId, direction: 'OUT', body: message, status: 'SENT', sentAt: new Date() },
    });
  }
}
