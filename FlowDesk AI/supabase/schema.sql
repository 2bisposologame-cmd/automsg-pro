-- FlowDesk AI - Database Schema
-- Execute este SQL no Supabase SQL Editor

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE tenant_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE budget_status AS ENUM ('draft', 'sent', 'accepted', 'rejected');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');

-- ============================================
-- TABLES
-- ============================================

-- Tenants (Empresas)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan tenant_plan DEFAULT 'free',
    business_type VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    currency VARCHAR(3) DEFAULT 'BRL',
    ai_instructions TEXT,
    ai_name VARCHAR(100) DEFAULT 'Assistente',
    ai_welcome_message TEXT,
    ai_auto_respond BOOLEAN DEFAULT false,
    ai_model VARCHAR(100) DEFAULT 'gemini-2.0-flash',
    ai_temperature DECIMAL(2, 1) DEFAULT 0.7,
    company_name VARCHAR(255),
    company_document VARCHAR(20),
    company_address TEXT,
    company_phone VARCHAR(20),
    company_email VARCHAR(255),
    monthly_messages_limit INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (Usuários)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    business_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id, tenant_id)
);

-- Services (Serviços)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2),
    unit VARCHAR(50),
    duration_minutes INTEGER,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_highlighted BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    source VARCHAR(100),
    status lead_status DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ
);

-- Conversations (Conversas)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    client_identifier VARCHAR(255),
    status VARCHAR(20) DEFAULT 'open',
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    response_count INTEGER DEFAULT 0,
    ai_response_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (Mensagens)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,
    sender_id UUID,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets (Orçamentos)
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    client_address TEXT,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    valid_until TIMESTAMPTZ,
    validity_days INTEGER DEFAULT 7,
    status budget_status DEFAULT 'draft',
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ
);

-- Budget Items (Itens do Orçamento)
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_services_tenant ON services(tenant_id);
CREATE INDEX idx_services_active ON services(tenant_id, is_active);
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_status ON leads(tenant_id, status);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_status ON conversations(tenant_id, status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX idx_budgets_status ON budgets(tenant_id, status);
CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Função para obter tenant_id do usuário atual (evita recursão)
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT p.tenant_id
        FROM profiles p
        WHERE p.id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para criar tenant ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    tenant_name VARCHAR(255);
BEGIN
    tenant_name := COALESCE(
        NEW.raw_user_meta_data->>'company_name',
        NEW.raw_user_meta_data->>'name',
        'Minha Empresa'
    );
    
    INSERT INTO tenants (name, slug, company_name)
    VALUES (
        tenant_name,
        LOWER(REPLACE(REPLACE(REPLACE(tenant_name, ' ', '-'), 'ã', 'a'), 'é', 'e')) || '-' || LEFT(NEW.id::TEXT, 8),
        tenant_name
    )
    RETURNING id INTO NEW.tenant_id;
    
    INSERT INTO profiles (id, tenant_id, full_name, email)
    VALUES (
        NEW.id,
        NEW.tenant_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.email
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Policies para tenants
CREATE POLICY "Users can view own tenant" ON tenants
    FOR SELECT USING (id = get_my_tenant_id());

CREATE POLICY "Users can update own tenant" ON tenants
    FOR UPDATE USING (id = get_my_tenant_id());

-- Policies para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can update own profile" ON profiles
    FOR ALL USING (tenant_id = get_my_tenant_id());

-- Policies para services
CREATE POLICY "Users can manage services in own tenant" ON services
    FOR ALL USING (tenant_id = get_my_tenant_id());

-- Policies para leads
CREATE POLICY "Users can manage leads in own tenant" ON leads
    FOR ALL USING (tenant_id = get_my_tenant_id());

-- Policies para conversations
CREATE POLICY "Users can manage conversations in own tenant" ON conversations
    FOR ALL USING (tenant_id = get_my_tenant_id());

-- Policies para messages
CREATE POLICY "Users can manage messages in own tenant" ON messages
    FOR ALL USING (tenant_id = get_my_tenant_id());

-- Policies para budgets
CREATE POLICY "Users can manage budgets in own tenant" ON budgets
    FOR ALL USING (tenant_id = get_my_tenant_id());

-- Policies para budget_items
CREATE POLICY "Users can manage budget_items in own tenant" ON budget_items
    FOR ALL USING (tenant_id = get_my_tenant_id());
