import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/gemini';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, user_message } = await request.json();

    if (!conversation_id || !user_message) {
      return NextResponse.json(
        { error: 'conversation_id e user_message são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, business_name')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20);

    const conversationHistory = (messages || [])
      .filter(
        (m: { sender: string; sender_id: string | null }) =>
          m.sender !== 'user' || m.sender_id === user.id
      )
      .map((m: { sender: string; content: string }) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        parts: m.content,
      }));

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true);

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 });
    }

    const aiResponse = await generateAIResponse({
      apiKey,
      userMessage: user_message,
      conversationHistory,
      services: services || [],
      businessName: profile.business_name || 'FlowDesk AI',
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Error in /api/chat/generate:', error);
    return NextResponse.json({ error: 'Erro ao gerar resposta da IA' }, { status: 500 });
  }
}
