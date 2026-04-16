'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminProfile() {
  const { user, token, login } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    whatsapp: '',
    avatar: user?.avatar || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user?.id, ...formData }),
      });
      const data = await res.json();
      if (data.user) {
        login(data.user, token!);
        setIsEditing(false);
        alert('Perfil atualizado! ✅');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
        const data = await res.json();
        if (data.url) setFormData({ ...formData, avatar: data.url });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar title="Meu Perfil" />
        <div className="divas-content">
          <div className="divas-card p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <label className="cursor-pointer inline-block">
                <div className="w-28 h-28 rounded-full bg-gray-100 border-4 border-pink-100 flex items-center justify-center overflow-hidden mx-auto mb-3">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">👑</span>
                  )}
                </div>
                {isEditing && (
                  <>
                    <span className="text-xs text-pink-500">Alterar foto</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </>
                )}
              </label>
              <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-600">
                {user.type === 'SUPERADMIN' ? '👑 Super Admin' : '👑 Administradora'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="divas-input"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Email</label>
                <input type="email" value={formData.email} disabled className="divas-input bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  disabled={!isEditing}
                  placeholder="(11) 99999-9999"
                  className="divas-input"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              {isEditing ? (
                <>
                  <button onClick={handleSave} disabled={loading} className="divas-btn flex-1">
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="divas-btn divas-btn-secondary flex-1">
                    Cancelar
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="divas-btn w-full">
                  Editar Perfil
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}