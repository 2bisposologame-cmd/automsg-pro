import { supabase } from '../../lib/supabase.js';
import { validatePayload, leadSchema } from '../../lib/schemas.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('LeadsAPI');

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, user.id);
  } else if (req.method === 'POST') {
    return handlePost(req, res, user.id);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, user.id);
  }
  
  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res, userId) {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    logger.info('Leads fetched', { userId, count: data?.length });

    return res.status(200).json({
      leads: data,
      total: count || 0,
    });
  } catch (err) {
    logger.error('Get leads error', { userId, error: err.message });
    return res.status(500).json({ error: 'Erro ao buscar leads.' });
  }
}

async function handlePost(req, res, userId) {
  try {
    const body = req.body;
    
    if (Array.isArray(body)) {
      const leads = body.map(lead => ({
        ...lead,
        user_id: userId,
      }));

      const validation = validatePayload(leadSchema.array(), leads);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { data, error } = await supabase
        .from('leads')
        .upsert(leads, { onConflict: 'user_id,telefone' })
        .select();

      if (error) throw error;

      logger.info('Leads upserted', { userId, count: data?.length });

      return res.status(200).json({
        message: `${data?.length || 0} leads salvos`,
        leads: data,
      });
    } else {
      const validation = validatePayload(leadSchema, body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { data, error } = await supabase
        .from('leads')
        .insert({ ...validation.data, user_id: userId })
        .select()
        .single();

      if (error) throw error;

      logger.info('Lead created', { userId, leadId: data.id });

      return res.status(201).json({ lead: data });
    }
  } catch (err) {
    logger.error('Create leads error', { userId, error: err.message });
    return res.status(500).json({ error: 'Erro ao salvar leads.' });
  }
}

async function handleDelete(req, res, userId) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    logger.info('Lead deleted', { userId, leadId: id });

    return res.status(200).json({ message: 'Lead deletado' });
  } catch (err) {
    logger.error('Delete lead error', { userId, error: err.message });
    return res.status(500).json({ error: 'Erro ao deletar lead.' });
  }
}