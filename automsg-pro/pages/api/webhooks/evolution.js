import { createLogger } from '../../../lib/logger.js';
import { consentService } from '../../../lib/services/consentService.js';
import { supabase } from '../../../lib/supabase.js';
import { createWhatsAppProvider } from '../../../lib/providers/factory.js';

const logger = createLogger('EvolutionWebhook');

const EvolutionEventMap = {
  'messages.upsert': 'handleMessagesUpsert',
  'connection.update': 'handleConnectionUpdate',
  'qrcode.updated': 'handleQRCode',
  'messages.update': 'handleMessagesUpdate',
};

const EvolutionStatusMap = {
  'sent': 'sent',
  'delivered': 'delivered',
  'read': 'read',
  'error': 'failed',
  'pending': 'pending',
 };

function mapEvolutionStatus(eventType) {
  return EvolutionStatusMap[eventType] || 'pending';
}

export default async function handler(req, res) {
  const providerType = process.env.WHATSAPP_PROVIDER || 'evolution';

  if (providerType !== 'evolution') {
    return res.status(501).json({ error: 'Only Evolution provider supported' });
  }

  if (req.method === 'GET') {
    return handleVerify(req, res);
  }

  if (req.method === 'POST') {
    return handleWebhook(req, res);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleVerify(req, res) {
  const webhookToken = process.env.EVOLUTION_WEBHOOK_TOKEN;
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === webhookToken) {
    logger.info('Evolution webhook verified');
    return res.status(200).send(challenge);
  }

  logger.warn('Evolution webhook verification failed', { mode, token });
  return res.status(403).json({ error: 'Verification failed' });
}

async function handleWebhook(req, res) {
  try {
    const body = req.body;
    const event = body.event;

    logger.info('Evolution webhook received', { event });

    if (body.status) {
      return handleStatusUpdate(body);
    }

    const handlerName = EvolutionEventMap[event];

    if (handlerName) {
      await this[handlerName]?.(body);
    } else {
      logger.debug('Unhandled event', { event });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', { error: error.message });
    return res.status(500).json({ error: 'Processing failed' });
  }
}

async function handleMessagesUpsert(body) {
  const messages = body.messages || [];

  for (const msg of messages) {
    const key = msg.key;
    const remoteJid = key?.remoteJid;

    if (!remoteJid || remoteJid.includes('g.us') || remoteJid === 'status@broadcast') {
      continue;
    }

    const from = remoteJid.split('@')[0];
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    logger.info('Incoming message', { from, text: text?.substring(0, 50) });

    if (text) {
      await processOptOutMessage(from, text);
    }
  }
}

async function handleMessagesUpdate(body) {
  const updates = body.updates || [];

  for (const update of updates) {
    const key = update.key;
    const updateType = update.update;

    if (!key?.id) continue;

    if (updateType === 'pagination') {
      continue;
    }

    const messageId = key.id;

    if (update.update === 'delete') {
      await updateMessageStatus(messageId, 'deleted');
      continue;
    }

    const status = update.update?.status;
    if (status) {
      await updateMessageStatus(messageId, mapEvolutionStatus(status));
    }
  }
}

async function handleConnectionUpdate(body) {
  const { instance, connection, qrcode } = body;

  logger.info('Connection update', { instance, connection });

  if (connection === 'close') {
    logger.warn('Evolution instance disconnected', { instance });
  }

  if (qrcode) {
    logger.info('New QR code available', { instance });
  }

  if (body.state) {
    await supabase
      .from('whatsapp_configs')
      .update({ is_active: body.state === 'open' })
      .eq('instance_name', instance);
  }
}

async function handleQRCode(body) {
  logger.info('QR code updated', { instance: body.instance });
}

async function processOptOutMessage(phone, text) {
  const normalized = text?.toLowerCase().trim();

  const optOutKeywords = ['sair', 'stop', 'cancelar', 'remover', 'unsubscribe', 'nao', 'nao quero'];
  const optInKeywords = ['sim', 'yes', 'confirmar', 'ok', 'aceito', 'quero'];

  if (optOutKeywords.includes(normalized)) {
    await consentService.optOut(phone, null, 'user_request');
    logger.info('User opted out via Evolution', { phone });
    return;
  }

  if (optInKeywords.includes(normalized)) {
    await consentService.optIn(phone, null, 'web');
    logger.info('User opted in via Evolution', { phone });
    return;
  }
}

async function updateMessageStatus(messageId, status) {
  const updates = {};

  switch (status) {
    case 'sent':
      updates.status = 'sent';
      updates.sent_at = new Date().toISOString();
      break;
    case 'delivered':
      updates.status = 'delivered';
      updates.delivered_at = new Date().toISOString();
      break;
    case 'read':
      updates.status = 'read';
      updates.read_at = new Date().toISOString();
      break;
    case 'failed':
      updates.status = 'failed';
      break;
  }

  if (Object.keys(updates).length > 0) {
    await supabase
      .from('campaign_messages')
      .update(updates)
      .eq('whatsapp_message_id', messageId);

    logger.info('Message status updated', { messageId, status });
  }
}