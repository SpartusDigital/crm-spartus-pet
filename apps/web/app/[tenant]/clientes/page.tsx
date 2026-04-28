'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Plus, Phone, Mail, PawPrint } from 'lucide-react';
import api from '@/lib/api';
import CustomerModal from '@/components/customers/CustomerModal';

export default function ClientesPage({ params }: { params: { tenant: string } }) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get(`/customers${search ? `?search=${search}` : ''}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm">{customers.length} cliente(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome, telefone ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Cliente</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden md:table-cell">Contato</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden lg:table-cell">Pets</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Visitas</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {c.name[0]}
                      </div>
                      <p className="font-medium text-gray-900">{c.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Phone size={12} /><span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Mail size={12} /><span>{c.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1 flex-wrap">
                      {c.pets?.map((p: any) => (
                        <span key={p.id} className="flex items-center gap-1 badge bg-primary/10 text-primary">
                          <PawPrint size={10} />{p.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{c._count?.appointments ?? 0}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setSelected(c); setModalOpen(true); }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="py-12 text-center">
              <Users size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      )}

      <CustomerModal open={modalOpen} onClose={() => setModalOpen(false)} customer={selected} />
    </div>
  );
}
