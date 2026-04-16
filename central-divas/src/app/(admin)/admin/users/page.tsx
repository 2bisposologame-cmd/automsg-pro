'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  type: string;
  status: string;
  avatar?: string;
  createdAt: string;
}

export default function AdminUsers() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'INACTIVE'>('ALL');

  useEffect(() => {
    if (!user || (user.type !== 'ADMIN' && user.type !== 'SUPERADMIN')) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
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

    fetchUsers();
  }, [user, token, router]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = filter === 'ALL' ? users : users.filter(u => u.status === filter);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-red-100 text-red-700',
      REJECTED: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      ACTIVE: 'Ativa',
      INACTIVE: 'Inativa',
      REJECTED: 'Reprovada',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  if (!user) return null;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar title="Participantes" />
        <div className="divas-content">
          <div className="divas-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Todas as Participantes</h3>
              <div className="flex gap-2">
                {(['ALL', 'PENDING', 'ACTIVE', 'INACTIVE'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filter === f ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendentes' : f === 'ACTIVE' ? 'Ativas' : 'Inativas'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhuma participante encontrada</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Participante</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">WhatsApp</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-pink-500 text-sm font-medium">{u.name[0]}</span>
                              )}
                            </div>
                            <span className="font-medium text-gray-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{u.whatsapp || '-'}</td>
                        <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {u.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                                  className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600"
                                >
                                  Aprovar
                                </button>
                                <button
                                  onClick={() => handleStatusChange(u.id, 'REJECTED')}
                                  className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600"
                                >
                                  Reprovar
                                </button>
                              </>
                            )}
                            {u.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleStatusChange(u.id, 'INACTIVE')}
                                className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600"
                              >
                                Inativar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}