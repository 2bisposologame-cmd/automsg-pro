import { NextResponse } from 'next/server';
import { checkGeminiConnection } from '@/lib/ai/gemini';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key do Gemini não configurada nas variáveis de ambiente (.env.local)' },
        { status: 500 }
      );
    }

    const result = await checkGeminiConnection(apiKey);

    if (result.success) {
      return NextResponse.json({ connected: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Falha ao conectar com Gemini' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error testing AI connection:', error);
    return NextResponse.json(
      { error: 'Erro ao testar conexão: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
