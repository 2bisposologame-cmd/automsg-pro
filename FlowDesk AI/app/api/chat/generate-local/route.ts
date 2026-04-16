import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateFakeAIResponse } from '@/lib/ai/fake-ai';

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

    const { conversation_id, user_message, use_real_ai = false } = await request.json();

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

    const { data: tenant } = await supabase
      .from('tenants')
      .select('ai_name, company_name')
      .eq('id', profile.tenant_id)
      .single();

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true);

    if (use_real_ai) {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (apiKey) {
        try {
          const { generateAIResponse } = await import('@/lib/ai/gemini');
          const aiResponse = await generateAIResponse({
            apiKey,
            userMessage: user_message,
            conversationHistory: [],
            services: services || [],
            businessName: tenant?.company_name || profile.business_name || 'FlowDesk AI',
          });

          return NextResponse.json({
            response: aiResponse,
            source: 'gemini',
          });
        } catch (aiError) {
          console.error('Real AI failed, falling back to fake AI:', aiError);
        }
      }
    }

    const fakeResponse = generateFakeAIResponse(user_message, services || [], {
      assistantName: tenant?.ai_name || 'Assistente',
      businessName: tenant?.company_name || profile.business_name || 'FlowDesk AI',
    });

    return NextResponse.json({
      response: fakeResponse,
      source: 'local',
    });
  } catch (error) {
    console.error('Error in /api/chat/generate-local:', error);
    return NextResponse.json({ error: 'Erro ao gerar resposta' }, { status: 500 });
  }
}
