import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('admin123456', 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Pet Shop Demo',
      plan: 'PROFESSIONAL',
      theme: {
        create: {
          primaryColor: '#6366f1',
          secondaryColor: '#8b5cf6',
          accentColor: '#ec4899',
          fontFamily: 'Inter',
        },
      },
      settings: {
        create: {
          petTypeLabel: 'Pet',
          currency: 'BRL',
          timezone: 'America/Sao_Paulo',
          workingHoursStart: '08:00',
          workingHoursEnd: '18:00',
          workingDays: [1, 2, 3, 4, 5, 6],
        },
      },
      users: {
        create: {
          email: 'admin@demo.com',
          passwordHash,
          name: 'Admin Demo',
          role: 'OWNER',
        },
      },
    },
    include: { users: true },
  });

  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'svc-banho' },
      update: {},
      create: { id: 'svc-banho', tenantId: tenant.id, name: 'Banho', durationMin: 60, price: 60, color: '#6366f1' },
    }),
    prisma.service.upsert({
      where: { id: 'svc-tosa' },
      update: {},
      create: { id: 'svc-tosa', tenantId: tenant.id, name: 'Tosa', durationMin: 90, price: 80, color: '#8b5cf6' },
    }),
    prisma.service.upsert({
      where: { id: 'svc-consulta' },
      update: {},
      create: { id: 'svc-consulta', tenantId: tenant.id, name: 'Consulta Veterinária', durationMin: 45, price: 120, color: '#10b981' },
    }),
  ]);

  const customer = await prisma.customer.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '11999999999' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Maria Silva',
      phone: '11999999999',
      email: 'maria@exemplo.com',
    },
  });

  await prisma.pet.upsert({
    where: { id: 'pet-rex' },
    update: {},
    create: {
      id: 'pet-rex',
      tenantId: tenant.id,
      customerId: customer.id,
      name: 'Rex',
      species: 'Cão',
      breed: 'Labrador',
      gender: 'MALE',
      birthDate: new Date('2020-03-15'),
      weight: 28.5,
      color: 'Amarelo',
    },
  });

  const defaultAutomations = [
    {
      name: 'Confirmação de agendamento',
      trigger: 'APPOINTMENT_CREATED',
      actions: [{ type: 'send_whatsapp', template: 'Olá {cliente}! Seu agendamento de {servico} para {pet} foi confirmado para {data} às {hora}. Qualquer dúvida estamos à disposição!' }],
    },
    {
      name: 'Lembrete 24h antes',
      trigger: 'HOURS_24_BEFORE',
      actions: [{ type: 'send_whatsapp', template: 'Olá {cliente}! Lembrando que amanhã às {hora} temos agendado {servico} para o(a) {pet}. Aguardamos sua visita!' }],
    },
    {
      name: 'Mensagem pós-atendimento',
      trigger: 'APPOINTMENT_COMPLETED',
      actions: [{ type: 'send_whatsapp', template: 'Obrigado pela visita, {cliente}! Esperamos que o(a) {pet} tenha gostado do(a) {servico}. Até a próxima!' }],
    },
  ];

  for (const automation of defaultAutomations) {
    await prisma.automation.upsert({
      where: { id: `auto-${automation.trigger.toLowerCase()}` },
      update: {},
      create: { id: `auto-${automation.trigger.toLowerCase()}`, tenantId: tenant.id, ...automation, active: true },
    });
  }

  console.log('Seed concluído!');
  console.log(`Tenant: demo | Login: admin@demo.com | Senha: admin123456`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
