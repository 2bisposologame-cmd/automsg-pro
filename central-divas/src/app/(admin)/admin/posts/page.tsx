'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  instagramUrl: string;
  caption?: string;
  imageUrl?: string;
  createdAt: string;
  user: { name: string };
}

export default function AdminPosts() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ instagramUrl: '', caption: '', imageUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || (user.type !== 'ADMIN' && user.type !== 'SUPERADMIN')) {
      router.push('/');
      return;
    }

    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts([data.post, ...posts]);
        setShowForm(false);
        setFormData({ instagramUrl: '', caption: '', imageUrl: '' });
        alert('Post adicionado! ✅');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar title="Posts do Dia" />
        <div className="divas-content">
          <div className="divas-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Gerenciar Posts</h3>
                <p className="text-gray-500 text-sm">Adicione posts para as participantes engajarem</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="divas-btn"
              >
                {showForm ? 'Cancelar' : '+ Adicionar Post'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-xl">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Link do Instagram *</label>
                    <input
                      type="url"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                      placeholder="https://www.instagram.com/p/..."
                      className="divas-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Caption (opcional)</label>
                    <textarea
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      placeholder="Descrição do post..."
                      className="divas-input min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">URL da Imagem (opcional)</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="divas-input"
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="divas-btn">
                    {submitting ? 'Adicionando...' : 'Adicionar Post'}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum post adicionado ainda</div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-pink-200">
                    {post.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-600 text-sm truncate">{post.caption || 'Post do Instagram'}</p>
                      <p className="text-gray-400 text-xs mt-1">Adicionado por {post.user.name}</p>
                    </div>
                    <a
                      href={post.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600 text-sm"
                    >
                      Ver ↗
                    </a>
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