import { EvolutionProvider, MessageStatusMap } from '../../../lib/providers/evolutionProvider';

describe('EvolutionProvider Status Mapping', () => {
  let provider;

  beforeEach(() => {
    provider = new EvolutionProvider({
      baseUrl: 'http://localhost:8080',
      apiKey: 'test-key',
      instanceName: 'test-instance',
    });
  });

  describe('mapStatus', () => {
    it('should map sent to sent', () => {
      expect(provider.mapStatus('sent')).toBe('sent');
    });

    it('should map delivered to delivered', () => {
      expect(provider.mapStatus('delivered')).toBe('delivered');
    });

    it('should map read to read', () => {
      expect(provider.mapStatus('read')).toBe('read');
    });

    it('should map failed to error', () => {
      expect(provider.mapStatus('failed')).toBe('error');
    });

    it('should map pending to pending', () => {
      expect(provider.mapStatus('pending')).toBe('pending');
    });

    it('should map unknown to pending', () => {
      expect(provider.mapStatus('unknown_status')).toBe('pending');
    });
  });

  describe('MessageStatusMap constant', () => {
    it('should have sent mapping', () => {
      expect(MessageStatusMap.sent).toBe('sent');
    });

    it('should have delivered mapping', () => {
      expect(MessageStatusMap.delivered).toBe('delivered');
    });

    it('should have read mapping', () => {
      expect(MessageStatusMap.read).toBe('read');
    });
  });

  describe('formatPhone', () => {
    it('should not modify number already with country code', () => {
      expect(provider.formatPhone('552199999999')).toBe('552199999999');
    });

    it('should handle number with special chars', () => {
      expect(provider.formatPhone('+552199999999')).toBe('552199999999');
    });
  });

  describe('extractPhoneFromJid', () => {
    it('should extract phone from jid without country', () => {
      expect(provider.extractPhoneFromJid('1199999999@s.whatsapp.net')).toBe('1199999999');
    });

    it('should handle empty jid', () => {
      expect(provider.extractPhoneFromJid(null)).toBeNull();
    });
  });

  describe('isGroupJid', () => {
    it('should identify group jid', () => {
      expect(provider.isGroupJid('551199999999@g.us')).toBe(true);
    });

    it('should identify user jid', () => {
      expect(provider.isGroupJid('551199999999@s.whatsapp.net')).toBe(false);
    });
  });
});