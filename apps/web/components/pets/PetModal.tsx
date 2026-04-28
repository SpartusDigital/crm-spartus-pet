'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import api from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  pet?: any;
}

export default function PetModal({ open, onClose, pet }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: pet ?? { species: 'Cão' },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers'),
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      pet?.id ? api.patch(`/pets/${pet.id}`, data) : api.post('/pets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pets'] });
      onClose();
      reset();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-lg">{pet ? 'Editar Pet' : 'Cadastrar Pet'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dono</label>
            <select {...register('customerId', { required: true })} className="input">
              <option value="">Selecionar cliente...</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input {...register('name', { required: true })} className="input" placeholder="Ex: Rex" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
              <select {...register('species')} className="input">
                <option>Cão</option>
                <option>Gato</option>
                <option>Ave</option>
                <option>Coelho</option>
                <option>Roedor</option>
                <option>Réptil</option>
                <option>Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
              <input {...register('breed')} className="input" placeholder="Ex: Labrador" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select {...register('gender')} className="input">
                <option value="">Não informado</option>
                <option value="MALE">Macho</option>
                <option value="FEMALE">Fêmea</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nascimento</label>
              <input type="date" {...register('birthDate')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input type="number" step="0.1" {...register('weight')} className="input" placeholder="0.0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
              <input {...register('color')} className="input" placeholder="Ex: Caramelo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Microchip</label>
              <input {...register('microchip')} className="input" />
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
