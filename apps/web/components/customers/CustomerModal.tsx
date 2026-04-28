'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import api from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  customer?: any;
}

export default function CustomerModal({ open, onClose, customer }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm({ defaultValues: customer ?? {} });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      customer?.id ? api.patch(`/customers/${customer.id}`, data) : api.post('/customers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      onClose();
      reset();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-lg">{customer ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input {...register('name', { required: true })} className="input" placeholder="Maria Silva" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone/WhatsApp</label>
              <input {...register('phone', { required: true })} className="input" placeholder="11999999999" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('email')} type="email" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input {...register('city')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input {...register('address')} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea {...register('notes')} rows={2} className="input resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
