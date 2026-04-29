'use client';
import { useState, useRef } from 'react';

export default function CompliancePlatform() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!text && !pdfFile) return alert("Cole o texto do contrato ou selecione um PDF primeiro!");
    
    setLoading(true);
    try {
      let response;
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        response = await fetch('/api/audit', {
          method: 'POST',
          headers: {
            'x-filename': pdfFile.name
          },
          body: formData,
        });
      } else {
        response = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractText: text }),
        });
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("Erro ao analisar. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  async function handleLogout() {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
          <div>
            <h1 style={{ color: '#1a73e8', fontSize: '2.8rem', marginBottom: '10px', margin: 0 }}>🛡️ Audit.AI</h1>
            <p style={{ color: '#5f6368', fontSize: '1.2rem', margin: 0 }}>Análise profissional de conformidade LGPD instantânea.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => window.location.href = '/historico'} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '6px', cursor: 'pointer' }}>
              Histórico
            </button>
            <button onClick={() => window.location.href = '/planos'} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '6px', cursor: 'pointer' }}>
              Planos
            </button>
            <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Sair
            </button>
          </div>
      </header>

      <section style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#3c4043' }}>
          Texto do Contrato ou Política de Privacidade:
        </label>
        <textarea
          suppressHydrationWarning
          placeholder="Cole o conteúdo aqui..."
          style={{ 
            width: '100%', height: '300px', padding: '15px', borderRadius: '8px', 
            border: '1px solid #dadce0', fontSize: '16px', marginBottom: '20px',
            resize: 'vertical', outlineColor: '#1a73e8'
          }}
          onChange={(e) => { setText(e.target.value); setPdfFile(null); }}
          value={text}
        />
        
        <input
          suppressHydrationWarning
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPdfFile(file);
              setText('');
            }
          }}
          accept=".pdf"
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#1a73e8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}
        >
          📄 Importar PDF
        </button>
        {pdfFile && (
          <p style={{ textAlign: 'center', color: '#5f6368', marginBottom: '20px', fontSize: '14px' }}>
            Arquivo selecionado: {pdfFile.name}
          </p>
        )}
        
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            width: '100%', padding: '15px', backgroundColor: loading ? '#ccc' : '#1a73e8',
            color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          {loading ? 'Analisando Riscos...' : 'Iniciar Auditoria Gratuita'}
        </button>
      </section>

      {result && (
        <section style={{ 
          marginTop: '40px', padding: '30px', backgroundColor: '#fff', 
          borderRadius: '12px', border: '2px solid', borderColor: result.status === 'crítico' ? '#d93025' : '#188038' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#202124' }}>Relatório de Auditoria</h2>
            <span style={{ 
              padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', textTransform: 'uppercase',
              backgroundColor: result.status === 'crítico' ? '#fce8e6' : '#e6f4ea',
              color: result.status === 'crítico' ? '#d93025' : '#188038'
            }}>
              {result.status}
            </span>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              Score de Conformidade: <span style={{ color: '#1a73e8' }}>{result.score}/100</span>
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ color: '#d93025', fontSize: '1.1rem' }}>🚩 Riscos Identificados:</h3>
              <ul style={{ paddingLeft: '20px' }}>
                {(result.riscos || []).map((r: string, index: number) => <li key={index} style={{ marginBottom: '8px' }}>{r}</li>)}
              </ul>
            </div>
            <div>
              <h3 style={{ color: '#188038', fontSize: '1.1rem' }}>💡 Sugestões de Melhoria:</h3>
              <ul style={{ paddingLeft: '20px' }}>
                {(result.sugestoes || []).map((s: string, index: number) => <li key={index} style={{ marginBottom: '8px' }}>{s}</li>)}
              </ul>
            </div>
          </div>
        </section>
      )}
      
      <footer style={{ marginTop: '60px', textAlign: 'center', fontSize: '0.8rem', color: '#70757a' }}>
        Aviso: Esta auditoria é realizada por inteligência artificial e não substitui o parecer jurídico de um advogado.
      </footer>
    </main>
  );
}