'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { generateReportPDF } from '@/lib/pdf-generator';

export default function HistoricoPage() {
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadRelatorios();
  }, []);

  async function loadRelatorios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('relatorios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setRelatorios(data || []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  function verRelatorio(item: any) {
    alert(`Relatório: ${item.nome_arquivo}\nScore: ${item.score}\nStatus: ${item.status}\n\nRiscos: ${item.riscos.join(', ')}\n\nSugestões: ${item.sugestoes.join(', ')}`);
  }

  function baixarPDF(item: any) {
    const doc = generateReportPDF(item);
    doc.save(`relatorio-audit-ai-${item.id}.pdf`);
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#1a73e8', fontSize: '1.8rem' }}>🛡️ Audit.AI - Histórico</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => router.push('/')} style={{ padding: '8px 16px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Nova Auditoria
          </button>
          <button onClick={() => router.push('/planos')} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '6px', cursor: 'pointer' }}>
            Planos
          </button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '6px', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </header>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#5f6368' }}>Carregando...</p>
      ) : relatorios.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#5f6368', marginTop: '50px' }}>
          Nenhuma auditoria realizada ainda. <a href="/" style={{ color: '#1a73e8' }}>Fazer primeira auditoria</a>
        </p>
      ) : (
        <section style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '15px', textAlign: 'left', color: '#3c4043' }}>Arquivo</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#3c4043' }}>Score</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#3c4043' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#3c4043' }}>Data</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#3c4043' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {relatorios.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '15px', color: '#202124' }}>{item.nome_arquivo}</td>
                  <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#1a73e8' }}>{item.score}/100</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem',
                      backgroundColor: item.status === 'crítico' ? '#fce8e6' : item.status === 'médio' ? '#fef7e0' : '#e6f4ea',
                      color: item.status === 'crítico' ? '#d93025' : item.status === 'médio' ? '#e37400' : '#188038'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center', color: '#5f6368', fontSize: '0.9rem' }}>
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => verRelatorio(item)} style={{ padding: '8px 16px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        Ver Detalhes
                      </button>
                      <button onClick={() => baixarPDF(item)} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '6px', cursor: 'pointer' }}>
                        📄 PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
