import { createLogger } from '../../../lib/logger.js';
import { consentService } from '../../../lib/services/consentService.js';
import { createWhatsAppService } from '../../../lib/services/whatsappService.js';
import { supabase } from '../../../lib/supabase.js';

const logger = createLogger('WhatsAppWebhook');

export default async function handler(req, res) {
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
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }

  logger.warn('WhatsApp webhook verification failed', { mode, token });
  return res.status(403).json({ error: 'Verification failed' });
}

async function handleWebhook(req, res) {
  try {
    const body = req.body;
    
    if (body.object !== 'whatsapp_business_account') {
      return res.status(200).json({ received: true });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages || [];
        
        for (const message of messages) {
          await processIncomingMessage(message);
        }

        const statuses = change.value?.statuses || [];
        for (const status of statuses) {
          await processStatusUpdate(status);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', { error: error.message });
    return res.status(500).json({ error: 'Processing failed' });
  }
}

async function processIncomingMessage(message) {
  const from = message.from;
  const text = message.text?.body;

  logger.info('Incoming WhatsApp message', { from, text: text?.substring(0, 50) });

  if (text) {
    const result = await consentService.processOptOut(from, text);
    
    if (result.optedOut) {
      logger.info('User opted out via WhatsApp', { from });
      return;
    }

    if (result.optedIn) {
      logger.info('User opted in via WhatsApp', { from });
      return;
    }
  }
}

async function processStatusUpdate(status) {
  const { id, status: messageStatus, timestamp, error } = status;

  logger.info('Message status update', { messageId: id, status: messageStatus });

  const updates = {};
  
  switch (messageStatus) {
    case 'sent':
      updates.status = 'sent';
      break;
    case 'delivered':
      updates.status = 'delivered';
      updates.delivered_at = new Date(timestamp * 1000).toISOString();
      break;
    case 'read':
      updates.status = 'read';
      updates.read_at = new Date(timestamp * 1000).toISOString();
      break;
    case 'failed':
      updates.status = 'failed';
      updates.error_message = error?.title || 'Unknown error';
      break;
  }

  if (Object.keys(updates).length > 0) {
    await supabase
      .from('campaign_messages')
      .update(updates)
      .eq('whatsapp_message_id', id);
  }
}