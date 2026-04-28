'use client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Calendar, Users, DollarSign, PawPrint } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '@/lib/api';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

function KpiCard({ title, value, change, icon: Icon, color }: any) {
  const positive = change >= 0;
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change).toFixed(1)}% vs mês anterior
        </div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  );
}

export default function DashboardPage({ params }: { params: { tenant: string } }) {
  const { data: kpis } = useQuery({
    queryKey: ['kpis', 'month'],
    queryFn: () => api.get('/financial/kpis?period=month'),
  });

  const { data: chart } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => api.get('/financial/chart/revenue'),
  });

  const { data: topServices } = useQuery({
    queryKey: ['top-services'],
    queryFn: () => api.get('/financial/top-services'),
  });

  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments-today'],
    queryFn: () => api.get(`/appointments?date=${dayjs().format('YYYY-MM-DD')}`),
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">{dayjs().format('dddd, D [de] MMMM [de] YYYY')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Receita do Mês"
          value={fmt(kpis?.revenue ?? 0)}
          change={kpis?.growthRate ?? 0}
          icon={DollarSign}
          color="bg-primary"
        />
        <KpiCard
          title="Ticket Médio"
          value={fmt(kpis?.avgTicket ?? 0)}
          change={0}
          icon={TrendingUp}
          color="bg-secondary"
        />
        <KpiCard
          title="Agendamentos"
          value={kpis?.totalAppointments ?? 0}
          change={kpis?.conversionRate ?? 0}
          icon={Calendar}
          color="bg-accent"
        />
        <KpiCard
          title="Novos Clientes"
          value={kpis?.newCustomers ?? 0}
          change={0}
          icon={Users}
          color="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">Receita vs Despesas ({new Date().getFullYear()})</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v/1000}k`} />
              <Tooltip formatter={(v: any) => fmt(v)} />
              <Bar dataKey="revenue" name="Receita" fill="rgb(var(--color-primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="rgb(var(--color-accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Serviços Populares</h2>
          <div className="space-y-3">
            {(topServices ?? []).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700">{item.service?.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{fmt(item.revenue)}</p>
                  <p className="text-xs text-gray-400">{item.count} atend.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">
          Agendamentos de Hoje ({(todayAppointments ?? []).length})
        </h2>
        <div className="space-y-2">
          {(todayAppointments ?? []).length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">Nenhum agendamento hoje</p>
          )}
          {(todayAppointments ?? []).map((appt: any) => (
            <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
              <div className="text-center w-14">
                <p className="text-sm font-bold text-primary">
                  {dayjs(appt.startsAt).format('HH:mm')}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {appt.pet?.name} — {appt.customer?.name}
                </p>
                <p className="text-xs text-gray-500">{appt.service?.name}</p>
              </div>
              <span className={`badge ${
                appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                appt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {appt.status === 'COMPLETED' ? 'Concluído' :
                 appt.status === 'IN_PROGRESS' ? 'Em andamento' :
                 appt.status === 'CANCELLED' ? 'Cancelado' : 'Agendado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
