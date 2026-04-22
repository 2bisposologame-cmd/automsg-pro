-- AutoMsg Pro - Rollback Script
-- Execute this script to remove all new tables and features

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at();

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.imports CASCADE;
DROP TABLE IF EXISTS public.campaign_messages CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Note: auth.users is managed by Supabase, do NOT delete it