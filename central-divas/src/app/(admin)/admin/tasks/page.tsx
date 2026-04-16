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
  active: boolean;
}

export default function AdminTasks() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'LIKE', description: '', points: 1 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || (user.type !== 'ADMIN' && user.type !== 'SUPERADMIN')) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks([data.task, ...tasks]);
        setShowForm(false);
        setFormData({ type: 'LIKE', description: '', points: 1 });
        alert('Tarefa criada! ✅');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { LIKE: 'Curtir', COMMENT: 'Comentar', FOLLOW: 'Seguir' };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { LIKE: '❤️', COMMENT: '💬', FOLLOW: '👤' };
    return icons[type] || '✅';
  };

  if (!user) return null;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar title="Tarefas" />
        <div className="divas-content">
          <div className="divas-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Gerenciar Tarefas</h3>
                <p className="text-gray-500 text-sm">Crie tarefas diárias para as participantes</p>
              </div>
              <button onClick={() => setShowForm(!showForm)} className="divas-btn">
                {showForm ? 'Cancelar' : '+ Nova Tarefa'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="divas-input"
                    >
                      <option value="LIKE">Curtir ❤️</option>
                      <option value="COMMENT">Comentar 💬</option>
                      <option value="FOLLOW">Seguir 👤</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Curtir 5 posts"
                      className="divas-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Pontos</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      min={1}
                      className="divas-input"
                    />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="divas-btn mt-4">
                  {submitting ? 'Criando...' : 'Criar Tarefa'}
                </button>
              </form>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhuma tarefa criada ainda</div>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-pink-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl">
                        {getTypeIcon(task.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{task.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Tipo: {getTypeLabel(task.type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${task.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {task.active ? 'Ativa' : 'Inativa'}
                      </span>
                      <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm font-medium">
                        +{task.points} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}