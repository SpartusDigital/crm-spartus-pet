'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Toggle, Plus, Zap } from 'lucide-react';
import api from '@/lib/api';

const TRIGGER_LABELS: Record<string, string> = {
  APPOINTMENT_CREATED: 'Agendamento criado',
  APPOINTMENT_CONFIRMED: 'Agendamento confirmado',
  APPOINTMENT_COMPLETED: 'Atendimento concluído',
  APPOINTMENT_CANCELLED: 'Agendamento cancelado',
  HOURS_24_BEFORE: '24h antes do agendamento',
  HOURS_2_BEFORE: '2h antes do agendamento',
  PET_BIRTHDAY: 'Aniversário do pet',
  NO_VISIT_30_DAYS: 'Sem visita há 30 dias',
  NO_VISIT_60_DAYS: 'Sem visita há 60 dias',
  VACCINE_DUE: 'Vacina próxima do vencimento',
};

export default function AutomacoesPage() {
  const qc = useQueryClient();

  const { data: automations = [] } = useQuery({
    queryKey: ['automations'],
    queryFn: () => api.get('/automations'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: any) => api.patch(`/automations/${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automações</h1>
          <p className="text-gray-500 text-sm">Mensagens e ações automáticas via WhatsApp</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nova Automação
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {automations.map((auto: any) => {
          const actions = auto.actions as any[];
          return (
            <div key={auto.id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${auto.active ? 'bg-primary/10' : 'bg-gray-100'}`}>
                    <Zap size={20} className={auto.active ? 'text-primary' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{auto.name}</p>
                    <span className="badge bg-gray-100 text-gray-600 mt-1">
                      {TRIGGER_LABELS[auto.trigger] ?? auto.trigger}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleMutation.mutate({ id: auto.id, active: !auto.active })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${auto.active ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${auto.active ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {actions?.map((action: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Mensagem WhatsApp</p>
                  <p className="text-sm text-gray-700">{action.template}</p>
                </div>
              ))}

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
                <span>{auto.runCount} execuções</span>
                {auto.lastRunAt && (
                  <span>Última: {new Date(auto.lastRunAt).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {automations.length === 0 && (
        <div className="text-center py-16">
          <Bot size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">Nenhuma automação configurada</p>
          <p className="text-xs text-gray-300 mt-1">Execute o seed para carregar automações padrão</p>
        </div>
      )}

      <div className="card bg-blue-50 border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">Variáveis disponíveis nas mensagens</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['{cliente}', '{pet}', '{servico}', '{data}', '{hora}', '{valor}'].map((v) => (
            <code key={v} className="text-xs bg-white text-blue-700 px-2 py-1 rounded border border-blue-200">
              {v}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
