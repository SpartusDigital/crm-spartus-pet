'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { X, CheckCircle, XCircle, Clock, type LucideIcon } from 'lucide-react';
import api from '@/lib/api';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  onClose: () => void;
  appointment?: any;
  defaultDate?: string | null;
}

export default function AppointmentModal({ open, onClose, appointment, defaultDate }: Props) {
  const qc = useQueryClient();
  const isEdit = !!appointment?.id;

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      customerId: appointment?.customerId ?? '',
      petId: appointment?.petId ?? '',
      serviceId: appointment?.serviceId ?? '',
      assignedToId: appointment?.assignedToId ?? '',
      startsAt: appointment?.startsAt ? dayjs(appointment.startsAt).format('YYYY-MM-DDTHH:mm') : defaultDate ?? '',
      notes: appointment?.notes ?? '',
    },
  });

  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => api.get('/customers') });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: () => api.get('/services') });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/tenants/users') });

  const customerId = watch('customerId');
  const serviceId = watch('serviceId');

  const { data: pets = [] } = useQuery({
    queryKey: ['pets', customerId],
    queryFn: () => api.get(`/pets?customerId=${customerId}`),
    enabled: !!customerId,
  });

  const selectedService = services.find((s: any) => s.id === serviceId);

  // --- PDV: desconto / ajuste de valor ---
  const [finalPrice, setFinalPrice] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountInput, setDiscountInput] = useState('');

  const basePrice = Number(appointment?.price ?? selectedService?.price ?? 0);

  // Reinicia o preço final sempre que o serviço selecionado muda
  useEffect(() => {
    setFinalPrice(Number(appointment?.price ?? selectedService?.price ?? 0));
    setDiscountInput('');
  }, [selectedService?.id]);

  const applyDiscount = (val: string, type: 'percent' | 'fixed') => {
    const num = parseFloat(val) || 0;
    const base = Number(appointment?.price ?? selectedService?.price ?? 0);
    if (type === 'percent') {
      setFinalPrice(Math.max(0, base * (1 - num / 100)));
    } else {
      setFinalPrice(Math.max(0, base - num));
    }
  };

  const handleDiscountInput = (val: string) => {
    setDiscountInput(val);
    applyDiscount(val, discountType);
  };

  const handleDiscountType = (type: 'percent' | 'fixed') => {
    setDiscountType(type);
    setDiscountInput('');
    setFinalPrice(basePrice);
  };
  // --- fim PDV ---

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/appointments', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); onClose(); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/appointments/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); onClose(); },
  });

  const onSubmit = (data: any) => {
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(startsAt.getTime() + (selectedService?.durationMin ?? 60) * 60000);

    const payload = { ...data, endsAt: endsAt.toISOString() };
    if (isEdit) updateMutation.mutate({ id: appointment.id, data: payload });
    else createMutation.mutate(payload);
  };

  // Ao concluir, envia o preço final ajustado (com desconto se houver)
  const handleStatusAction = (value: string) => {
    const data: any = { status: value };
    if (value === 'COMPLETED') data.price = finalPrice > 0 ? finalPrice : basePrice;
    updateMutation.mutate({ id: appointment.id, data });
  };

  type StatusAction = { label: string; value: string; icon: LucideIcon; color: string };
  const statusActions: StatusAction[] = appointment ? [
    { label: 'Confirmar', value: 'CONFIRMED', icon: CheckCircle, color: 'text-blue-600' },
    { label: 'Iniciar', value: 'IN_PROGRESS', icon: Clock, color: 'text-yellow-600' },
    { label: 'Concluir', value: 'COMPLETED', icon: CheckCircle, color: 'text-green-600' },
    { label: 'Cancelar', value: 'CANCELLED', icon: XCircle, color: 'text-red-600' },
  ] : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-lg text-gray-900">
            {isEdit ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {isEdit && (
          <>
            <div className="px-6 py-3 border-b flex gap-2 flex-wrap">
              {statusActions.map((action) => (
                <button
                  key={action.value}
                  onClick={() => handleStatusAction(action.value)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-gray-50 ${action.color}`}
                >
                  <action.icon size={13} />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Campo de desconto / ajuste de valor — PDV */}
            {basePrice > 0 && (
              <div className="px-6 py-4 border-b bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ajuste de Valor</p>
                <div className="flex items-center gap-3 mb-3 text-sm">
                  <span className="text-gray-500">Valor do serviço:</span>
                  <span className="font-medium text-gray-800">
                    R$ {basePrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-500">Desconto:</span>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => handleDiscountType('percent')}
                      className={`px-3 py-1.5 transition-colors ${discountType === 'percent' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >%</button>
                    <button
                      type="button"
                      onClick={() => handleDiscountType('fixed')}
                      className={`px-3 py-1.5 transition-colors ${discountType === 'fixed' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >R$</button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={discountInput}
                    onChange={(e) => handleDiscountInput(e.target.value)}
                    className="input w-24 text-sm"
                  />
                  <span className="text-gray-400">→</span>
                  <span className="text-xs text-gray-500">Valor final:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={finalPrice}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setFinalPrice(v);
                      setDiscountInput('');
                    }}
                    className="input w-28 text-sm font-bold text-primary"
                  />
                  {finalPrice < basePrice && basePrice > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      (-R$ {(basePrice - finalPrice).toFixed(2).replace('.', ',')})
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select {...register('customerId', { required: true })} className="input">
                <option value="">Selecionar...</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet</label>
              <select {...register('petId', { required: true })} className="input" disabled={!customerId}>
                <option value="">Selecionar...</option>
                {pets.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
            <select {...register('serviceId', { required: true })} className="input">
              <option value="">Selecionar...</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} — R$ {Number(s.price).toFixed(2)} ({s.durationMin}min)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
              <input type="datetime-local" {...register('startsAt', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
              <select {...register('assignedToId')} className="input">
                <option value="">Sem responsável</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea {...register('notes')} rows={3} className="input resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? 'Salvar' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
