import { supabase } from '../supabase.js';
import { createLogger } from '../logger.js';

const logger = createLogger('UsageService');

export const Feature = {
  LEAD_CREATED: 'lead_created',
  MESSAGE_SENT: 'message_sent',
  AI_GENERATION: 'ai_generation',
  IMPORT_RECORD: 'import_record',
  CAMPAIGN_CREATED: 'campaign_created',
};

export const usageService = {
  async record(tenantId, userId, feature, quantity = 1, metadata = {}) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('usage_records')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        feature,
        quantity,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        metadata,
      })
      .select()
      .single();

    if (error) {
      logger.error('Record usage failed', { feature, error: error.message });
      throw error;
    }

    logger.info('Usage recorded', { feature, quantity, userId });
    return data;
  },

  async getCurrentUsage(userId, feature, tenantId = null) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let query = supabase
      .from('usage_records')
      .select('quantity')
      .eq('feature', feature)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Get current usage failed', { feature, error: error.message });
      throw error;
    }

    const total = data.reduce((sum, r) => sum + r.quantity, 0);
    return total;
  },

  async getUsageBreakdown(userId, tenantId = null) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let query = supabase
      .from('usage_records')
      .select('feature, quantity, created_at')
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Get usage breakdown failed', { error: error.message });
      throw error;
    }

    const breakdown = {};
    for (const record of data) {
      if (!breakdown[record.feature]) {
        breakdown[record.feature] = 0;
      }
      breakdown[record.feature] += record.quantity;
    }

    return breakdown;
  },

  async checkLimit(userId, feature, planLimit) {
    const currentUsage = await this.getCurrentUsage(userId, feature);
    
    if (planLimit === 0) {
      return { allowed: false, reason: 'limit_reached', current: currentUsage, limit: 0 };
    }

    if (currentUsage >= planLimit) {
      return { allowed: false, reason: 'limit_reached', current: currentUsage, limit: planLimit };
    }

    return { allowed: true, current: currentUsage, limit: planLimit };
  },

  async getUsageHistory(userId, tenantId = null, months = 3) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    let query = supabase
      .from('usage_records')
      .select('*')
      .gte('period_start', periodStart.toISOString())
      .order('period_start', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Get usage history failed', { error: error.message });
      throw error;
    }

    return data;
  },

  async getMonthlyStats(userId, monthOffset = 0) {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const periodStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const periodEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('usage_records')
      .select('feature, quantity')
      .eq('user_id', userId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    if (error) {
      logger.error('Get monthly stats failed', { error: error.message });
      throw error;
    }

    const stats = {
      month: targetMonth.toISOString().slice(0, 7),
      leads: 0,
      messages: 0,
      aiGenerations: 0,
      imports: 0,
      campaigns: 0,
    };

    for (const record of data) {
      switch (record.feature) {
        case Feature.LEAD_CREATED:
          stats.leads += record.quantity;
          break;
        case Feature.MESSAGE_SENT:
          stats.messages += record.quantity;
          break;
        case Feature.AI_GENERATION:
          stats.aiGenerations += record.quantity;
          break;
        case Feature.IMPORT_RECORD:
          stats.imports += record.quantity;
          break;
        case Feature.CAMPAIGN_CREATED:
          stats.campaigns += record.quantity;
          break;
      }
    }

    return stats;
  },
};