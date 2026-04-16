'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface DashboardData {
  activeUsers: number;
  pendingUsers: number;
  completedTasks: number;
  totalTasks: number;
  postsToday: number;
  completionRate: number;
}

export default function AdminDashboard() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user || (user.type !== 'ADMIN' && user.type !== 'SUPERADMIN')) {
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

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar title="Dashboard Admin" />
        <div className="divas-content">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Olá, Administradora! 👑</h1>
            <p className="text-gray-500 mt-1">Veja o resumo do grupo hoje</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="divas-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">👥</span>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">+12%</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{data?.activeUsers || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Participantes Ativas</p>
            </div>

            <div className="divas-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">⏳</span>
                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">Novo</span>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{data?.pendingUsers || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Aguardando Aprovação</p>
            </div>

            <div className="divas-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <p className="text-3xl font-bold text-pink-500">{data?.postsToday || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Posts Hoje</p>
            </div>

            <div className="divas-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-green-500">{data?.completionRate || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Taxa de Conclusão</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="divas-card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">📊 Progresso Geral</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Tarefas Concluídas</span>
                    <span className="font-medium">{data?.completedTasks || 0} / {data?.totalTasks || 0}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-400 to-pink-500"
                      style={{ width: `${data?.completionRate || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="divas-card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">⚡ Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => router.push('/admin/users')}
                  className="p-4 bg-pink-50 rounded-xl text-left hover:bg-pink-100 transition-colors"
                >
                  <span className="text-2xl">👥</span>
                  <p className="font-medium text-gray-800 mt-2">Ver Participantes</p>
                </button>
                <button 
                  onClick={() => router.push('/admin/posts')}
                  className="p-4 bg-pink-50 rounded-xl text-left hover:bg-pink-100 transition-colors"
                >
                  <span className="text-2xl">📱</span>
                  <p className="font-medium text-gray-800 mt-2">Adicionar Post</p>
                </button>
                <button 
                  onClick={() => router.push('/admin/tasks')}
                  className="p-4 bg-pink-50 rounded-xl text-left hover:bg-pink-100 transition-colors"
                >
                  <span className="text-2xl">✅</span>
                  <p className="font-medium text-gray-800 mt-2">Criar Tarefa</p>
                </button>
                <button 
                  onClick={() => router.push('/admin/reports')}
                  className="p-4 bg-pink-50 rounded-xl text-left hover:bg-pink-100 transition-colors"
                >
                  <span className="text-2xl">📈</span>
                  <p className="font-medium text-gray-800 mt-2">Ver Relatórios</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}