'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  Package,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Zap,
  FileText,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Conversas', href: '/chat', icon: MessageSquare },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Orçamentos', href: '/orcamentos', icon: FileText },
  { name: 'Serviços', href: '/servicos', icon: Package },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 border-b border-gray-100 p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-200">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">FlowDesk</span>
          </Link>
          <button
            className="ml-auto rounded-md p-1.5 hover:bg-gray-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="mb-3">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Menu Principal
            </p>
          </div>
          {navigation.slice(0, 1).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn('h-4 w-4', isActive ? 'text-blue-600' : '')} />
                {item.name}
              </Link>
            );
          })}

          <div className="mb-3 mt-6">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Gestão
            </p>
          </div>
          {navigation.slice(1, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn('h-4 w-4', isActive ? 'text-blue-600' : '')} />
                {item.name}
              </Link>
            );
          })}

          <div className="mb-3 mt-6">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Sistema
            </p>
          </div>
          {navigation.slice(4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn('h-4 w-4', isActive ? 'text-blue-600' : '')} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <span className="text-sm font-semibold text-white">
                {user?.user_metadata?.name?.[0]?.toUpperCase() ||
                  user?.email?.[0]?.toUpperCase() ||
                  'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0]}
              </p>
              <p className="truncate text-xs text-gray-500">Plano Grátis</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md lg:hidden">
          <button className="rounded-md p-2 hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">FlowDesk</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
