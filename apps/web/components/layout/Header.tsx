'use client';
import { Bell, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { TenantConfig } from '@/lib/tenant';

interface Props {
  tenant: string;
  config: TenantConfig;
}

export default function Header({ tenant, config }: Props) {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Buscar pets, clientes..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
            {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{session?.user?.name}</p>
            <p className="text-xs text-gray-400">{(session?.user as any)?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
