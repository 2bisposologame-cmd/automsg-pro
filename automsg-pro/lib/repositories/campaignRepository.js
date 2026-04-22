import { supabase } from '../supabase.js';
import { createLogger } from '../logger.js';

const logger = createLogger('CampaignRepository');

export const campaignRepository = {
  async findByUserId(userId, options = {}) {
    const { limit = 50, offset = 0, status } = options;
    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('findByUserId error', { userId, error: error.message });
      throw error;
    }
    return data;
  },

  async findById(id, userId) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      logger.error('findById error', { id, userId, error: error.message });
      throw error;
    }
    return data;
  },

  async create(campaign) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();
    
    if (error) {
      logger.error('create error', { campaign, error: error.message });
      throw error;
    }
    logger.info('Campaign created', { id: data.id });
    return data;
  },

  async update(id, userId, updates) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      logger.error('update error', { id, error: error.message });
      throw error;
    }
    logger.info('Campaign updated', { id });
    return data;
  },

  async delete(id, userId) {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      logger.error('delete error', { id, error: error.message });
      throw error;
    }
    logger.info('Campaign deleted', { id });
  },

  async count(userId) {
    const { count, error } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      logger.error('count error', { userId, error: error.message });
      throw error;
    }
    return count || 0;
  },
};