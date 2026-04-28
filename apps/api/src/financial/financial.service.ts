import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async getKpis(tenantId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    const from = new Date(now);
    if (period === 'day') from.setHours(0, 0, 0, 0);
    else if (period === 'week') from.setDate(now.getDate() - 7);
    else if (period === 'month') { from.setDate(1); from.setHours(0, 0, 0, 0); }
    else { from.setMonth(0); from.setDate(1); from.setHours(0, 0, 0, 0); }

    const prevFrom = new Date(from);
    if (period === 'day') prevFrom.setDate(prevFrom.getDate() - 1);
    else if (period === 'week') prevFrom.setDate(prevFrom.getDate() - 7);
    else if (period === 'month') prevFrom.setMonth(prevFrom.getMonth() - 1);
    else prevFrom.setFullYear(prevFrom.getFullYear() - 1);

    const [income, expenses, prevIncome, appointments, completedAppts, newCustomers] = await Promise.all([
      this.prisma.transaction.aggregate({ where: { tenantId, type: 'INCOME', status: 'PAID', paidAt: { gte: from } }, _sum: { amount: true }, _count: true }),
      this.prisma.transaction.aggregate({ where: { tenantId, type: 'EXPENSE', createdAt: { gte: from } }, _sum: { amount: true } }),
      this.prisma.transaction.aggregate({ where: { tenantId, type: 'INCOME', status: 'PAID', paidAt: { gte: prevFrom, lt: from } }, _sum: { amount: true } }),
      this.prisma.appointment.count({ where: { tenantId, startsAt: { gte: from } } }),
      this.prisma.appointment.count({ where: { tenantId, status: 'COMPLETED', startsAt: { gte: from } } }),
      this.prisma.customer.count({ where: { tenantId, createdAt: { gte: from } } }),
    ]);

    const totalIncome = Number(income._sum.amount ?? 0);
    const totalExpenses = Number(expenses._sum.amount ?? 0);
    const prevTotalIncome = Number(prevIncome._sum.amount ?? 0);
    const avgTicket = income._count > 0 ? totalIncome / income._count : 0;
    const conversionRate = appointments > 0 ? (completedAppts / appointments) * 100 : 0;
    const growthRate = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0;

    return { revenue: totalIncome, expenses: totalExpenses, profit: totalIncome - totalExpenses, avgTicket, conversionRate, growthRate, totalAppointments: appointments, completedAppointments: completedAppts, newCustomers, period };
  }

  async getRevenueChart(tenantId: string, year?: number) {
    const y = year ?? new Date().getFullYear();
    return Promise.all(
      Array.from({ length: 12 }, (_, month) => {
        const from = new Date(y, month, 1);
        const to = new Date(y, month + 1, 0, 23, 59, 59);
        return Promise.all([
          this.prisma.transaction.aggregate({ where: { tenantId, type: 'INCOME', status: 'PAID', paidAt: { gte: from, lte: to } }, _sum: { amount: true } }),
          this.prisma.transaction.aggregate({ where: { tenantId, type: 'EXPENSE', createdAt: { gte: from, lte: to } }, _sum: { amount: true } }),
        ]).then(([income, expenses]) => ({
          month: from.toLocaleString('pt-BR', { month: 'short' }),
          revenue: Number(income._sum.amount ?? 0),
          expenses: Number(expenses._sum.amount ?? 0),
        }));
      }),
    );
  }

  async getTopServices(tenantId: string, limit = 5) {
    const result = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      where: { tenantId, status: 'COMPLETED' },
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const services = await this.prisma.service.findMany({ where: { id: { in: result.map((r) => r.serviceId) } } });
    return result.map((r) => ({
      service: services.find((s) => s.id === r.serviceId),
      count: r._count.id,
      revenue: Number(r._sum.price ?? 0),
    }));
  }

  getTransactions(tenantId: string, filters: { type?: string; status?: string; from?: string; to?: string; category?: string }) {
    return this.prisma.transaction.findMany({
      where: {
        tenantId,
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...((filters.from || filters.to) ? { createdAt: { ...(filters.from && { gte: new Date(filters.from) }), ...(filters.to && { lte: new Date(filters.to) }) } } : {}),
      },
      include: { customer: true, appointment: { include: { service: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createTransaction(tenantId: string, data: any) {
    return this.prisma.transaction.create({ data: { tenantId, ...data } });
  }
}
