import { createLogger } from '../logger.js';
import { createEvolutionProvider } from './evolutionProvider.js';

const logger = createLogger('WhatsAppFactory');

export const ProviderType = {
  EVOLUTION: 'evolution',
  OFFICIAL: 'official',
};

export class WhatsAppFactory {
  static async createProvider(config) {
    const providerType = config.providerType || process.env.WHATSAPP_PROVIDER || ProviderType.EVOLUTION;

    logger.info('Creating WhatsApp provider', { type: providerType });

    switch (providerType) {
      case ProviderType.EVOLUTION:
        return this.createEvolutionProvider(config);
      case ProviderType.OFFICIAL:
        return this.createOfficialProvider(config);
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }

  static createEvolutionProvider(config) {
    const required = ['baseUrl', 'apiKey', 'instanceName'];
    const missing = required.filter(k => !config[k]);

    if (missing.length > 0) {
      throw new Error(`Missing Evolution config: ${missing.join(', ')}`);
    }

    logger.info('Evolution provider created', { instance: config.instanceName });

    return createEvolutionProvider({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      instanceName: config.instanceName,
    });
  }

  static createOfficialProvider(config) {
    throw new Error('Official provider not implemented yet');
  }

  static getConfigFromEnv() {
    const providerType = process.env.WHATSAPP_PROVIDER || ProviderType.EVOLUTION;

    if (providerType === ProviderType.EVOLUTION) {
      return {
        providerType: ProviderType.EVOLUTION,
        baseUrl: process.env.EVOLUTION_BASE_URL,
        apiKey: process.env.EVOLUTION_API_KEY,
        instanceName: process.env.EVOLUTION_INSTANCE_NAME,
      };
    }

    return {
      providerType,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    };
  }

  static validateConfig(config) {
    const providerType = config.providerType || process.env.WHATSAPP_PROVIDER || ProviderType.EVOLUTION;

    if (providerType === ProviderType.EVOLUTION) {
      const required = ['baseUrl', 'apiKey', 'instanceName'];
      const errors = [];

      for (const key of required) {
        if (!config[key]) {
          errors.push(`${key} is required`);
        }
      }

      return { valid: errors.length === 0, errors };
    }

    return { valid: false, errors: ['Unsupported provider type'] };
  }
}

export function createWhatsAppProvider(config) {
  return WhatsAppFactory.createProvider(config);
}