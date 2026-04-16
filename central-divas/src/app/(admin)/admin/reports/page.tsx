'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminReports() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.type !== 'ADMIN' && user.type !== 'SUPERADMIN')) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token, router]);

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    pending: users.filter(u => u.status === 'PENDING').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length,
  };

  if (!user) return null;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar title="Relatórios" />
        <div className="divas-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="divas-card p-6 text-center">
              <p className="text-4xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-gray-500 text-sm mt-2">Total de Usuárias</p>
            </div>
            <div className="divas-card p-6 text-center">
              <p className="text-4xl font-bold text-green-500">{stats.active}</p>
              <p className="text-gray-500 text-sm mt-2">Ativas</p>
            </div>
            <div className="divas-card p-6 text-center">
              <p className="text-4xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-gray-500 text-sm mt-2">Pendentes</p>
            </div>
            <div className="divas-card p-6 text-center">
              <p className="text-4xl font-bold text-red-500">{stats.inactive}</p>
              <p className="text-gray-500 text-sm mt-2">Inativas</p>
            </div>
          </div>

          <div className="divas-card p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Estatísticas Detalhadas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Taxa de Participation</span>
                <span className="font-bold text-pink-500">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Usuárias Aguardando Aprovação</span>
                <span className="font-bold text-yellow-500">{stats.pending}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Usuárias Inativas</span>
                <span className="font-bold text-red-500">{stats.inactive}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}