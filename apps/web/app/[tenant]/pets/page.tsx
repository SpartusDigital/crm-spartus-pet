'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PawPrint, Search, Plus, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import PetModal from '@/components/pets/PetModal';
import dayjs from 'dayjs';

export default function PetsPage({ params }: { params: { tenant: string } }) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['pets'],
    queryFn: () => api.get('/pets'),
    // Desabilita refetch automático ao focar na janela — evita re-render
    // que causava perda de foco na barra de pesquisa.
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const filtered = useMemo(() =>
    pets.filter((p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.species.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.name.toLowerCase().includes(search.toLowerCase()),
    ),
    [pets, search],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pets</h1>
          <p className="text-gray-500 text-sm">{pets.length} pet(s) cadastrado(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Novo Pet
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome, espécie ou dono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((pet: any) => (
            <Link key={pet.id} href={`/${params.tenant}/pets/${pet.id}`}>
              <div className="card hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    {pet.photoUrl ? (
                      <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint size={24} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {pet.name}
                      </h3>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-gray-500">{pet.species} {pet.breed ? `· ${pet.breed}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-1">Dono: {pet.customer?.name}</p>
                    {pet.birthDate && (
                      <p className="text-xs text-gray-400">
                        Nasc: {dayjs(pet.birthDate).format('DD/MM/YYYY')}
                        {' · '}
                        {dayjs().diff(dayjs(pet.birthDate), 'year')} anos
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-4 pt-3 border-t border-gray-50">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">{pet._count?.appointments ?? 0}</p>
                    <p className="text-xs text-gray-400">Visitas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">{pet._count?.records ?? 0}</p>
                    <p className="text-xs text-gray-400">Registros</p>
                  </div>
                  {pet.weight && (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900">{Number(pet.weight).toFixed(1)}kg</p>
                      <p className="text-xs text-gray-400">Peso</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <PawPrint size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">Nenhum pet encontrado</p>
        </div>
      )}

      <PetModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
