'use server';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  unit: string | null;
  is_active: boolean;
}

export interface AIConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface GenerateResponseParams {
  apiKey: string;
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'model'; parts: string }>;
  services: Service[];
  businessName: string;
  config?: Partial<AIConfig>;
}

export async function generateAIResponse({
  apiKey,
  userMessage,
  conversationHistory,
  services,
  businessName,
  config = {},
}: GenerateResponseParams): Promise<string> {
  const model = config.model || 'gemini-2.0-flash';
  const { temperature = 0.7, maxOutputTokens = 1024 } = config;

  const serviceList = services
    .filter((s) => s.is_active)
    .map((s) => {
      let price = '';
      if (s.base_price !== null) {
        price = s.base_price > 0 ? ` - R$ ${s.base_price.toFixed(2).replace('.', ',')}` : '';
      }
      return `- ${s.name}${price}${s.description ? `: ${s.description}` : ''}`;
    })
    .join('\n');

  const systemPrompt = `Você é um assistente virtual amigável e profissional da empresa ${businessName}.
Seu papel é ajudar potenciais clientes com informações sobre serviços e produtos.

REGRAS IMPORTANTES:
1. Seja cordial, prestativo e mantenha um tom profissional
2. Use informações reais dos serviços da empresa quando disponível
3. NUNCA invente preços, serviços ou informações não fornecidas
4. Se não souber algo, seja honesto e diga que vai verificar
5. Ao final, sempre demonstre interesse em ajudar e Pergunte se há mais dúvidas
6. Mantenha as respostas curtas e objetivas (máximo 3-4 parágrafos)

SERVIÇOS DISPONÍVEIS:
${serviceList || 'Nenhum serviço cadastrado ainda'}`;

  const contents = conversationHistory.map((msg) => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.parts }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Resposta inválida da API do Gemini');
    }

    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

export async function checkGeminiConnection(
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const model = 'gemini-2.0-flash';
    const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Olá' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });

    if (response.ok) {
      return { success: true };
    }

    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      errorMessage = errorText || errorMessage;
    }

    return { success: false, error: errorMessage };
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha na conexão' };
  }
}
