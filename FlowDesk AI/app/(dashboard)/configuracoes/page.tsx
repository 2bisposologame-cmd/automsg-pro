'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Bot,
  Building2,
  User,
  Bell,
  Key,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Zap,
  TestTube,
  Check,
  X,
} from 'lucide-react';

const companySchema = z.object({
  company_name: z.string().optional(),
  company_document: z.string().optional(),
  company_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().optional(),
});

const aiSchema = z.object({
  ai_name: z.string().optional(),
  ai_welcome_message: z.string().optional(),
  ai_instructions: z.string().optional(),
  ai_auto_respond: z.boolean().optional(),
  ai_model: z.string().optional(),
  ai_temperature: z.number().optional(),
});

type CompanyForm = z.infer<typeof companySchema>;
type AIForm = z.infer<typeof aiSchema>;

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  company_name: string | null;
  company_document: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  ai_name: string | null;
  ai_welcome_message: string | null;
  ai_instructions: string | null;
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('company');
  const [aiStatus, setAiStatus] = useState<'untested' | 'connected' | 'error'>('untested');
  const [testingConnection, setTestingConnection] = useState(false);

  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
  });

  const aiForm = useForm<AIForm>({
    resolver: zodResolver(aiSchema),
  });

  useEffect(() => {
    fetchTenant();
  }, [user]);

  const fetchTenant = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();

      if (data) {
        setTenant(data);
        companyForm.reset({
          company_name: data.company_name || '',
          company_document: data.company_document || '',
          company_address: data.company_address || '',
          company_phone: data.company_phone || '',
          company_email: data.company_email || '',
        });
        aiForm.reset({
          ai_name: data.ai_name || '',
          ai_welcome_message: data.ai_welcome_message || '',
          ai_instructions: data.ai_instructions || '',
        });
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async (data: CompanyForm) => {
    if (!tenant) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.from('tenants').update(data).eq('id', tenant.id);

      if (error) throw error;
      setSuccess('Dados da empresa salvos com sucesso!');
      fetchTenant();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAI = async (data: AIForm) => {
    if (!tenant) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.from('tenants').update(data).eq('id', tenant.id);

      if (error) throw error;
      setSuccess('Configurações da IA salvas com sucesso!');
      fetchTenant();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setAiStatus('untested');
    try {
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.connected) {
        setAiStatus('connected');
        setSuccess('Conexão com Gemini estabelecida com sucesso!');
      } else {
        setAiStatus('error');
        setError(data.error || 'Falha ao conectar com Gemini. Verifique a API Key.');
      }
    } catch {
      setAiStatus('error');
      setError('Erro ao testar conexão com Gemini');
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/4 rounded bg-gray-200" />
        <div className="h-96 rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Configurações</h1>
        <p className="mt-1 text-gray-500">
          Gerencie as configurações da sua empresa e da IA assistente
        </p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full space-y-2 lg:w-64">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
              activeTab === 'company'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Building2 className="h-5 w-5" />
            Empresa
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
              activeTab === 'ai' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bot className="h-5 w-5" />
            IA Assistente
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
              activeTab === 'account'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User className="h-5 w-5" />
            Minha Conta
          </button>
        </div>

        <div className="flex-1">
          {activeTab === 'company' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Dados da Empresa</CardTitle>
                    <CardDescription>
                      Informações usadas nos orçamentos e comunicações
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={companyForm.handleSubmit(handleSaveCompany)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Nome da Empresa</Label>
                      <Input
                        id="company_name"
                        {...companyForm.register('company_name')}
                        placeholder="Sua Empresa Ltda"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_document">CNPJ/CPF</Label>
                      <Input
                        id="company_document"
                        {...companyForm.register('company_document')}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company_phone">Telefone</Label>
                      <Input
                        id="company_phone"
                        {...companyForm.register('company_phone')}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_email">Email</Label>
                      <Input
                        id="company_email"
                        type="email"
                        {...companyForm.register('company_email')}
                        placeholder="contato@empresa.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_address">Endereço</Label>
                    <Textarea
                      id="company_address"
                      {...companyForm.register('company_address')}
                      placeholder="Rua Example, 123 - Centro - São Paulo/SP"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bot className="h-6 w-6 text-blue-600" />
                      <div>
                        <CardTitle>Configuração da IA</CardTitle>
                        <CardDescription>
                          Personalize como sua assistente virtual responde aos clientes
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="gap-2"
                    >
                      {testingConnection ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : aiStatus === 'connected' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : aiStatus === 'error' ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      Testar Conexão
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-blue-900">Powered by Google Gemini</h4>
                        <p className="mt-1 text-sm text-blue-700">
                          Sua assistente usa a API do Google Gemini 2.0 Flash para gerar respostas
                          inteligentes e contextuais baseadas nos seus serviços cadastrados.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={aiForm.handleSubmit(handleSaveAI)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai_name">Nome da Assistente</Label>
                      <Input
                        id="ai_name"
                        {...aiForm.register('ai_name')}
                        placeholder="Maria, Ana, Clara..."
                      />
                      <p className="text-sm text-gray-500">
                        Como sua assistente deve se apresentar aos clientes
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai_welcome_message">Mensagem de Boas-vindas</Label>
                      <Textarea
                        id="ai_welcome_message"
                        {...aiForm.register('ai_welcome_message')}
                        placeholder="Olá! Sou a Maria, assistente virtual. Como posso ajudar?"
                        rows={3}
                      />
                      <p className="text-sm text-gray-500">
                        Primeira mensagem que a IA envia ao cliente
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai_instructions">Instruções para a IA</Label>
                      <Textarea
                        id="ai_instructions"
                        {...aiForm.register('ai_instructions')}
                        placeholder="Você é uma assistente de uma clínica de estética. Seu trabalho é:
- Responder dúvidas sobre preços e serviços
- Agendar horários
- Ser simpática e profissional
- Nunca inventar informações sobre serviços não cadastrados"
                        rows={6}
                        className="font-mono text-sm"
                      />
                      <p className="text-sm text-gray-500">
                        Defina o comportamento e regras da sua assistente
                      </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
                      <input
                        type="checkbox"
                        id="ai_auto_respond"
                        {...aiForm.register('ai_auto_respond')}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <Label htmlFor="ai_auto_respond" className="cursor-pointer">
                          <Zap className="mr-1 inline h-4 w-4 text-amber-500" />
                          Auto-resposta inteligente
                        </Label>
                        <p className="text-sm text-gray-500">
                          Quando ativado, a IA responde automaticamente mensagens de clientes usando
                          as informações dos seus serviços cadastrados
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Configurações
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Como usar a IA no Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-600">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Modo Manual</p>
                      <p>
                        Digite uma mensagem e clique no ícone de sparkle para gerar uma resposta da
                        IA. Depois edite e envie.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Modo Auto-resposta</p>
                      <p>
                        Ative o toggle &quot;Usar IA para responder&quot; na tela de chat. A IA
                        responderá automaticamente usando os preços dos seus serviços.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Configure seus Serviços</p>
                      <p>
                        Adicione seus serviços com preços na aba &quot;Serviços&quot; para que a IA
                        possa informar valores aos clientes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Minha Conta</CardTitle>
                    <CardDescription>Informações da sua conta de usuário</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-2xl font-bold text-blue-600">
                      {user?.user_metadata?.name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {user?.user_metadata?.name || 'Usuário'}
                    </h3>
                    <p className="text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b py-3">
                    <div>
                      <p className="font-medium">Plano Atual</p>
                      <p className="text-sm text-gray-500">Seu plano de assinatura</p>
                    </div>
                    <Badge variant="secondary" className="px-3 py-1 text-base">
                      {tenant?.plan || 'free'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between border-b py-3">
                    <div>
                      <p className="font-medium">Empresa</p>
                      <p className="text-sm text-gray-500">{tenant?.name}</p>
                    </div>
                    <Badge variant="outline">{tenant?.slug}</Badge>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Gerenciar Assinatura</p>
                      <p className="text-sm text-gray-500">Atualize ou cancele seu plano</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Acessar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
