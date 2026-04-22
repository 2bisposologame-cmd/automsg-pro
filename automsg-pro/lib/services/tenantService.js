import { supabase } from '../supabase.js';
import { createLogger } from '../logger.js';

const logger = createLogger('TenantService');

export const TenantRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

export const tenantService = {
  async create(slug, name, ownerId) {
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (error) {
      logger.error('Create tenant failed', { slug, error: error.message });
      throw error;
    }

    await this.addMember(data.id, ownerId, TenantRole.OWNER);

    logger.info('Tenant created', { tenantId: data.id, slug });
    return data;
  },

  async getById(tenantId, userId) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*, tenant_members(role)')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      return null;
    }

    const membership = data.tenant_members?.find(m => m.user_id === userId);
    if (!membership) {
      return null;
    }

    delete data.tenant_members;
    return { ...data, role: membership.role };
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  async getUserTenants(userId) {
    const { data, error } = await supabase
      .from('tenant_members')
      .select('*, tenants(*)')
      .eq('user_id', userId);

    if (error) {
      logger.error('Get user tenants failed', { userId, error: error.message });
      throw error;
    }

    return data.map(m => ({
      ...m.tenants,
      role: m.role,
    }));
  },

  async addMember(tenantId, userId, role = TenantRole.MEMBER) {
    const { data, error } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) {
      logger.error('Add member failed', { tenantId, userId, error: error.message });
      throw error;
    }

    logger.info('Member added', { tenantId, userId, role });
    return data;
  },

  async removeMember(tenantId, userId) {
    const { error } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Remove member failed', { tenantId, userId, error: error.message });
      throw error;
    }

    logger.info('Member removed', { tenantId, userId });
  },

  async updateMemberRole(tenantId, userId, role) {
    const { data, error } = await supabase
      .from('tenant_members')
      .update({ role })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Update role failed', { tenantId, userId, error: error.message });
      throw error;
    }

    return data;
  },

  async getMembers(tenantId) {
    const { data, error } = await supabase
      .from('tenant_members')
      .select('*, profiles(email, full_name, phone)')
      .eq('tenant_id', tenantId);

    if (error) {
      logger.error('Get members failed', { tenantId, error: error.message });
      throw error;
    }

    return data.map(m => ({
      ...m.profiles,
      role: m.role,
      joinedAt: m.created_at,
    }));
  },

  async hasAccess(tenantId, userId, requiredRole = TenantRole.VIEWER) {
    const roleHierarchy = {
      [TenantRole.VIEWER]: 0,
      [TenantRole.MEMBER]: 1,
      [TenantRole.ADMIN]: 2,
      [TenantRole.OWNER]: 3,
    };

    const { data, error } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return roleHierarchy[data.role] >= roleHierarchy[requiredRole];
  },

  async updateSettings(tenantId, userId, settings) {
    const hasAdminAccess = await this.hasAccess(tenantId, userId, TenantRole.ADMIN);
    if (!hasAdminAccess) {
      throw new Error('Insufficient permissions');
    }

    const { data, error } = await supabase
      .from('tenants')
      .update({ settings })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      logger.error('Update settings failed', { tenantId, error: error.message });
      throw error;
    }

    return data;
  },
};