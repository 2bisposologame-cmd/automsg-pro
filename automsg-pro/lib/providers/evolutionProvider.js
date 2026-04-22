import { createLogger } from '../logger.js';

const logger = createLogger('EvolutionProvider');

const MessageStatusMap = {
  'sent': 'sent',
  'delivered': 'delivered',
  'read': 'read',
  'failed': 'error',
  'pending': 'pending',
  'ack': 'sent',
  'playing': 'read',
};

export class EvolutionProvider {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.instanceName = config.instanceName;
  }

  async sendMessage(to, message, options = {}) {
    try {
      const payload = {
        number: this.formatPhone(to),
        text: message,
      };

      if (options.quoted) {
        payload.quoted = options.quoted;
      }

      const response = await fetch(`${this.baseUrl}/chat/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        logger.error('Evolution send failed', { to, error: data.error || response.statusText });
        return {
          success: false,
          error: data.message || data.error || 'Failed to send',
          code: data.code,
        };
      }

      const messageKey = data.key?.id || data.key?.remoteJid;

      logger.info('Evolution message sent', { to, messageId: messageKey });

      return {
        success: true,
        messageId: messageKey,
        message: data,
      };
    } catch (error) {
      logger.error('Evolution exception', { to, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async sendMediaUrl(to, mediaUrl, caption, options = {}) {
    try {
      const mediaTypes = {
        image: 'sendImage',
        video: 'sendVideo',
        audio: 'sendAudio',
        document: 'sendDocument',
      };

      const type = options.type || 'image';
      const endpoint = mediaTypes[type];

      if (!endpoint) {
        return { success: false, error: 'Unsupported media type' };
      }

      const payload = {
        number: this.formatPhone(to),
        mediaUrl,
        caption: caption || '',
      };

      const response = await fetch(`${this.baseUrl}/chat/${endpoint}/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        messageId: data.key?.id,
      };
    } catch (error) {
      logger.error('Evolution media send failed', { to, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async getMessageStatus(messageId) {
    try {
      const webhook = await fetch(`${this.baseUrl}/chat/fetchMessages/${this.instanceName}?keyId=${messageId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
        },
      });

      const data = await webhook.json();

      if (!webhook.ok || data.error) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        status: this.mapStatus(data.status),
        error: data.failReason,
      };
    } catch (error) {
      logger.error('Get status failed', { messageId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async sendOptInMessage(phone) {
    const message = `Olá! Você está recebendo mensagens do AutoMsg Pro.\n\nPara continuar recebendo mensagens, responda com *SIM*.\n\nPara cancelar, responda *SAIR*.`;
    return this.sendMessage(phone, message);
  }

  async sendOptOutConfirmation(phone) {
    const message = `Você foi removido da nossa lista de contatos.\n\nPara receber mensagens novamente, você precisará se cadastrar novamente.\n\nObrigado!`;
    return this.sendMessage(phone, message);
  }

  async sendReaction(messageId, emoji) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/sendReaction/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify({
          key: { id: messageId },
          reaction: emoji,
        }),
      });

      const data = await response.json();

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      return cleaned;
    }
    if (cleaned.length === 10 || cleaned.length === 11) {
      return '55' + cleaned;
    }
    if (cleaned.length === 9) {
      return '55' + cleaned;
    }
    return cleaned;
  }

  parseIncomingMessage(payload) {
    try {
      const event = payload.event;
      const data = payload.data;

      if (event === 'messages.upsert') {
        const message = data.messages?.[0];
        if (!message) return null;

        const key = message.key;
        const remoteJid = key?.remoteJid;
        
        if (remoteJid?.includes('g.us') || remoteJid === 'status@broadcast') {
          return null;
        }

        return {
          from: this.extractPhoneFromJid(remoteJid),
          type: message.message?.conversation ? 'text' : Object.keys(message.message || {})[0],
          text: message.message?.conversation || message.message?.extendedTextMessage?.text,
          messageId: key?.id,
          timestamp: message.messageTimestamp,
        };
      }

      return null;
    } catch (error) {
      logger.error('Parse incoming failed', { error: error.message });
      return null;
    }
  }

  mapStatus(evolutionStatus) {
    return MessageStatusMap[evolutionStatus] || 'pending';
  }

  extractPhoneFromJid(jid) {
    if (!jid) return null;
    return jid.split('@')[0].replace('55', '');
  }

  extractPhoneFromJidWithCountry(jid) {
    if (!jid) return null;
    return jid.split('@')[0];
  }

  isGroupJid(jid) {
    return jid?.includes('g.us');
  }

  async fetchInstanceStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/instance/fetchInstances/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        instance: {
          name: data.name,
          status: data.status,
          owner: data.owner,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async restartInstance() {
    try {
      const response = await fetch(`${this.baseUrl}/instance/restart/${this.instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.apiKey,
        },
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export function createEvolutionProvider(config) {
  return new EvolutionProvider(config);
}

export { MessageStatusMap };