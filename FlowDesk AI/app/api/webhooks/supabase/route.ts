import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/gemini';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, table, record, old_record } = body;

    if (type !== 'INSERT' || table !== 'messages') {
      return NextResponse.json({ received: true });
    }

    if (record.sender !== 'client') {
      return NextResponse.json({ received: true, skipped: 'not a client message' });
    }

    const supabase = await createServiceRoleClient();

    const { data: conversation } = await supabase
      .from('conversations')
      .select('*, profiles!inner(business_name)')
      .eq('id', record.conversation_id)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', conversation.tenant_id)
      .eq('is_active', true);

    const { data: previousMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', record.conversation_id)
      .order('created_at', { ascending: true })
      .limit(20);

    const conversationHistory = (previousMessages || [])
      .filter((m) => m.sender !== 'user')
      .map((m) => ({
        role: m.sender === 'assistant' ? ('model' as const) : ('user' as const),
        parts: m.content,
      }));

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    const aiResponse = await generateAIResponse({
      apiKey,
      userMessage: record.content,
      conversationHistory,
      services: services || [],
      businessName: conversation.profiles?.business_name || 'FlowDesk AI',
    });

    await supabase.from('messages').insert({
      conversation_id: record.conversation_id,
      tenant_id: conversation.tenant_id,
      sender: 'assistant',
      sender_id: null,
      content: aiResponse,
    });

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: aiResponse.substring(0, 100),
        ai_response_count: (conversation.ai_response_count || 0) + 1,
      })
      .eq('id', record.conversation_id);

    return NextResponse.json({ success: true, response: aiResponse });
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
