'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

const menuItems = {
  USER: [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Feed do Dia', href: '/dashboard/feed', icon: '📱' },
    { label: 'Minhas Tarefas', href: '/dashboard/tasks', icon: '✅' },
    { label: 'Meu Perfil', href: '/dashboard/profile', icon: '👤' },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Participantes', href: '/admin/users', icon: '👥' },
    { label: 'Posts do Dia', href: '/admin/posts', icon: '📱' },
    { label: 'Tarefas', href: '/admin/tasks', icon: '✅' },
    { label: 'Relatórios', href: '/admin/reports', icon: '📈' },
  ],
  SUPERADMIN: [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Participantes', href: '/admin/users', icon: '👥' },
    { label: 'Posts do Dia', href: '/admin/posts', icon: '📱' },
    { label: 'Tarefas', href: '/admin/tasks', icon: '✅' },
    { label: 'Relatórios', href: '/admin/reports', icon: '📈' },
    { label: 'Admins', href: '/admin/admins', icon: '👑' },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const items = menuItems[user.type as keyof typeof menuItems];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="divas-sidebar flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-pink-500">👑 Central Divas</h1>
        <p className="text-xs text-gray-400 mt-1">2.0</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === item.href
                ? 'bg-pink-50 text-pink-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl w-full transition-all"
        >
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}