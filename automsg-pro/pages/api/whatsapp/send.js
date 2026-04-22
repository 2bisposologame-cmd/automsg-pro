import { z } from 'zod';
import { createLogger } from '../../../lib/logger.js';
import { createWhatsAppProvider } from '../../../lib/providers/factory.js';
import { consentService } from '../../../lib/services/consentService.js';
import { usageService, Feature } from '../../../lib/services/usageService.js';
import { supabase } from '../../../lib/supabase.js';
import { validatePayload } from '../../../lib/schemas.js';

const logger = createLogger('WhatsAppAPI');

const sendMessageSchema = z.object({
  to: z.string().min(1, 'Telefone é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(4096),
  campaignId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  quotedMessageId: z.string().optional(),
});

async function getUserWhatsAppConfig(userId) {
  const providerType = process.env.WHATSAPP_PROVIDER || 'evolution';

  if (providerType === 'evolution') {
    const { data, error } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
return {
      providerType: 'evolution',
      baseUrl: process.env.EVOLUTION_BASE_URL,
      apiKey: process.env.EVOLUTION_API_KEY,
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
    };
  }

  const configData = data.config || {};
  return {
    providerType: 'evolution',
    baseUrl: configData.baseUrl || process.env.EVOLUTION_BASE_URL,
    apiKey: configData.apiKey || process.env.EVOLUTION_API_KEY,
    instanceName: data.instance_name || process.env.EVOLUTION_INSTANCE_NAME,
  };
  }

  return {
    providerType: 'official',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  };
}

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

  if (req.method === 'POST') {
    return handleSend(req, res, user.id);
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleSend(req, res, userId) {
  const validation = validatePayload(sendMessageSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { to, message, campaignId, leadId, quotedMessageId } = validation.data;

  try {
    const consentCheck = await consentService.canSend(to);
    if (!consentCheck.allowed) {
      return res.status(400).json({ 
        error: 'Não é possível enviar mensagem',
        reason: consentCheck.reason 
      });
    }

    const providerConfig = await getUserWhatsAppConfig(userId);
    
    if (!providerConfig) {
      return res.status(400).json({ 
        error: 'WhatsApp não configurado. Configure nas settings.' 
      });
    }

    const provider = createWhatsAppProvider(providerConfig);

    const result = quotedMessageId 
      ? await provider.sendMessage(to, message, { quoted: quotedMessageId })
      : await provider.sendMessage(to, message);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const recordData = {
      campaign_id: campaignId || null,
      lead_id: leadId || null,
      phone: to,
      message,
      status: 'sent',
      whatsapp_message_id: result.messageId,
      sent_at: new Date().toISOString(),
    };

    const { data: messageRecord, error: insertError } = await supabase
      .from('campaign_messages')
      .insert(recordData)
      .select()
      .single();

    if (insertError) {
      logger.error('Save message record failed', { error: insertError.message });
    }

    await usageService.record(null, userId, Feature.MESSAGE_SENT);

    logger.info('WhatsApp message sent', { to, messageId: result.messageId, userId });

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      message: messageRecord,
    });
  } catch (error) {
    logger.error('Send message failed', { to, error: error.message });
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
}