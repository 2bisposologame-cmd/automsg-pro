'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import {
  FileText,
  Search,
  Plus,
  Download,
  Eye,
  Trash2,
  Copy,
  Send,
  Check,
  X,
  Loader2,
  Calendar,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
}

interface BudgetItem {
  service_id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Budget {
  id: string;
  tenant_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  items: BudgetItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  validity_days: number;
  created_at: string;
  updated_at: string;
}

interface NewBudgetForm {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  notes: string;
  validity_days: number;
}

export default function OrcamentosPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedServices, setSelectedServices] = useState<BudgetItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewBudgetForm>({
    defaultValues: {
      validity_days: 7,
    },
  });

  const watchedValidity = watch('validity_days');

  useEffect(() => {
    fetchBudgets();
    fetchServices();
  }, [user]);

  const fetchBudgets = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { data: budgetsData } = await supabase
        .from('budgets')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (!budgetsData || budgetsData.length === 0) {
        setBudgets([]);
        setLoading(false);
        return;
      }

      const { data: budgetItems } = await supabase
        .from('budget_items')
        .select('*')
        .in(
          'budget_id',
          budgetsData.map((b: any) => b.id)
        );

      const { data: allServices } = await supabase
        .from('services')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id);

      const servicesMap = new Map((allServices || []).map((s: any) => [s.id, s.name]));

      const budgetsWithItems = budgetsData.map((budget: any) => ({
        ...budget,
        items:
          budgetItems
            ?.filter((item: any) => item.budget_id === budget.id)
            .map((item: any) => ({
              service_id: item.service_id,
              service_name: item.description || servicesMap.get(item.service_id) || 'Serviço',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
            })) || [],
      }));

      setBudgets(budgetsWithItems);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');

      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const handleServiceToggle = (service: Service) => {
    const exists = selectedServices.find((s) => s.service_id === service.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.service_id !== service.id));
    } else {
      setSelectedServices([
        ...selectedServices,
        {
          service_id: service.id,
          service_name: service.name,
          quantity: 1,
          unit_price: service.price,
          total: service.price,
        },
      ]);
    }
  };

  const updateItemQuantity = (serviceId: string, quantity: number) => {
    setSelectedServices(
      selectedServices.map((item) =>
        item.service_id === serviceId
          ? { ...item, quantity, total: quantity * item.unit_price }
          : item
      )
    );
  };

  const calculateTotals = () => {
    const subtotal = selectedServices.reduce((sum, item) => sum + item.total, 0);
    const totalDiscount = (subtotal * discount) / 100;
    const total = subtotal - totalDiscount;
    return { subtotal, totalDiscount, total };
  };

  const { subtotal, totalDiscount, total } = calculateTotals();

  const onSubmit = async (data: NewBudgetForm) => {
    if (!user || selectedServices.length === 0) {
      alert('Selecione pelo menos um serviço');
      return;
    }

    setSaving(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { data: tenant } = await supabase
        .from('tenants')
        .select('company_name, company_document, company_phone, company_email, company_address')
        .eq('id', profile.tenant_id)
        .single();

      const { data: newBudget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          tenant_id: profile.tenant_id,
          client_name: data.client_name,
          client_email: data.client_email || null,
          client_phone: data.client_phone || null,
          client_address: data.client_address || null,
          status: 'draft',
          subtotal,
          discount,
          total,
          notes: data.notes || null,
          validity_days: data.validity_days,
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      for (const item of selectedServices) {
        const { data: serviceData } = await supabase
          .from('services')
          .select('name')
          .eq('id', item.service_id)
          .single();

        await supabase.from('budget_items').insert({
          budget_id: newBudget.id,
          service_id: item.service_id,
          tenant_id: profile.tenant_id,
          description: serviceData?.name || item.service_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.total,
          total: item.total,
        });
      }

      reset();
      setSelectedServices([]);
      setDiscount(0);
      setDialogOpen(false);
      fetchBudgets();
    } catch (err) {
      console.error('Error creating budget:', err);
      alert('Erro ao criar orçamento');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (budgetId: string, newStatus: Budget['status']) => {
    try {
      await supabase.from('budgets').update({ status: newStatus }).eq('id', budgetId);
      fetchBudgets();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

    try {
      await supabase.from('budget_items').delete().eq('budget_id', budgetId);
      await supabase.from('budgets').delete().eq('id', budgetId);
      fetchBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };

  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch =
      budget.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      budget.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      budget.client_phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Budget['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels = {
      draft: 'Rascunho',
      sent: 'Enviado',
      accepted: 'Aceito',
      rejected: 'Recusado',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Orçamentos</h1>
          <p className="mt-1 text-gray-500">{budgets.length} orçamento(s) cadastrado(s)</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por cliente..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="sent">Enviado</option>
          <option value="accepted">Aceito</option>
          <option value="rejected">Recusado</option>
        </select>
      </div>

      {filteredBudgets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Nenhum orçamento encontrado
              </h3>
              <p className="mb-6 text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tente ajustar sua busca'
                  : 'Crie seu primeiro orçamento'}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBudgets.map((budget) => (
            <Card key={budget.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{budget.client_name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(budget.created_at)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(budget.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    {budget.client_name}
                  </div>
                  {budget.client_email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {budget.client_email}
                    </div>
                  )}
                  {budget.client_phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {budget.client_phone}
                    </div>
                  )}
                </div>
                <div className="mb-4 border-t pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{budget.items.length} serviço(s)</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(budget.total)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedBudget(budget);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    Ver
                  </Button>
                  {budget.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(budget.id, 'sent')}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteBudget(budget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar orçamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nome do Cliente *</Label>
                <Input
                  id="client_name"
                  placeholder="Nome completo"
                  {...register('client_name', { required: 'Nome é obrigatório' })}
                />
                {errors.client_name && (
                  <p className="text-sm text-red-500">{errors.client_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_email">Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  placeholder="email@exemplo.com"
                  {...register('client_email')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone</Label>
                <Input
                  id="client_phone"
                  placeholder="(11) 99999-9999"
                  {...register('client_phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity_days">Validade (dias)</Label>
                <Input
                  id="validity_days"
                  type="number"
                  min="1"
                  {...register('validity_days', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_address">Endereço</Label>
              <Textarea
                id="client_address"
                placeholder="Endereço do cliente"
                rows={2}
                {...register('client_address')}
              />
            </div>

            <div className="space-y-3">
              <Label>Serviços *</Label>
              <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border p-2">
                {services.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">
                    Nenhum serviço cadastrado. Cadastre serviços primeiro.
                  </p>
                ) : (
                  services.map((service) => {
                    const isSelected = selectedServices.some((s) => s.service_id === service.id);
                    return (
                      <label
                        key={service.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleServiceToggle(service)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(service.price)}
                              {service.unit && ` / ${service.unit}`}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {selectedServices.length > 0 && (
                <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
                  <Label className="text-sm font-medium">Itens selecionados</Label>
                  {selectedServices.map((item) => (
                    <div
                      key={item.service_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{item.service_name}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(item.service_id, parseInt(e.target.value) || 1)
                          }
                          className="w-16"
                        />
                        <span className="w-24 text-right font-medium">
                          {formatCurrency(item.total)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedServices(
                              selectedServices.filter((s) => s.service_id !== item.service_id)
                            )
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações ou condições do orçamento"
                rows={3}
                {...register('notes')}
              />
            </div>

            <div className="flex items-center gap-4 rounded-lg border bg-gray-50 p-4">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-600">Desconto (%):</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>- Desconto:</span>
                    <span>- {formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDialogOpen(false);
                  reset();
                  setSelectedServices([]);
                  setDiscount(0);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={saving || selectedServices.length === 0}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Orçamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar orçamento */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedBudget && (
            <>
              <DialogHeader>
                <DialogTitle>Orçamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{selectedBudget.client_name}</h3>
                    {selectedBudget.client_email && (
                      <p className="text-sm text-gray-500">{selectedBudget.client_email}</p>
                    )}
                    {selectedBudget.client_phone && (
                      <p className="text-sm text-gray-500">{selectedBudget.client_phone}</p>
                    )}
                  </div>
                  {getStatusBadge(selectedBudget.status)}
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <h4 className="font-medium">Itens</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2">Serviço</th>
                        <th className="pb-2 text-center">Qtd</th>
                        <th className="pb-2 text-right">Valor</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBudget.items.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{item.service_name}</td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="py-2 text-right">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1 rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(selectedBudget.subtotal)}</span>
                  </div>
                  {selectedBudget.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto ({selectedBudget.discount}%):</span>
                      <span>
                        -{' '}
                        {formatCurrency((selectedBudget.subtotal * selectedBudget.discount) / 100)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedBudget.total)}</span>
                  </div>
                </div>

                {selectedBudget.notes && (
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">Observações</h4>
                    <p className="text-sm text-gray-600">{selectedBudget.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setViewDialogOpen(false)}
                  >
                    Fechar
                  </Button>
                  {selectedBudget.status === 'draft' && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleStatusChange(selectedBudget.id, 'sent');
                        setViewDialogOpen(false);
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Marcar como Enviado
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
