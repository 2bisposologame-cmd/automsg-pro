import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export async function POST(request: NextRequest) {
  console.log('=== /api/chat/smart called ===');

  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          response: 'Olá! 😊 Como posso te ajudar hoje?',
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { response: 'Olá! 😊 Como posso te ajudar?', pendingBudget: null, budgetCreated: false },
        { status: 200 }
      );
    }

    const conversation_id = body?.conversation_id;
    const user_message = body?.user_message || '';
    const pending_budget_services = body?.pending_budget_services || [];

    if (!user_message) {
      return NextResponse.json(
        { response: 'Olá! 😊 Como posso te ajudar?', pendingBudget: null, budgetCreated: false },
        { status: 200 }
      );
    }

    // Buscar perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { response: 'Olá! 😊 Como posso te ajudar?', pendingBudget: null, budgetCreated: false },
        { status: 200 }
      );
    }

    // Buscar tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('ai_name, company_name')
      .eq('id', profile.tenant_id)
      .single();

    // Buscar serviços
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true);

    const activeServices = services || [];
    const assistantName = tenant?.ai_name || 'Assistente';
    const businessName = tenant?.company_name || profile.full_name || 'FlowDesk AI';

    console.log('User message:', user_message);
    console.log('Active services:', activeServices.length);

    // ============================================
    // LÓGICA DE INTENÇÃO - SEPARADA DA EXECUÇÃO
    // ============================================

    const message = user_message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    let intent = 'fallback';
    let intentConfidence = 0;

    // Detectar intenção com palavras-chave
    const intentPatterns = {
      services: {
        keywords: [
          'serviço',
          'serviços',
          'o que vocês fazem',
          'quais serviços',
          'fazem',
          'disponível',
          'oferece',
        ],
        weight: 1,
      },
      price: {
        keywords: [
          'preço',
          'valor',
          'quanto custa',
          'quanto fica',
          'valores',
          'barato',
          'caro',
          'orcamento',
          'orçamento',
        ],
        weight: 1,
      },
      schedule: {
        keywords: ['agendar', 'marcar', 'horário', 'disponibilidade'],
        weight: 1,
      },
      contact: {
        keywords: ['telefone', 'whatsapp', 'email', 'contato', 'endereço', 'local'],
        weight: 1,
      },
      duration: {
        keywords: ['tempo', 'duração', 'demora', 'minutos'],
        weight: 1,
      },
    };

    // Verificar intenção de orçamento pendente primeiro
    if (pending_budget_services && pending_budget_services.length > 0) {
      if (
        message.includes('sim') ||
        message.includes('confirm') ||
        message.includes('quero') ||
        message.includes('cria')
      ) {
        console.log('Intent: CONFIRM_BUDGET');
        return handleConfirmBudget(
          supabase,
          profile.tenant_id,
          conversation_id,
          pending_budget_services
        );
      }
      if (
        message.includes('não') ||
        message.includes('nao') ||
        message.includes('cancel') ||
        message.includes('desist')
      ) {
        console.log('Intent: CANCEL_BUDGET');
        return NextResponse.json(
          {
            response: `Entendi! 😊 Mãos livres para outro assunto. Como posso te ajudar?`,
            pendingBudget: null,
            budgetCreated: false,
          },
          { status: 200 }
        );
      }
      if (
        message.includes('adicionar') ||
        message.includes('mais') ||
        message.includes('incluir')
      ) {
        console.log('Intent: ADD_SERVICE');
        const additional = activeServices.filter(
          (s: any) =>
            !pending_budget_services.some((p: any) => p.id === s.id) &&
            (message.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(message))
        );
        if (additional.length > 0) {
          const updated = [...pending_budget_services, ...additional];
          return NextResponse.json(
            {
              response: generateBudgetPreview(updated),
              pendingBudget: updated,
              budgetCreated: false,
            },
            { status: 200 }
          );
        }
      }
    }

    // Detectar intenções na mensagem
    for (const [intentName, config] of Object.entries(intentPatterns)) {
      for (const keyword of config.keywords) {
        if (message.includes(keyword)) {
          intent = intentName;
          intentConfidence = config.weight;
          break;
        }
      }
      if (intent !== 'fallback') break;
    }

    console.log('Detected intent:', intent, '(confidence:', intentConfidence, ')');

    // ============================================
    // EXECUTAR RESPOSTA BASEADA NA INTENÇÃO
    // ============================================

    // INTENÇÃO: SERVICES - LISTAR SERVIÇOS
    if (intent === 'services') {
      console.log('Executing: LIST_SERVICES');

      if (activeServices.length === 0) {
        return NextResponse.json(
          {
            response: `Olá! 😊 Sou ${assistantName}.\n\nAinda não temos serviços cadastrados no momento. Em breve teremos muitas opções para você!`,
            pendingBudget: null,
            budgetCreated: false,
          },
          { status: 200 }
        );
      }

      const serviceList = activeServices.map((s: any) => `• ${s.name}`).join('\n');

      return NextResponse.json(
        {
          response: `Olá! 😊 Sou ${assistantName} da ${businessName}.\n\n📋 Nossos serviços:\n\n${serviceList}\n\nQuer saber os preços de algum serviço? É só perguntar! 😊`,
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    // INTENÇÃO: PRICE - MOSTRAR PREÇOS
    if (intent === 'price') {
      console.log('Executing: SHOW_PRICES');

      if (activeServices.length === 0) {
        return NextResponse.json(
          {
            response: `Ainda não temos serviços com preços cadastrados. 😊`,
            pendingBudget: null,
            budgetCreated: false,
          },
          { status: 200 }
        );
      }

      // Extrair serviços mencionados na mensagem
      const mentionedServices = activeServices.filter((s: any) => {
        const name = s.name.toLowerCase();
        return (
          message.includes(name) ||
          name.split(' ').some((word: string) => word.length > 3 && message.includes(word))
        );
      });

      let response = '';

      if (mentionedServices.length > 0) {
        const lines = mentionedServices.map((s: any) => {
          const price = Number(s.base_price || s.price || 0);
          return `• ${s.name}: ${price > 0 ? formatCurrency(price) : 'Sob consulta'}`;
        });
        response = `Aqui estão os valores:\n\n${lines.join('\n')}\n\nQuer que eu monte um orçamento? 😊`;
      } else {
        const lines = activeServices.slice(0, 10).map((s: any) => {
          const price = Number(s.base_price || s.price || 0);
          return `• ${s.name}: ${price > 0 ? formatCurrency(price) : 'Sob consulta'}`;
        });
        response = `Temos os seguintes preços:\n\n${lines.join('\n')}${activeServices.length > 10 ? '\n\n... e mais serviços' : ''}\n\nQuer saber sobre algum específico ou montar um orçamento? 😊`;
      }

      return NextResponse.json(
        {
          response,
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    // INTENÇÃO: SCHEDULE - AGENDAMENTO
    if (intent === 'schedule') {
      console.log('Executing: SCHEDULE_INFO');

      return NextResponse.json(
        {
          response: `Claro! 😊\n\nPara agendar um horário:\n• Nos envie uma mensagem pelo chat\n• Ligue para nosso telefone\n• Envie um WhatsApp\n\nQual serviço você gostaria de agendar?`,
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    // INTENÇÃO: CONTACT - CONTATO
    if (intent === 'contact') {
      console.log('Executing: CONTACT_INFO');

      return NextResponse.json(
        {
          response: `Claro! 😊\n\nVocê pode entrar em contato conosco:\n• Pelo chat aqui mesmo\n• Solicite que um atendente entre em contato\n\nEstamos aqui para ajudar!`,
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    // INTENÇÃO: DURATION - DURAÇÃO
    if (intent === 'duration') {
      console.log('Executing: DURATION_INFO');

      const servicesWithDuration = activeServices.filter((s: any) => s.duration_minutes);

      if (servicesWithDuration.length === 0) {
        return NextResponse.json(
          {
            response: `Boa pergunta! 😊 A duração varia de acordo com o serviço. Pergunte sobre algum específico!`,
            pendingBudget: null,
            budgetCreated: false,
          },
          { status: 200 }
        );
      }

      const lines = servicesWithDuration
        .slice(0, 5)
        .map((s: any) => `• ${s.name}: ~${s.duration_minutes} minutos`);

      return NextResponse.json(
        {
          response: `Duração aproximada:\n\n${lines.join('\n')}${servicesWithDuration.length > 5 ? '\n\n...' : ''}\n\n⏱️ Pode variar dependendo do caso. 😊`,
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    // ============================================
    // FALLBACK - SÓ AQUI, SE NENHUMA INTENÇÃO FOR DETECTADA
    // ============================================

    console.log('Executing: FALLBACK');

    // Verificar saudações
    const isGreeting = /^(oi|olá|ola|hi|hey|bom dia|boa tarde|boa noite|como vai|td bem)$/i.test(
      user_message.trim()
    );
    if (isGreeting) {
      return NextResponse.json(
        {
          response: `Olá! 😊 Sou ${assistantName}, assistente virtual da ${businessName}.\n\nComo posso te ajudar hoje?\n\n• Pergunte sobre nossos serviços\n• Solicite orçamentos\n• Tire dúvidas sobre preços`,
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    // Verificar agradecimentos
    if (/obrigado|obrigada|vlw|valeu|thanks|grato|grata/i.test(message)) {
      return NextResponse.json(
        {
          response: `De nada! 😊 Fico feliz em ajudar. Se tiver mais dúvidas, é só chamar!`,
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    // Verificar despedida
    if (/tchau|adeus|até mais|flw|até logo/i.test(message)) {
      return NextResponse.json(
        {
          response: `Foi um prazer ajudar! 😊 Até mais!`,
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    // Fallback genérico
    return NextResponse.json(
      {
        response: `Entendi! 😊\n\nPosso te ajudar com:\n• Informações sobre serviços\n• Preços e orçamentos\n• Agendamento\n\nO que você gostaria de saber?`,
        pendingBudget: null,
        budgetCreated: false,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('=== ERROR in /api/chat/smart ===');
    console.error(error);

    return NextResponse.json(
      {
        response: `Desculpe, tive um probleminha 😅 Mas posso te ajudar com serviços, preços ou orçamentos!`,
        pendingBudget: null,
        budgetCreated: false,
      },
      { status: 200 }
    );
  }
}

// Função separada para confirmar orçamento
async function handleConfirmBudget(
  supabase: any,
  tenant_id: string,
  conversation_id: string,
  pendingBudgetServices: any[]
) {
  console.log('Executing: CONFIRM_BUDGET');

  try {
    const total = pendingBudgetServices.reduce(
      (sum: number, s: any) => sum + Number(s.base_price || s.price || 0),
      0
    );

    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .insert({
        tenant_id,
        conversation_id: conversation_id || null,
        client_name: 'Cliente via Chat',
        subtotal: total,
        discount: 0,
        total,
        status: 'draft',
        notes: 'Criado automaticamente via chat',
        validity_days: 7,
      })
      .select()
      .single();

    if (budgetError) {
      console.error('Error creating budget:', budgetError);
      return NextResponse.json(
        {
          response: `❌ Erro ao criar orçamento. Tente novamente mais tarde.`,
          pendingBudget: null,
          budgetCreated: false,
        },
        { status: 200 }
      );
    }

    // Criar itens
    const itemsToInsert = pendingBudgetServices.map((service: any) => ({
      budget_id: budget.id,
      service_id: service.id,
      tenant_id,
      description: service.name,
      quantity: 1,
      unit_price: Number(service.base_price || service.price || 0),
      subtotal: Number(service.base_price || service.price || 0),
      total: Number(service.base_price || service.price || 0),
    }));

    await supabase.from('budget_items').insert(itemsToInsert);

    return NextResponse.json(
      {
        response: `✅ Orçamento criado com sucesso!\n\n📄 Você pode vê-lo na aba de Orçamentos.\n\nPosso te ajudar com mais alguma coisa? 😊`,
        pendingBudget: null,
        budgetCreated: true,
        budgetId: budget.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in handleConfirmBudget:', error);
    return NextResponse.json(
      {
        response: `❌ Erro ao criar orçamento. Mas posso continuar te ajudando! 😊`,
        pendingBudget: null,
        budgetCreated: false,
      },
      { status: 200 }
    );
  }
}

// Função para gerar preview de orçamento
function generateBudgetPreview(services: any[]): string {
  let total = 0;
  const lines = services.map((s) => {
    const price = Number(s.base_price || s.price || 0);
    total += price;
    return `• ${s.name}: ${formatCurrency(price)}`;
  });

  return `📄 Orçamento:\n\n${lines.join('\n')}\n\n💰 Total: ${formatCurrency(total)}\n\nDigite "sim" para confirmar ou peça para adicionar/remover serviços.`;
}
