'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

export default function TopBar({ title }: { title: string }) {
  const { user } = useAuth();
  const router = useRouter();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SUPERADMIN: 'Super Admin',
      ADMIN: 'Administradora',
      USER: 'Participante',
    };
    return labels[type] || type;
  };

  return (
    <header className="divas-topbar flex items-center justify-between px-8">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

      <div 
        className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
        onClick={() => router.push(user?.type === 'USER' ? '/dashboard/profile' : '/admin/profile')}
      >
        <div className="text-right">
          <p className="font-medium text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500">{getTypeLabel(user?.type || '')}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-pink-500 font-medium">{getInitials(user?.name || '')}</span>
          )}
        </div>
      </div>
    </header>
  );
}