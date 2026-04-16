'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface DashboardData {
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  activeUsers: number;
}

export default function UserDashboard() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    completedTasks: 0,
    totalTasks: 0,
    completionRate: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    if (isLoading) return;

    if (!user || user.type !== 'USER') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setData(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [user, token, router, isLoading]);

  if (isLoading || !user) return null;

  const tasksRemaining = data.totalTasks - data.completedTasks;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar title="Dashboard" />
        <div className="divas-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="divas-card p-6">
              <p className="text-gray-500 text-sm mb-1">Tarefas Hoje</p>
              <p className="text-3xl font-bold text-pink-500">
                {data.completedTasks}/{data.totalTasks}
              </p>
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all"
                  style={{ width: `${data.completionRate}%` }}
                />
              </div>
            </div>

            <div className="divas-card p-6">
              <p className="text-gray-500 text-sm mb-1">Restam</p>
              <p className="text-3xl font-bold text-gray-800">{tasksRemaining}</p>
              <p className="text-xs text-gray-400 mt-2">tarefas para hoje</p>
            </div>

            <div className="divas-card p-6">
              <p className="text-gray-500 text-sm mb-1">Progresso</p>
              <p className="text-3xl font-bold text-green-500">{data.completionRate}%</p>
              <p className="text-xs text-gray-400 mt-2">de engajamento</p>
            </div>

            <div className="divas-card p-6">
              <p className="text-gray-500 text-sm mb-1">Status</p>
              <p className={`text-xl font-bold ${user.status === 'ACTIVE' ? 'text-green-500' : 'text-yellow-500'}`}>
                {user.status === 'ACTIVE' ? '✅ Ativa' : user.status === 'PENDING' ? '⏳ Pendente' : '❌ Inativa'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {user.status === 'ACTIVE' ? 'Participando normalmente' : 'Aguardando aprovação'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="divas-card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">📋 Próximas Tarefas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Curtir posts do feed</span>
                  <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded">5 pontos</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Comentar nos posts</span>
                  <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded">10 pontos</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Seguir novas contas</span>
                  <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded">8 pontos</span>
                </div>
              </div>
            </div>

            <div className="divas-card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">📱 Feed do Dia</h3>
              <p className="text-gray-500 text-sm mb-4">Posts de hoje para engajar</p>
              <button 
                onClick={() => router.push('/dashboard/feed')}
                className="divas-btn w-full"
              >
                Ver Feed do Dia →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}