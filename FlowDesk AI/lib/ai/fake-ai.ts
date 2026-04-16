export interface Service {
  id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  unit: string | null;
  is_active: boolean;
  duration_minutes: number | null;
  category: string | null;
}

export interface FakeAIConfig {
  assistantName: string;
  businessName: string;
}

export function generateFakeAIResponse(
  message: string,
  services: Service[],
  config: FakeAIConfig
): string {
  const { assistantName, businessName } = config;
  const lowerMessage = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const activeServices = services.filter((s) => s.is_active);

  const isPriceQuestion = /preç|valor|quanto|custa|barato|caro|orçament|falange|combustível/i.test(
    lowerMessage
  );
  const isServiceQuestion = /serviço|fazem|faz|oferece|terceiriz|disponível|tenho|precis/i.test(
    lowerMessage
  );
  const isScheduleQuestion =
    /horário|agenda|marcar|atendimento|funciona|abre%|████████|hora|chega|vem/i.test(lowerMessage);
  const isContactQuestion = /telefone|whatsapp|email|contato|local|endereço|chegar|localiz/i.test(
    lowerMessage
  );
  const isGreeting = /oi|olá|ola|hi|hey|bom dia|boa tarde|boa noite|como vai|td bem/i.test(
    lowerMessage
  );
  const isThanks = /obrigado|obrigada|vlw| valeu|thanks|grato|grata/i.test(lowerMessage);
  const isBye = /tchau|adeus|até mais|flw|até logo|boa noite|boa tarde|encerrar|sair/i.test(
    lowerMessage
  );
  const isRecommendation = /recomend|sugest|indica|melhor|indique/i.test(lowerMessage);
  const isDuration = /duração|tempo|demora|minuto|hora|longo|rápido/i.test(lowerMessage);

  if (isGreeting && message.length < 20) {
    const greetings = [
      `Olá! 😊 Sou ${assistantName}, assistente virtual da ${businessName}. Como posso te ajudar hoje?`,
      `Oi! Que bom ter você aqui! 👋 Sou ${assistantName}. Em que posso ajudar?`,
      `Olá! Tudo bem? 😊 Sou ${assistantName} da ${businessName}. Como posso ser útil?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  if (isThanks) {
    return `De nada! 😊 Fico feliz em ajudar. Se tiver mais alguma dúvida, é só chamar!`;
  }

  if (isBye) {
    return `Foi um prazer ajudar! 😊 Até mais!`;
  }

  if (isPriceQuestion) {
    if (activeServices.length === 0) {
      return `Ótima pergunta! No momento ainda não temos serviços com preços cadastrados. 😊 Posso verificar se há algo novo em breve!`;
    }

    const servicesWithPrice = activeServices
      .filter((s) => s.base_price !== null && s.base_price > 0)
      .sort((a, b) => (a.base_price || 0) - (b.base_price || 0));

    if (servicesWithPrice.length === 0) {
      return `Ótima pergunta! Temos ${activeServices.length} serviço(s) disponível(is). 😊 Para saber os valores, entre em contato conosco!`;
    }

    const priceList = servicesWithPrice
      .map(
        (s) =>
          `• ${s.name}: R$ ${s.base_price?.toFixed(2).replace('.', ',')}${s.unit ? ` / ${s.unit}` : ''}`
      )
      .join('\n');

    const cheapest = servicesWithPrice[0];
    return `Temos os seguintes valores:\n\n${priceList}\n\n💡 O serviço mais popular é ${cheapest.name} por R$ ${cheapest.base_price?.toFixed(2).replace('.', ',')}.\n\nQual te interessa mais? 😊`;
  }

  if (isServiceQuestion) {
    if (activeServices.length === 0) {
      return `Estamos organizando nossos serviços! 😊 Em breve tendrás mais informações. Enquanto isso, posso ajudar com alguma outra dúvida?`;
    }

    const categories = Array.from(new Set(activeServices.map((s) => s.category).filter(Boolean)));

    let serviceList: string;

    if (categories.length > 1) {
      const byCategory = categories
        .map((cat) => {
          const catServices = activeServices.filter((s) => s.category === cat);
          return `**${cat}**:\n${catServices.map((s) => `• ${s.name}`).join('\n')}`;
        })
        .join('\n\n');

      serviceList = byCategory;
    } else {
      serviceList = activeServices
        .map((s) => `• ${s.name}${s.description ? `: ${s.description}` : ''}`)
        .join('\n');
    }

    return `Oferecemos ${activeServices.length} serviço(s):\n\n${serviceList}\n\nQuer saber mais detalhes sobre algum deles? 😊`;
  }

  if (isScheduleQuestion) {
    const servicesWithDuration = activeServices.filter((s) => s.duration_minutes);

    let durationInfo = '';
    if (servicesWithDuration.length > 0) {
      const avgDuration = Math.round(
        servicesWithDuration.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) /
          servicesWithDuration.length
      );
      durationInfo = `\n\n⏱️ A duração média dos nossos serviços é de ${avgDuration} minutos.`;
    }

    return `Claro! Teremos prazer em atendê-lo. 😊\n\nPara agendar um horário, você pode:\n• Nos enviar uma mensagem pelo chat\n• Ligar para nosso telefone\n• Enviar um WhatsApp\n\n${durationInfo}\n\nQual serviço você gostaria de agendar? 😊`;
  }

  if (isContactQuestion) {
    return `Claro! 😊 Você pode entrar em contato conosco:\n\n• Pelo chat aqui mesmo\n• Solicite que um atendente entre em contato\n\nEstou aqui para ajudar! Como posso te ajudar hoje? 😊`;
  }

  if (isDuration) {
    const servicesWithDuration = activeServices.filter((s) => s.duration_minutes);

    if (servicesWithDuration.length === 0) {
      return `Boa pergunta! A duração varia de acordo com o serviço escolhido. 😊 Quer saber o tempo de algum serviço específico?`;
    }

    const durationList = servicesWithDuration
      .slice(0, 5)
      .map((s) => `• ${s.name}: ~${s.duration_minutes} minutos`)
      .join('\n');

    return `Aqui está uma estimativa de duração:\n\n${durationList}${servicesWithDuration.length > 5 ? '\n\n...' : ''}\n\n⏱️ Duração pode variar dependendo do caso. 😊`;
  }

  if (isRecommendation) {
    if (activeServices.length === 0) {
      return `Boa pergunta! 😊 Ainda estamos cadastrando nossos serviços mais populares. Que tipo de serviço você está procurando?`;
    }

    const highlightedServices = activeServices.filter((s) => s.is_active).slice(0, 3);

    const recList = highlightedServices
      .map((s, i) => {
        let info = `${s.name}`;
        if (s.base_price) info += ` (R$ ${s.base_price.toFixed(2).replace('.', ',')})`;
        if (s.duration_minutes) info += ` - ~${s.duration_minutes}min`;
        return `${i + 1}. ${info}`;
      })
      .join('\n');

    return `Based on our services, I recommend:\n\n${recList}\n\nPlease choose a number or ask for more details! 😊`;
  }

  const helpOptions = [
    'Posso te ajudar com informações sobre nossos serviços e preços! 😊',
    'Quer saber sobre nossos serviços ou horários? Fico feliz em ajudar! 😊',
    'Estou aqui para ajudar! Pergunte sobre serviços, preços ou agende um horário! 😊',
  ];

  return `Entendi sua mensagem! 😊\n\n${helpOptions[Math.floor(Math.random() * helpOptions.length)]}\n\nOu se preferir, posso transferi-lo para um atendente!`;
}
