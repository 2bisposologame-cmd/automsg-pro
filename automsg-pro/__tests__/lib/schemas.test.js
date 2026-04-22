import { validatePayload, aiPromptSchema, scrapeQuerySchema, leadSchema, loginSchema, signupSchema } from '../../lib/schemas';

describe('Schemas Validation', () => {
  describe('aiPromptSchema', () => {
    it('should validate valid prompt', () => {
      const result = validatePayload(aiPromptSchema, { prompt: 'Hello world' });
      expect(result.success).toBe(true);
      expect(result.data.prompt).toBe('Hello world');
    });

    it('should reject empty prompt', () => {
      const result = validatePayload(aiPromptSchema, { prompt: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Prompt é obrigatório');
    });

    it('should reject prompt exceeding max length', () => {
      const longPrompt = 'a'.repeat(5001);
      const result = validatePayload(aiPromptSchema, { prompt: longPrompt });
      expect(result.success).toBe(false);
      expect(result.error).toContain('muito longo');
    });

    it('should accept customApiKey', () => {
      const result = validatePayload(aiPromptSchema, { prompt: 'Test', customApiKey: 'key123' });
      expect(result.success).toBe(true);
      expect(result.data.customApiKey).toBe('key123');
    });
  });

  describe('scrapeQuerySchema', () => {
    it('should validate valid query', () => {
      const result = validatePayload(scrapeQuerySchema, { query: 'Salão de beleza em SP' });
      expect(result.success).toBe(true);
      expect(result.data.query).toBe('Salão de beleza em SP');
      expect(result.data.offset).toBe(0);
      expect(result.data.limit).toBe(15);
    });

    it('should reject empty query', () => {
      const result = validatePayload(scrapeQuerySchema, { query: '' });
      expect(result.success).toBe(false);
    });

    it('should respect limit max', () => {
      const result = validatePayload(scrapeQuerySchema, { query: 'test', limit: 50 });
      expect(result.success).toBe(false);
    });

    it('should use default values', () => {
      const result = validatePayload(scrapeQuerySchema, { query: 'test' });
      expect(result.success).toBe(true);
      expect(result.data.offset).toBe(0);
      expect(result.data.limit).toBe(15);
    });
  });

  describe('leadSchema', () => {
    it('should validate valid lead', () => {
      const result = validatePayload(leadSchema, {
        nome: 'Empresa X',
        telefone: '11999999999',
      });
      expect(result.success).toBe(true);
    });

    it('should reject lead without nome', () => {
      const result = validatePayload(leadSchema, { telefone: '11999999999' });
      expect(result.success).toBe(false);
    });

    it('should reject lead without telefone', () => {
      const result = validatePayload(leadSchema, { nome: 'Empresa X' });
      expect(result.success).toBe(false);
    });

    it('should accept optional instagram', () => {
      const result = validatePayload(leadSchema, {
        nome: 'Empresa X',
        telefone: '11999999999',
        instagram: '@empresax',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login', () => {
      const result = validatePayload(loginSchema, {
        email: 'test@example.com',
        password: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = validatePayload(loginSchema, {
        email: 'not-an-email',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = validatePayload(loginSchema, {
        email: 'test@example.com',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should validate valid signup', () => {
      const result = validatePayload(signupSchema, {
        email: 'test@example.com',
        password: '123456',
        fullName: 'John Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should reject signup without fullName', () => {
      const result = validatePayload(signupSchema, {
        email: 'test@example.com',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional phone', () => {
      const result = validatePayload(signupSchema, {
        email: 'test@example.com',
        password: '123456',
        fullName: 'John Doe',
        phone: '11999999999',
      });
      expect(result.success).toBe(true);
    });
  });
});