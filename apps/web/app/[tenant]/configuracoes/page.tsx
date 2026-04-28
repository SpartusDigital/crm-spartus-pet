'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Settings, MessageSquare, Users, Package } from 'lucide-react';
import api from '@/lib/api';

const TABS = [
  { id: 'theme', label: 'Aparência', icon: Palette },
  { id: 'settings', label: 'Configurações', icon: Settings },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'services', label: 'Serviços', icon: Package },
  { id: 'users', label: 'Usuários', icon: Users },
];

export default function ConfiguracoesPage({ params }: { params: { tenant: string } }) {
  const [tab, setTab] = useState('theme');
  const qc = useQueryClient();

  const { data: theme } = useQuery({
    queryKey: ['theme'],
    queryFn: () => api.get(`/whitelabel/theme/${params.tenant}`),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/tenants/users'),
  });

  const themeMutation = useMutation({
    mutationFn: (data: any) => api.patch('/whitelabel/theme', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theme'] }),
  });

  const settingsMutation = useMutation({
    mutationFn: (data: any) => api.patch('/whitelabel/settings', data),
  });

  const servicesMutation = useMutation({
    mutationFn: (data: any) =>
      data.id ? api.patch(`/services/${data.id}`, data) : api.post('/services', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  const [themeForm, setThemeForm] = useState({
    primaryColor: theme?.theme?.primaryColor ?? '#6366f1',
    secondaryColor: theme?.theme?.secondaryColor ?? '#8b5cf6',
    accentColor: theme?.theme?.accentColor ?? '#ec4899',
    fontFamily: theme?.theme?.fontFamily ?? 'Inter',
    borderRadius: theme?.theme?.borderRadius ?? '0.5rem',
  });

  const [newService, setNewService] = useState({ name: '', durationMin: 60, price: 0, color: '#6366f1' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm">Personalize seu pet shop</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'theme' && (
        <div className="card max-w-2xl space-y-6">
          <h2 className="font-semibold text-gray-900">Identidade Visual</h2>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cor Primária', key: 'primaryColor' },
              { label: 'Cor Secundária', key: 'secondaryColor' },
              { label: 'Cor Destaque', key: 'accentColor' },
            ].map((c) => (
              <div key={c.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{c.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(themeForm as any)[c.key]}
                    onChange={(e) => setThemeForm((f) => ({ ...f, [c.key]: e.target.value }))}
                    className="h-10 w-14 rounded cursor-pointer border border-gray-200"
                  />
                  <input
                    value={(themeForm as any)[c.key]}
                    onChange={(e) => setThemeForm((f) => ({ ...f, [c.key]: e.target.value }))}
                    className="input flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fonte</label>
              <select
                value={themeForm.fontFamily}
                onChange={(e) => setThemeForm((f) => ({ ...f, fontFamily: e.target.value }))}
                className="input"
              >
                {['Inter', 'Roboto', 'Poppins', 'Nunito', 'Open Sans', 'Lato'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bordas</label>
              <select
                value={themeForm.borderRadius}
                onChange={(e) => setThemeForm((f) => ({ ...f, borderRadius: e.target.value }))}
                className="input"
              >
                <option value="0">Sem arredondamento</option>
                <option value="0.25rem">Pequeno</option>
                <option value="0.5rem">Médio</option>
                <option value="0.75rem">Grande</option>
                <option value="1rem">Extra grande</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-400 mb-2">Preview</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-white text-sm rounded" style={{ backgroundColor: themeForm.primaryColor, borderRadius: themeForm.borderRadius }}>
                Botão Principal
              </button>
              <button className="px-4 py-2 text-white text-sm rounded" style={{ backgroundColor: themeForm.secondaryColor, borderRadius: themeForm.borderRadius }}>
                Secundário
              </button>
              <span className="px-3 py-1 text-white text-xs rounded-full self-center" style={{ backgroundColor: themeForm.accentColor }}>
                Badge
              </span>
            </div>
          </div>

          <button
            onClick={() => themeMutation.mutate(themeForm)}
            disabled={themeMutation.isPending}
            className="btn-primary"
          >
            {themeMutation.isPending ? 'Salvando...' : 'Salvar Aparência'}
          </button>
        </div>
      )}

      {tab === 'services' && (
        <div className="card max-w-2xl space-y-6">
          <h2 className="font-semibold text-gray-900">Serviços Oferecidos</h2>

          <div className="space-y-2">
            {services.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.durationMin}min · R$ {Number(s.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Adicionar Serviço</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Nome do serviço"
                value={newService.name}
                onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
              />
              <input
                type="number"
                className="input"
                placeholder="Duração (min)"
                value={newService.durationMin}
                onChange={(e) => setNewService((s) => ({ ...s, durationMin: Number(e.target.value) }))}
              />
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="Preço (R$)"
                value={newService.price}
                onChange={(e) => setNewService((s) => ({ ...s, price: Number(e.target.value) }))}
              />
              <input
                type="color"
                className="input h-10"
                value={newService.color}
                onChange={(e) => setNewService((s) => ({ ...s, color: e.target.value }))}
              />
            </div>
            <button
              onClick={() => {
                servicesMutation.mutate(newService);
                setNewService({ name: '', durationMin: 60, price: 0, color: '#6366f1' });
              }}
              className="btn-primary mt-3"
            >
              Adicionar Serviço
            </button>
          </div>
        </div>
      )}

      {tab === 'whatsapp' && (
        <div className="card max-w-xl space-y-4">
          <h2 className="font-semibold text-gray-900">Integração WhatsApp</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            Configure a Evolution API para habilitar WhatsApp. Insira a instância criada no painel da API.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Instância</label>
            <input className="input" placeholder="meu-petshop" />
          </div>
          <button
            onClick={() => settingsMutation.mutate({ whatsappEnabled: true })}
            className="btn-primary"
          >
            Salvar e Habilitar WhatsApp
          </button>
        </div>
      )}

      {tab === 'users' && (
        <div className="card max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4">Equipe</h2>
          <div className="space-y-2">
            {users.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {u.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
