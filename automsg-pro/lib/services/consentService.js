import { supabase } from '../supabase.js';
import { createLogger } from '../logger.js';

const logger = createLogger('ConsentService');

export const ConsentStatus = {
  PENDING: 'pending',
  OPT_IN: 'opt_in',
  OPT_OUT: 'opt_out',
  BLOCKED: 'blocked',
};

export const ConsentSource = {
  CAMPAIGN: 'campaign',
  IMPORT: 'import',
  MANUAL: 'manual',
  WEB: 'web',
};

export const consentService = {
  async optIn(phone, userId, source = ConsentSource.CAMPAIGN) {
    const { data, error } = await supabase
      .from('consents')
      .upsert({
        phone,
        user_id: userId,
        status: ConsentStatus.OPT_IN,
        source,
        opt_in_at: new Date().toISOString(),
        opt_out_at: null,
        opt_out_reason: null,
      }, { onConflict: 'phone' })
      .select()
      .single();

    if (error) {
      logger.error('Opt-in failed', { phone, userId, error: error.message });
      throw error;
    }

    logger.info('Consent opt-in', { phone, userId, source });
    return data;
  },

  async optOut(phone, userId, reason = null) {
    const { data, error } = await supabase
      .from('consents')
      .upsert({
        phone,
        user_id: userId,
        status: ConsentStatus.OPT_OUT,
        opt_out_at: new Date().toISOString(),
        opt_out_reason: reason,
      }, { onConflict: 'phone' })
      .select()
      .single();

    if (error) {
      logger.error('Opt-out failed', { phone, userId, error: error.message });
      throw error;
    }

    logger.info('Consent opt-out', { phone, userId, reason });
    return data;
  },

  async checkConsent(phone, userId) {
    const { data, error } = await supabase
      .from('consents')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return { status: ConsentStatus.PENDING };
    }

    return {
      status: data.status,
      userId: data.user_id,
      optInAt: data.opt_in_at,
      optOutAt: data.opt_out_at,
    };
  },

  async canSend(phone) {
    const consent = await this.checkConsent(phone);
    
    if (consent.status === ConsentStatus.OPT_OUT || consent.status === ConsentStatus.BLOCKED) {
      return { allowed: false, reason: 'opted_out' };
    }

    if (consent.status === ConsentStatus.PENDING) {
      return { allowed: false, reason: 'pending_consent' };
    }

    return { allowed: true };
  },

  async processOptOut(phone, message) {
    const normalizedMessage = message?.toLowerCase().trim();
    
    if (['sair', 'stop', 'cancelar', 'remover', 'unsubscribe'].includes(normalizedMessage)) {
      await this.optOut(phone, null, 'user_request');
      return { optedOut: true };
    }

    if (['sim', 'sim', 'yes', 'confirmar', 'ok'].includes(normalizedMessage)) {
      await this.optIn(phone, null, ConsentSource.WEB);
      return { optedIn: true };
    }

    return { processed: false };
  },

  async getConsentsByUser(userId, options = {}) {
    const { limit = 100, offset = 0, status } = options;
    
    let query = supabase
      .from('consents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Get consents failed', { userId, error: error.message });
      throw error;
    }

    return data;
  },

  async updateLeadConsent(leadId, status) {
    const updateData = {
      consent_status: status,
    };

    if (status === ConsentStatus.OPT_IN) {
      updateData.consent_at = new Date().toISOString();
      updateData.opt_out_at = null;
    } else if (status === ConsentStatus.OPT_OUT) {
      updateData.opt_out_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      logger.error('Update lead consent failed', { leadId, error: error.message });
      throw error;
    }

    return data;
  },
};