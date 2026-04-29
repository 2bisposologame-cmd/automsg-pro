'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.error) setMessage(data.error);
    else window.location.href = '/';
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await (await import('@/lib/supabase')).supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage('Verifique seu e-mail para confirmação!');
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1a73e8' }}>🔐 Audit.AI - Login</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
        <input
          suppressHydrationWarning
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dadce0' }}
          required
        />
        <input
          suppressHydrationWarning
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dadce0' }}
          required
        />
        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <button type="button" onClick={handleSignUp} disabled={loading} style={{ padding: '12px', backgroundColor: 'transparent', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '8px', cursor: 'pointer' }}>
          Cadastrar-se
        </button>
      </form>
      {message && <p style={{ textAlign: 'center', color: '#d93025', marginTop: '15px' }}>{message}</p>}
    </main>
  );
}
