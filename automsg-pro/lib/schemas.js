import { z } from 'zod';

export const aiPromptSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt é obrigatório')
    .max(5000, 'Prompt muito longo. Máximo 5000 caracteres'),
  customApiKey: z.string().optional(),
});

export const scrapeQuerySchema = z.object({
  query: z.string()
    .min(1, 'Query é obrigatória')
    .max(200, 'Query muito longa'),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(30).default(15),
});

export const leadSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  instagram: z.string().optional(),
  source: z.string().optional(),
  nicho: z.string().optional(),
  cidade: z.string().optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  segment: z.string().optional(),
  targetAudience: z.string().optional(),
  message: z.string().min(1, 'Mensagem é obrigatória').max(4000),
  leadIds: z.array(z.string().uuid()).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  fullName: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
});

export function validatePayload(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorIssues = result.error.issues || [];
    const errors = errorIssues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, error: errors };
  }
  return { success: true, data: result.data };
}