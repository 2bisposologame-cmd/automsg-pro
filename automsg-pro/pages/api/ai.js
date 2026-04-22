import { sanitizeError, handleApiError } from '../../lib/errors.js';
import { checkRateLimit, getRateLimitInfo } from '../../lib/rateLimit.js';
import { getRequiredEnv } from '../../lib/env.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  
  if (!checkRateLimit(clientIp)) {
    const info = getRateLimitInfo(clientIp);
    res.setHeader('X-RateLimit-Limit', info.limit);
    res.setHeader('X-RateLimit-Remaining', info.remaining);
    res.setHeader('X-RateLimit-Reset', info.resetIn);
    return res.status(429).json({ error: 'Muitas requisições. Aguarde alguns segundos.' });
  }

  const { prompt, customApiKey } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt é obrigatório' });
  }

  if (prompt.length > 5000) {
    return res.status(400).json({ error: 'Prompt muito longo. Máximo 5000 caracteres.' });
  }

  const apiKey = (customApiKey || process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key não configurada. Configure em Ajustes.' });
  }

  try {
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  } catch (e) {
    console.error('Env validation failed:', e);
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || "";
      
      if (msg.includes("API key not valid")) {
        return res.status(401).json({ error: "Chave de API inválida. Verifique em Ajustes." });
      }
      if (msg.includes("quota")) {
        return res.status(429).json({ error: "Cota excedida. Tente novamente ou use uma chave própria." });
      }
      return res.status(response.status).json({ error: msg || 'Erro na API do Google' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ text });
  } catch (error) {
    console.error('AI API Error:', error);
    return res.status(500).json({ error: 'Falha na conexão. Tente novamente.' });
  }
}