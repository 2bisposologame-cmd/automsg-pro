import { supabase } from '../supabase.js';
import { createLogger } from '../logger.js';

const logger = createLogger('LeadRepository');

export const leadRepository = {
  async findByUserId(userId, options = {}) {
    const { limit = 100, offset = 0 } = options;
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      logger.error('findByUserId error', { userId, error: error.message });
      throw error;
    }
    return data;
  },

  async findById(id, userId) {
    const { data, error } = await supabase
      .from('leads')
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

  async create(lead) {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();
    
    if (error) {
      logger.error('create error', { lead, error: error.message });
      throw error;
    }
    logger.info('Lead created', { id: data.id });
    return data;
  },

  async upsert(leads) {
    const { data, error } = await supabase
      .from('leads')
      .upsert(leads, { onConflict: 'user_id,telefone' })
      .select();
    
    if (error) {
      logger.error('upsert error', { count: leads.length, error: error.message });
      throw error;
    }
    logger.info('Leads upserted', { count: data?.length || 0 });
    return data;
  },

  async delete(id, userId) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      logger.error('delete error', { id, userId, error: error.message });
      throw error;
    }
    logger.info('Lead deleted', { id });
  },

  async count(userId) {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      logger.error('count error', { userId, error: error.message });
      throw error;
    }
    return count || 0;
  },

  async deleteAll(userId) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      logger.error('deleteAll error', { userId, error: error.message });
      throw error;
    }
    logger.info('All leads deleted', { userId });
  },
};