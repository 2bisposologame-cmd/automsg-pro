'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PlanosPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPerfil();
  }, []);

  async function loadPerfil() {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { 
        console.error('Erro ao obter usuário:', userError?.message);
        router.push('/login'); 
        return; 
      }

      let { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error.message);
      }

      if (!data) {
        // Cria perfil gratuito com 5 créditos
        const { data: newPerfil, error: createError } = await supabase
          .from('perfis')
          .insert({ user_id: user.id, credits: 5, plano: 'gratuito' })
          .select()
          .single();
        
        if (createError) {
          console.error('Erro ao criar perfil:', createError.message);
        } else if (newPerfil) {
          data = newPerfil;
        }
      }
      
      if (data) setPerfil(data);
    } catch (err: any) {
      console.error('Erro geral:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function assinarPro() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const response = await fetch('/api/checkout', { method: 'POST' });
      const data = await response.json();
      
      if (data.error) {
        alert('Erro: ' + data.error);
        return;
      }

      // Redireciona para o checkout do Stripe (com Pix)
      window.location.href = data.url;
    } catch (error: any) {
      alert('Erro ao processar pagamento: ' + error.message);
    }
  }

  if (loading) return <p style={{ textAlign: 'center', padding: '50px' }}>Carregando...</p>;

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#1a73e8', fontSize: '1.8rem', margin: 0 }}>💳 Planos e Créditos</h1>
        <button onClick={() => router.push('/')} style={{ padding: '8px 16px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Voltar
        </button>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Plano Gratuito */}
        <div style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: perfil?.plano === 'gratuito' ? '2px solid #1a73e8' : '1px solid #e0e0e0' }}>
          <h2 style={{ marginTop: 0, color: '#3c4043' }}>Grátis</h2>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a73e8' }}>R$ 0</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '30px' }}>
            <li style={{ marginBottom: '8px' }}>5 auditorias gratuitas</li>
            <li style={{ marginBottom: '8px' }}>Histórico limitado</li>
            <li>Suporte por e-mail</li>
          </ul>
          <p style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Créditos restantes: <span style={{ color: '#1a73e8' }}>{perfil?.credits}</span>
          </p>
          {perfil?.plano === 'gratuito' && <p style={{ textAlign: 'center', color: '#188038', fontWeight: 'bold' }}>Plano Atual</p>}
        </div>

        {/* Plano Pro */}
        <div style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(26,115,232,0.2)', border: '2px solid #1a73e8' }}>
          <h2 style={{ marginTop: 0, color: '#3c4043' }}>Pro</h2>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a73e8' }}>R$ 29,90/mês</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '30px' }}>
            <li style={{ marginBottom: '8px' }}>Auditorias ilimitadas</li>
            <li style={{ marginBottom: '8px' }}>Download em PDF</li>
            <li style={{ marginBottom: '8px' }}>Suporte prioritário</li>
            <li>Relatórios detalhados</li>
          </ul>
          {perfil?.plano === 'pro' ? (
            <p style={{ textAlign: 'center', color: '#188038', fontWeight: 'bold' }}>Plano Atual</p>
          ) : (
            <button onClick={assinarPro} style={{ width: '100%', padding: '12px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Assinar Agora
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
