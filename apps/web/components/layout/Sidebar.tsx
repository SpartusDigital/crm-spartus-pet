'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, PawPrint, Users, DollarSign,
  MessageSquare, Bot, Settings, LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import type { TenantConfig } from '@/lib/tenant';
import { clsx } from 'clsx';

interface Props {
  tenant: string;
  config: TenantConfig;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { label: 'Agenda', icon: Calendar, path: 'agenda' },
  { label: 'Pets', icon: PawPrint, path: 'pets' },
  { label: 'Clientes', icon: Users, path: 'clientes' },
  { label: 'Financeiro', icon: DollarSign, path: 'financeiro' },
  { label: 'WhatsApp', icon: MessageSquare, path: 'whatsapp' },
  { label: 'Automações', icon: Bot, path: 'automacoes' },
  { label: 'Configurações', icon: Settings, path: 'configuracoes' },
];

export default function Sidebar({ tenant, config }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {config.theme?.logoUrl ? (
            <img src={config.theme.logoUrl} alt={config.name} className="h-9 w-auto object-contain" />
          ) : (
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
              🐾
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{config.name}</p>
            <p className="text-xs text-gray-400">{config.settings.petTypeLabel} Shop</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const href = `/${tenant}/${item.path}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={item.path}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
