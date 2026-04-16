'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  type: string;
  description: string;
  points: number;
}

export default function UserTasks() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.type !== 'USER') {
      router.push('/');
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, token, router]);

  const getTaskIcon = (type: string) => {
    const icons: Record<string, string> = {
      LIKE: '❤️',
      COMMENT: '💬',
      FOLLOW: '👤',
    };
    return icons[type] || '✅';
  };

  if (!user) return null;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar title="Minhas Tarefas" />
        <div className="divas-content">
          <div className="divas-card p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">✅ Tarefas do Dia</h3>
            <p className="text-gray-500 text-sm mb-6">Complete as tarefas para ganhar pontos</p>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma tarefa disponível</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-pink-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl">
                        {getTaskIcon(task.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{task.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Tipo: {task.type === 'LIKE' ? 'Curtir' : task.type === 'COMMENT' ? 'Comentar' : 'Seguir'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                        +{task.points} pts
                      </span>
                      <a
                        href="/dashboard/feed"
                        className="text-pink-500 hover:text-pink-600 text-sm font-medium"
                      >
                        Ver posts →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="divas-card p-6 mt-6">
            <h3 className="font-semibold text-gray-800 mb-4">📊 Sua Progressão</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-pink-500">0</p>
                <p className="text-xs text-gray-500 mt-1">Curtidas</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-pink-500">0</p>
                <p className="text-xs text-gray-500 mt-1">Comentários</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-pink-500">0</p>
                <p className="text-xs text-gray-500 mt-1">Seguindo</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}