-- AutoMsg Pro - Schema do Banco de Dados
-- Tabelas: users, leads, campaigns, messages, imports, WhatsApp, consent, billing

-- Tabela de usuários (estende auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  instagram TEXT,
  source TEXT DEFAULT 'manual',
  source_id TEXT,
  nicho TEXT,
  cidade TEXT,
  consent_status TEXT DEFAULT 'pending',
  consent_at TIMESTAMPTZ,
  opt_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, telefone)
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  segment TEXT,
  target_audience TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_leads INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de mensagens (logs de envio)
CREATE TABLE IF NOT EXISTS public.campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  whatsapp_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de imports (lotes importados)
CREATE TABLE IF NOT EXISTS public.imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  total_records INTEGER DEFAULT 0,
  valid_records INTEGER DEFAULT 0,
  invalid_records INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Tabela de consentimento (opt-in/opt-out)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT DEFAULT 'campaign',
  opt_in_at TIMESTAMPTZ,
  opt_out_at TIMESTAMPTZ,
  opt_out_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phone)
);

-- Tabela de config do WhatsApp (conexão com API oficial)
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.probases(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  business_account_id TEXT,
  webhook_verify_token TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de tenants (multi-tenant)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de membros do tenant
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Tabela de usage (billing por uso)
CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de planos
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_telefone ON public.leads(telefone);
CREATE INDEX IF NOT EXISTS idx_leads_consent_status ON public.leads(consent_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON public.campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_status ON public.campaign_messages(status);
CREATE INDEX IF NOT EXISTS idx_imports_user_id ON public.imports(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_phone ON public.consents(phone);
CREATE INDEX IF NOT EXISTS idx_consents_status ON public.consents(status);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_tenant_id ON public.usage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON public.usage_records(period_start, period_end);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (atualizadas com tenant isolation)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own leads" ON public.leads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own campaign messages" ON public.campaign_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create campaign messages" ON public.campaign_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can CRUD own imports" ON public.imports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own consents" ON public.consents
  FOR ALL USING (
    user_id IS NULL OR user_id = auth.uid()
  );

CREATE POLICY "Owners can manage own tenant" ON public.tenants
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Members can view tenant" ON public.tenants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Tenant members can manage members" ON public.tenant_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can view own usage" ON public.usage_records
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = usage_records.tenant_id AND user_id = auth.uid())
  );

-- Função para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar ao criar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir planos padrão
INSERT INTO public.plans (id, name, monthly_limit, price, features) VALUES
  ('free', 'Gratuito', 0, 0, '{"leads": 100, "campaigns": 1, "ai_generation": false}'),
  ('starter', 'Iniciante', 500, 49.90, '{"leads": 500, "campaigns": 5, "ai_generation": true}'),
  ('pro', 'Profissional', 2000, 99.90, '{"leads": 2000, "campaigns": 999, "ai_generation": true, "priority_support": true}'),
  ('enterprise', 'Empresarial', 999999, 299.90, '{"leads": 999999, "campaigns": 999, "ai_generation": true, "priority_support": true, "custom_integrations": true}')
ON CONFLICT (id) DO NOTHING;

-- Função para verificar limite de uso
CREATE OR REPLACE FUNCTION check_usage_limit(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_monthly_limit INTEGER;
  v_current_usage INTEGER;
  v_plan_limits JSONB;
BEGIN
  SELECT p.plan INTO v_plan FROM profiles p WHERE p.id = p_user_id;
  
  SELECT p.monthly_limit, p.features INTO v_monthly_limit, v_plan_limits
  FROM plans p WHERE p.id = COALESCE(v_plan, 'free');
  
  IF v_plan_limits->>p_feature = 'false' THEN
    RETURN FALSE;
  END IF;
  
  IF v_monthly_limit = 0 THEN
    RETURN TRUE;
  END IF;
  
  SELECT COUNT(*) INTO v_current_usage
  FROM usage_records ur
  WHERE ur.user_id = p_user_id
    AND ur.feature = p_feature
    AND ur.period_start >= DATE_TRUNC('month', NOW())
    AND ur.period_end < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
  
  RETURN v_current_usage < v_monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;