export interface Service {
  id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  price: number | null;
  unit: string | null;
  is_active: boolean;
  duration_minutes: number | null;
  category: string | null;
  tenant_id?: string;
}

export interface FakeAIConfig {
  assistantName: string;
  businessName: string;
}

const INTENTS = {
  services: ['serviço', 'serviços', 'o que vocês fazem', 'quais serviços', 'fazem', 'disponível'],
  price: ['preço', 'valor', 'quanto custa', 'quanto fica', 'valores', 'barato', 'caro'],
  budget: ['orçamento', 'orcamento', 'total', 'pacote', 'montar', 'gerar'],
  schedule: ['agendar', 'marcar', 'horário', 'disponibilidade'],
  contact: ['telefone', 'whatsapp', 'email', 'contato', 'endereço', 'local'],
  duration: ['tempo', 'duração', 'demora', 'minutos', 'horas', 'rápido'],
};

export function detectIntent(message: string): string {
  const text = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [intent, keywords] of Object.entries(INTENTS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return intent;
      }
    }
  }

  return 'fallback';
}

export function extractServicesFromMessage(message: string, services: Service[]): Service[] {
  const text = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const selected: Service[] = [];

  for (const service of services) {
    const serviceName = service.name.toLowerCase();

    if (text.includes(serviceName)) {
      selected.push(service);
      continue;
    }

    const words = serviceName.split(/\s+/);
    if (words.length >= 2) {
      const firstWord = words[0];
      const lastWord = words[words.length - 1];
      if (text.includes(firstWord) && text.includes(lastWord)) {
        selected.push(service);
      }
    }

    const partialMatches = words.filter((word) => word.length > 3 && text.includes(word));
    if (partialMatches.length >= Math.ceil(words.length * 0.6)) {
      selected.push(service);
    }
  }

  return selected;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function generateBudgetPreview(services: Service[]): string {
  if (!services.length) {
    return 'Me diga quais serviços você deseja para montar um orçamento 😊';
  }

  let total = 0;

  const response = services
    .map((service) => {
      const price = Number(service.base_price || service.price || 0);
      total += price;
      return `• ${service.name} — ${formatCurrency(price)}`;
    })
    .join('\n');

  return `📄 Orçamento rápido:\n\n${response}\n\n💰 Total: ${formatCurrency(total)}\n\nDeseja que eu gere um orçamento formal? (responda: sim)`;
}

export function generateSmartResponse(
  message: string,
  services: Service[],
  config: FakeAIConfig,
  pendingBudgetServices: Service[] | null = null
): { response: string; pendingBudget: Service[] | null } {
  const { assistantName, businessName } = config;
  const text = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const intent = detectIntent(message);
  const activeServices = services.filter((s) => s.is_active);

  if (pendingBudgetServices && pendingBudgetServices.length > 0) {
    if (
      text.includes('sim') ||
      text.includes('confirm') ||
      text.includes('quero') ||
      text.includes('cria')
    ) {
      return {
        response: 'CONFIRM_BUDGET',
        pendingBudget: pendingBudgetServices,
      };
    }

    if (
      text.includes('não') ||
      text.includes('nao') ||
      text.includes('cancel') ||
      text.includes('desist') ||
      text.includes('outro')
    ) {
      return {
        response:
          'Entendi! 😊 Posso te ajudar com outra coisa? Pergunte sobre serviços, preços ou monte um novo orçamento!',
        pendingBudget: null,
      };
    }

    if (text.includes('adicionar') || text.includes('mais') || text.includes('incluir')) {
      const additional = extractServicesFromMessage(
        message,
        activeServices.filter((s) => !pendingBudgetServices.some((ps) => ps.id === s.id))
      );
      if (additional.length > 0) {
        const updated = [...pendingBudgetServices, ...additional];
        return {
          response: generateBudgetPreview(updated) + '\n\n(Adicionei o serviço solicitado!)',
          pendingBudget: updated,
        };
      }
    }

    if (text.includes('remover') || text.includes('tirar') || text.includes('excluir')) {
      const toRemove = extractServicesFromMessage(message, pendingBudgetServices);
      if (toRemove.length > 0) {
        const updated = pendingBudgetServices.filter((s) => !toRemove.some((tr) => tr.id === s.id));
        if (updated.length > 0) {
          return {
            response: generateBudgetPreview(updated),
            pendingBudget: updated,
          };
        } else {
          return {
            response: 'Orçamento zerado! 😊 Me diga quais serviços você deseja.',
            pendingBudget: null,
          };
        }
      }
    }
  }

  if (intent === 'budget' || intent === 'price') {
    const selected = extractServicesFromMessage(message, activeServices);

    if (selected.length > 0) {
      return {
        response: generateBudgetPreview(selected),
        pendingBudget: selected,
      };
    }

    if (activeServices.length > 0) {
      const cheapest = [...activeServices].sort(
        (a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0)
      )[0];

      return {
        response: `Vi que você quer saber sobre preços! 😊\n\nTemos ${activeServices.length} serviços disponíveis.\n\nO mais acessível é ${cheapest?.name} por ${formatCurrency(Number(cheapest?.base_price || cheapest?.price || 0))}.\n\nQuer que eu monte um orçamento com algum serviço específico?`,
        pendingBudget: null,
      };
    }

    return {
      response: 'Ainda não temos serviços cadastrados com preços. 😊',
      pendingBudget: null,
    };
  }

  if (intent === 'services') {
    if (activeServices.length === 0) {
      return {
        response: `Olá! Sou ${assistantName} da ${businessName}. 😊\n\nAinda não temos serviços cadastrados. Em breve teremos muitas opções para você!`,
        pendingBudget: null,
      };
    }

    const categories = Array.from(new Set(activeServices.map((s) => s.category).filter(Boolean)));

    let response: string;

    if (categories.length > 1) {
      response = `Olá! 😊 Sou ${assistantName} da ${businessName}.\n\nOferecemos:\n\n`;

      for (const cat of categories) {
        const catServices = activeServices.filter((s) => s.category === cat);
        response += `${cat}:\n`;
        response += catServices.map((s) => `• ${s.name}`).join('\n') + '\n\n';
      }
    } else {
      response = `Olá! 😊 Sou ${assistantName} da ${businessName}.\n\nOferecemos ${activeServices.length} serviço(s):\n\n`;
      response += activeServices.map((s) => `• ${s.name}`).join('\n');
    }

    response += '\n\nQuer saber os preços? Pergunte sobre algum serviço específico!';

    return { response, pendingBudget: null };
  }

  if (intent === 'schedule') {
    const servicesWithDuration = activeServices.filter((s) => s.duration_minutes);

    let response = `Claro! Teremos prazer em atendê-lo. 😊\n\nPara agendar, você pode:\n`;
    response += `• Nos enviar uma mensagem pelo chat\n`;
    response += `• Ligar para nosso telefone\n`;
    response += `• Enviar um WhatsApp\n`;

    if (servicesWithDuration.length > 0) {
      const avgDuration = Math.round(
        servicesWithDuration.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) /
          servicesWithDuration.length
      );
      response += `\n⏱️ A duração média dos nossos serviços é de ${avgDuration} minutos.`;
    }

    response += '\n\nQual serviço você gostaria de agendar?';

    return { response, pendingBudget: null };
  }

  if (intent === 'contact') {
    return {
      response: `Claro! 😊\n\nVocê pode entrar em contato conosco:\n\n• Pelo chat aqui mesmo\n• Solicite que um atendente entre em contato\n\nEstamos aqui para ajudar!`,
      pendingBudget: null,
    };
  }

  if (intent === 'duration') {
    const servicesWithDuration = activeServices.filter((s) => s.duration_minutes);

    if (servicesWithDuration.length === 0) {
      return {
        response:
          'Boa pergunta! A duração varia de acordo com o serviço. 😊 Quer saber o tempo de algum serviço específico?',
        pendingBudget: null,
      };
    }

    const durationList = servicesWithDuration
      .slice(0, 5)
      .map((s) => `• ${s.name}: ~${s.duration_minutes} minutos`)
      .join('\n');

    return {
      response: `Aqui está uma estimativa de duração:\n\n${durationList}${servicesWithDuration.length > 5 ? '\n\n...' : ''}\n\n⏱️ Duração pode variar dependendo do caso. 😊`,
      pendingBudget: null,
    };
  }

  const isGreeting = /^(oi|olá|ola|hi|hey|bom dia|boa tarde|boa noite|como vai|td bem)$/i.test(
    message.trim()
  );
  if (isGreeting) {
    const greetings = [
      `Olá! 😊 Sou ${assistantName}, assistente virtual da ${businessName}. Como posso te ajudar hoje?`,
      `Oi! Que bom ter você aqui! 👋 Sou ${assistantName}. Em que posso ajudar?`,
      `Olá! Tudo bem? 😊 Sou ${assistantName} da ${businessName}. Como posso ser útil?`,
    ];
    return {
      response: greetings[Math.floor(Math.random() * greetings.length)],
      pendingBudget: null,
    };
  }

  const isThanks = /obrigado|obrigada|vlw|valeu|thanks|grato|grata/i.test(text);
  if (isThanks) {
    return {
      response: 'De nada! 😊 Fico feliz em ajudar. Se tiver mais alguma dúvida, é só chamar!',
      pendingBudget: null,
    };
  }

  const isBye = /tchau|adeus|até mais|flw|até logo/i.test(text);
  if (isBye) {
    return {
      response: 'Foi um prazer ajudar! 😊 Até mais!',
      pendingBudget: null,
    };
  }

  const helpOptions = [
    'Posso te ajudar com informações sobre nossos serviços e preços! 😊',
    'Quer saber sobre nossos serviços ou horários? Fico feliz em ajudar! 😊',
    'Estou aqui para ajudar! Pergunte sobre serviços, preços ou agende um horário! 😊',
  ];

  return {
    response: `Entendi sua mensagem! 😊\n\n${helpOptions[Math.floor(Math.random() * helpOptions.length)]}\n\nOu se preferir, posso transferi-lo para um atendente!`,
    pendingBudget: null,
  };
}

export function generateFallbackResponse(config: FakeAIConfig): string {
  const { assistantName } = config;
  return `Olá! 😊 Sou ${assistantName}. Como posso te ajudar hoje?`;
}
