'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    avatar: '',
  });

  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        const data = await res.json();
        if (data.url) {
          setFormData({ ...formData, avatar: data.url });
        }
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('Enviando dados para:', isLogin ? '/api/auth/login' : '/api/auth/register');
    console.log('isLogin:', isLogin);
    console.log('Payload:', formData);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('Resposta da API:', data);

      if (!res.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      alert(isLogin ? 'Login realizado!' : 'Conta criada com sucesso! 🎉');
      login(data.user, data.token);
      
      const cookieExpiry = 7 * 24 * 60 * 60;
      document.cookie = `divas_token=${data.token}; path=/; max-age=${cookieExpiry}; SameSite=Lax`;
      
      setTimeout(() => {
        if (data.user.type === 'USER') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/admin';
        }
      }, 200);
    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message);
      alert('Erro: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">👑 Central Divas</h1>
          <p className="text-gray-500">Plataforma de Engajamento</p>
        </div>

        <div className="divas-card p-8">
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                isLogin 
                  ? 'bg-white text-pink-500 shadow-sm' 
                  : 'text-gray-500'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                !isLogin 
                  ? 'bg-white text-pink-500 shadow-sm' 
                  : 'text-gray-500'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="text-center">
                  <label className="cursor-pointer inline-block">
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-pink-300 flex items-center justify-center overflow-hidden mx-auto mb-2">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">👤</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">Foto de perfil</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleChange}
                  className="divas-input"
                  required={!isLogin}
                />
                <input
                  type="tel"
                  name="whatsapp"
                  placeholder="WhatsApp (com DDD)"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="divas-input"
                />
              </>
            )}

            <input
              type="email"
              name="email"
              placeholder="Seu email"
              value={formData.email}
              onChange={handleChange}
              className="divas-input"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Sua senha"
              value={formData.password}
              onChange={handleChange}
              className="divas-input"
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="divas-btn w-full disabled:opacity-50"
            >
              {isLoading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            {isLogin ? 'Ainda não tem conta? ' : 'Já tem conta? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-pink-500 font-medium"
            >
              {isLogin ? 'Cadastrar' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}