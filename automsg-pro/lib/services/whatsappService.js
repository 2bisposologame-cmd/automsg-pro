import { createLogger } from '../logger.js';

const logger = createLogger('WhatsAppService');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export class WhatsAppService {
  constructor(config) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.businessAccountId = config.businessAccountId;
  }

  async sendMessage(to, message, preview = false) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhone(to),
        type: 'text',
        text: { body: message },
      };

      if (preview) {
        payload.context = { message_id: preview };
      }

      const response = await fetch(`${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('WhatsApp send failed', { to, error: data.error || response.statusText });
        return {
          success: false,
          error: data.error?.message || 'Failed to send message',
          code: data.error?.code,
        };
      }

      logger.info('WhatsApp message sent', { 
        to, 
        messageId: data.messages?.[0]?.id 
      });

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        message: data.messages?.[0],
      };
    } catch (error) {
      logger.error('WhatsApp exception', { to, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async sendTemplate(to, templateName, components = []) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhone(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components,
        },
      };

      const response = await fetch(`${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      logger.error('WhatsApp template send failed', { to, templateName, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async getMessageStatus(messageId) {
    try {
      const response = await fetch(`${WHATSAPP_API_URL}/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return {
        success: true,
        status: data.status,
        error: data.errors?.[0]?.title,
      };
    } catch (error) {
      logger.error('Get message status failed', { messageId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async sendOptInMessage(phone) {
    const welcomeMessage = `Olá! Você está recebendo mensagens do AutoMsg Pro.\n\nPara continuar recebendo mensagens, responda com *SIM*.\n\nPara cancelar, responda *SAIR*.`;
    return this.sendMessage(phone, welcomeMessage);
  }

  async sendOptOutConfirmation(phone) {
    const confirmationMessage = `Você foi removido da nossa lista de contatos.\n\nPara receber mensagens novamente, você precisará se cadastrar novamente.\n\nObrigado!`;
    return this.sendMessage(phone, confirmationMessage);
  }

  formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55')) {
      return cleaned;
    }
    if (cleaned.length === 10 || cleaned.length === 11) {
      return '55' + cleaned;
    }
    return cleaned;
  }

  parseIncomingMessage(payload) {
    try {
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];
      
      if (!message) return null;

      return {
        from: message.from,
        type: message.type,
        text: message.text?.body,
        image: message.image?.id,
        document: message.document?.id,
        timestamp: message.timestamp,
        messageId: message.id,
      };
    } catch (error) {
      logger.error('Parse incoming message failed', { error: error.message });
      return null;
    }
  }
}

export function createWhatsAppService(config) {
  return new WhatsAppService(config);
}