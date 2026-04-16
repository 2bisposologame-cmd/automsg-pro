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

export default function UserFeed() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.type !== 'USER') {
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

  const handleComplete = async (postId: string) => {
    setCompleting(postId);
    try {
      await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId: 'like', postId }),
      });
      alert('Post marcado como concluído! ✅');
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(null);
    }
  };

  if (!user) return null;

  const getInstagramPostId = (url: string) => {
    const match = url.match(/instagram\.com\/p\/([^/?]+)/);
    return match ? match[1] : '';
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar title="Feed do Dia" />
        <div className="divas-content">
          <div className="divas-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">📱 Posts de Hoje</h3>
                <p className="text-gray-500 text-sm mt-1">Engaje com os posts do grupo</p>
              </div>
              <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm">
                {posts.length} posts
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum post disponível hoje</p>
                <p className="text-gray-400 text-sm mt-2">Volte mais tarde!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border border-gray-100 rounded-xl p-4 hover:border-pink-200 transition-colors">
                    <div className="flex items-start gap-4">
                      {post.imageUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {post.caption || 'Post do Instagram'}
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          Adicionado por {post.user.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <a
                        href={post.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-pink-500 text-white text-center py-2.5 rounded-lg font-medium hover:bg-pink-600 transition-colors"
                      >
                        🔗 Ir para Post
                      </a>
                      <button
                        onClick={() => handleComplete(post.id)}
                        disabled={completing === post.id}
                        className="flex-1 bg-green-500 text-white py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {completing === post.id ? '...' : '✅ Concluído'}
                      </button>
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