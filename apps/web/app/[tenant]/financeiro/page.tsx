'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Users } from 'lucide-react';
import api from '@/lib/api';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function FinanceiroPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const { data: kpis } = useQuery({
    queryKey: ['kpis', period],
    queryFn: () => api.get(`/financial/kpis?period=${period}`),
  });

  const { data: chart } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => api.get('/financial/chart/revenue'),
  });

  const { data: topServices } = useQuery({
    queryKey: ['top-services'],
    queryFn: () => api.get('/financial/top-services'),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/financial/transactions'),
  });

  const kpiCards = [
    { title: 'Receita', value: fmt(kpis?.revenue ?? 0), icon: DollarSign, color: 'bg-primary', change: kpis?.growthRate },
    { title: 'Despesas', value: fmt(kpis?.expenses ?? 0), icon: TrendingDown, color: 'bg-red-500', change: 0 },
    { title: 'Lucro', value: fmt(kpis?.profit ?? 0), icon: TrendingUp, color: 'bg-green-500', change: kpis?.growthRate },
    { title: 'Ticket Médio', value: fmt(kpis?.avgTicket ?? 0), icon: Target, color: 'bg-secondary', change: 0 },
    { title: 'Agendamentos', value: kpis?.totalAppointments ?? 0, icon: Calendar, color: 'bg-yellow-500', change: 0 },
    { title: 'Novos Clientes', value: kpis?.newCustomers ?? 0, icon: Users, color: 'bg-pink-500', change: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm">KPIs e análise financeira</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                period === p ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.title} className="card p-4">
            <div className={`w-9 h-9 ${kpi.color} rounded-lg flex items-center justify-center mb-3`}>
              <kpi.icon size={18} className="text-white" />
            </div>
            <p className="text-xs text-gray-500 mb-1">{kpi.title}</p>
            <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
            {kpi.change !== undefined && kpi.change !== 0 && (
              <p className={`text-xs mt-1 ${kpi.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">Receita x Despesas (2024)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v / 1000}k`} />
              <Tooltip formatter={(v: any) => fmt(v)} />
              <Bar dataKey="revenue" name="Receita" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Distribuição de Serviços</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={topServices ?? []} dataKey="revenue" nameKey="service.name" outerRadius={80} label>
                {(topServices ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Últimas Transações</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Descrição</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Cliente</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Categoria</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map((t: any) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-900">{t.description}</td>
                  <td className="py-2.5 px-3 text-gray-500">{t.customer?.name ?? '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className="badge bg-gray-100 text-gray-600">{t.category}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`badge ${
                      t.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      t.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {t.status === 'PAID' ? 'Pago' : t.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </td>
                  <td className={`py-2.5 px-3 text-right font-medium ${
                    t.type === 'INCOME' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {t.type === 'INCOME' ? '+' : '-'}{fmt(Number(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
