'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export function useTenant() {
  const { user } = useAuth();
  const supabase = createClient();

  const getProfile = async () => {
    if (!user) return null;

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    return data;
  };

  const getTenant = async () => {
    if (!user) return null;

    const profile = await getProfile();
    if (!profile?.tenant_id) return null;

    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single();

    return data;
  };

  return { user, getProfile, getTenant };
}

export function useServices() {
  const { user } = useAuth();
  const supabase = createClient();

  const fetchServices = async () => {
    if (!user) return [];

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return [];

    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('sort_order', { ascending: true });

    return data || [];
  };

  const createService = async (service: {
    name: string;
    description?: string;
    price: number;
    duration_minutes?: number;
    category?: string;
  }) => {
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return { error: 'Profile not found' };

    const { data, error } = await supabase
      .from('services')
      .insert({ ...service, tenant_id: profile.tenant_id })
      .select()
      .single();

    return { data, error };
  };

  const updateService = async (
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      price: number;
      duration_minutes: number;
      category: string;
      is_active: boolean;
    }>
  ) => {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);

    return { error };
  };

  return { fetchServices, createService, updateService, deleteService };
}

export function useLeads() {
  const { user } = useAuth();
  const supabase = createClient();

  const fetchLeads = async (limit = 50) => {
    if (!user) return [];

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return [];

    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  };

  const createLead = async (lead: {
    name: string;
    email?: string;
    phone?: string;
    source?: string;
  }) => {
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return { error: 'Profile not found' };

    const { data, error } = await supabase
      .from('leads')
      .insert({ ...lead, tenant_id: profile.tenant_id })
      .select()
      .single();

    return { data, error };
  };

  const updateLead = async (
    id: string,
    updates: Partial<{
      name: string;
      email: string;
      phone: string;
      status: string;
      notes: string;
    }>
  ) => {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  };

  return { fetchLeads, createLead, updateLead };
}

export function useConversations() {
  const { user } = useAuth();
  const supabase = createClient();

  const fetchConversations = async (limit = 50) => {
    if (!user) return [];

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return [];

    const { data } = await supabase
      .from('conversations')
      .select('*, leads(name, email, phone)')
      .eq('tenant_id', profile.tenant_id)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    return data || [];
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return data || [];
  };

  const sendMessage = async (
    conversationId: string,
    content: string,
    sender: 'user' | 'assistant' = 'user'
  ) => {
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return { error: 'Profile not found' };

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        tenant_id: profile.tenant_id,
        sender,
        sender_id: user.id,
        content,
      })
      .select()
      .single();

    return { data, error };
  };

  const createConversation = async (clientData: {
    name: string;
    email?: string;
    phone?: string;
  }) => {
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return { error: 'Profile not found' };

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        tenant_id: profile.tenant_id,
        client_name: clientData.name,
        client_email: clientData.email,
        client_phone: clientData.phone,
        status: 'open',
      })
      .select()
      .single();

    return { data, error };
  };

  return { fetchConversations, fetchMessages, sendMessage, createConversation };
}
