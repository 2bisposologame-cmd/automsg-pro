'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Plus, Pencil, Trash2, Loader2, Search, X, Clock, Check } from 'lucide-react';

const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.string().min(1, 'Preço é obrigatório'),
  duration_minutes: z.string().optional(),
  category: z.string().optional(),
});

type ServiceForm = z.infer<typeof serviceSchema>;

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  sort_order: number;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
  });

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const fetchServices = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('is_active', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onSubmit = async (formData: ServiceForm) => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price.replace(',', '.')),
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        category: formData.category || null,
        tenant_id: profile.tenant_id,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        showNotification('success', 'Serviço atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('services').insert(serviceData);

        if (error) throw error;
        showNotification('success', 'Serviço criado com sucesso!');
      }

      reset();
      setEditingService(null);
      setDialogOpen(false);
      fetchServices();
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao salvar serviço');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration_minutes: service.duration_minutes?.toString() || '',
      category: service.category || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Excluir "${service.name}"?`)) return;
    setDeleting(service.id);

    try {
      const { error } = await supabase.from('services').delete().eq('id', service.id);

      if (error) throw error;
      showNotification('success', 'Serviço excluído!');
      fetchServices();
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao excluir serviço');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      showNotification('success', service.is_active ? 'Serviço desativado' : 'Serviço ativado');
      fetchServices();
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao atualizar');
    }
  };

  const handleNewService = () => {
    setEditingService(null);
    reset({
      name: '',
      description: '',
      price: '',
      duration_minutes: '',
      category: '',
    });
    setDialogOpen(true);
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeServices = filteredServices.filter((s) => s.is_active);
  const inactiveServices = filteredServices.filter((s) => !s.is_active);

  return (
    <div className="-m-6 min-h-screen bg-gray-50/50 p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {services.length} serviço(s) cadastrado(s)
            </p>
          </div>
          <Button
            onClick={handleNewService}
            className="bg-blue-600 shadow-sm shadow-blue-200 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        </div>

        {notification && (
          <div
            className={`flex items-center gap-3 rounded-xl p-4 ${
              notification.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="h-5 w-5 text-emerald-600" />
            ) : (
              <X className="h-5 w-5 text-red-600" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar serviços..."
            className="bg-white pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {searchQuery ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
                </h3>
                <p className="mx-auto mb-6 max-w-sm text-gray-500">
                  {searchQuery
                    ? 'Tente buscar por outro termo'
                    : 'Cadastre seus serviços para que a IA possa responder dúvidas dos clientes automaticamente'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleNewService} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar primeiro serviço
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {activeServices.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Ativos ({activeServices.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeServices.map((service) => (
                    <Card
                      key={service.id}
                      className="group overflow-hidden transition-all duration-200 hover:shadow-lg"
                    >
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{service.name}</h3>
                              {service.category && (
                                <Badge variant="secondary" className="mt-0.5 text-xs">
                                  {service.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Ativo
                          </Badge>
                        </div>

                        <div className="mb-3 flex items-baseline justify-between">
                          <span className="text-2xl font-bold text-gray-900">
                            R$ {service.price.toFixed(2)}
                          </span>
                          {service.duration_minutes && (
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-3.5 w-3.5" />
                              {service.duration_minutes} min
                            </span>
                          )}
                        </div>

                        {service.description && (
                          <p className="mb-4 line-clamp-2 text-sm text-gray-500">
                            {service.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => handleToggleActive(service)}
                          >
                            Desativar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => handleEdit(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(service)}
                            disabled={deleting === service.id}
                          >
                            {deleting === service.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {inactiveServices.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Inativos ({inactiveServices.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {inactiveServices.map((service) => (
                    <Card
                      key={service.id}
                      className="group overflow-hidden opacity-60 transition-all duration-200 hover:shadow-lg"
                    >
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-700">{service.name}</h3>
                              {service.category && (
                                <Badge variant="secondary" className="mt-0.5 text-xs">
                                  {service.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-gray-500">
                            Inativo
                          </Badge>
                        </div>

                        <div className="mb-3 flex items-baseline justify-between">
                          <span className="text-2xl font-bold text-gray-700">
                            R$ {service.price.toFixed(2)}
                          </span>
                          {service.duration_minutes && (
                            <span className="flex items-center gap-1 text-sm text-gray-400">
                              <Clock className="h-3.5 w-3.5" />
                              {service.duration_minutes} min
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleToggleActive(service)}
                          >
                            Ativar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => handleEdit(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(service)}
                            disabled={deleting === service.id}
                          >
                            {deleting === service.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do serviço *</Label>
              <Input id="name" placeholder="Ex: Massagem Relaxante" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input id="price" type="text" placeholder="0,00" {...register('price')} />
                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duração (min)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  placeholder="60"
                  {...register('duration_minutes')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Ex: Estética, Bem-estar"
                {...register('category')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o serviço em detalhes..."
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
