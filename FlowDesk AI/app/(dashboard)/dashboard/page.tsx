'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Package,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Bot,
  Zap,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Stats {
  conversations: number;
  openConversations: number;
  leads: number;
  newLeads: number;
  services: number;
  messages: number;
}

interface RecentConversation {
  id: string;
  client_name: string;
  last_message_preview: string;
  last_message_at: string;
  status: string;
}

interface Tenant {
  id: string;
  name: string;
  plan: string;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  href,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
}) => {
  const content = (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
          <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
        </div>
        {href && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center py-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="text-xs font-medium text-blue-600">Ver detalhes</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({
    conversations: 0,
    openConversations: 0,
    leads: 0,
    newLeads: 0,
    services: 0,
    messages: 0,
  });
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (!profile) return;

        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .single();
        setTenant(tenantData);

        const [conversationsResult, leadsResult, servicesResult, messagesResult] =
          await Promise.all([
            supabase
              .from('conversations')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', profile.tenant_id),
            supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', profile.tenant_id),
            supabase
              .from('services')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', profile.tenant_id),
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', profile.tenant_id),
          ]);

        const { count: openConv } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id)
          .eq('status', 'open');

        const { count: newLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id)
          .eq('status', 'new');

        setStats({
          conversations: conversationsResult.count || 0,
          openConversations: openConv || 0,
          leads: leadsResult.count || 0,
          newLeads: newLeads || 0,
          services: servicesResult.count || 0,
          messages: messagesResult.count || 0,
        });

        const { data: recent } = await supabase
          .from('conversations')
          .select('id, client_name, last_message_preview, last_message_at, status')
          .eq('tenant_id', profile.tenant_id)
          .order('last_message_at', { ascending: false })
          .limit(6);
        setRecentConversations(recent || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-80 animate-pulse rounded-2xl bg-gray-200 lg:col-span-2" />
        </div>
      </div>
    );
  }

  const pendingSetup = stats.services === 0;

  return (
    <div className="-m-6 min-h-screen bg-gray-50/50 p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0]}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {tenant?.name ? `${tenant.name}` : 'Dashboard'} •{' '}
              {tenant?.plan === 'pro'
                ? 'Plano Pro'
                : tenant?.plan === 'enterprise'
                  ? 'Plano Enterprise'
                  : 'Plano Grátis'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/chat">
              <Button size="sm" className="bg-blue-600 shadow-sm shadow-blue-200 hover:bg-blue-700">
                <MessageSquare className="mr-2 h-4 w-4" />
                Nova Conversa
              </Button>
            </Link>
            <Link href="/servicos">
              <Button size="sm" variant="outline" className="border-gray-200">
                <Plus className="mr-2 h-4 w-4" />
                Novo Serviço
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            title="Conversas Abertas"
            value={stats.openConversations}
            subtitle={`${stats.conversations} total`}
            icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
            href="/chat"
          />
          <StatCard
            title="Leads Novos"
            value={stats.newLeads}
            subtitle={`${stats.leads} total`}
            icon={<Users className="h-5 w-5 text-emerald-600" />}
            color="bg-emerald-50"
            href="/leads"
          />
          <StatCard
            title="Serviços"
            value={stats.services}
            subtitle="cadastrados"
            icon={<Package className="h-5 w-5 text-violet-600" />}
            color="bg-violet-50"
            href="/servicos"
          />
          <StatCard
            title="Mensagens"
            value={stats.messages}
            subtitle="enviadas"
            icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
            color="bg-amber-50"
          />
        </div>

        {pendingSetup && (
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-amber-100 p-3">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900">Configure sua conta</h3>
                  <p className="text-sm text-amber-700">
                    Cadastre seus serviços para ativar o atendimento com IA
                  </p>
                </div>
                <Link href="/servicos">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                    Cadastrar Serviços
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Conversas Recentes</CardTitle>
                  <CardDescription>Últimas interações com clientes</CardDescription>
                </div>
                <Link href="/chat">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Ver todas
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentConversations.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="mb-4 text-gray-500">Nenhuma conversa ainda</p>
                  <Link href="/chat">
                    <Button size="sm" variant="outline">
                      Iniciar primeira conversa
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {recentConversations.map((conv) => (
                    <Link
                      key={conv.id}
                      href={`/chat/${conv.id}`}
                      className="group rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${
                            conv.status === 'open'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {conv.client_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {conv.client_name || 'Cliente'}
                            </p>
                            <Badge
                              variant={conv.status === 'open' ? 'success' : 'secondary'}
                              className="px-1.5 py-0.5 text-[10px]"
                            >
                              {conv.status === 'open' ? 'Aberta' : 'Fechada'}
                            </Badge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {conv.last_message_preview || 'Sem mensagens'}
                          </p>
                          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(conv.last_message_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Link href="/chat" className="block">
                <div className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-blue-50">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Atender Cliente</p>
                    <p className="text-xs text-gray-500">Iniciar nova conversa</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-600" />
                </div>
              </Link>

              <Link href="/servicos" className="block">
                <div className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-violet-50">
                  <div className="rounded-lg bg-violet-100 p-2">
                    <Package className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Gerenciar Serviços</p>
                    <p className="text-xs text-gray-500">{stats.services} cadastrados</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-violet-600" />
                </div>
              </Link>

              <Link href="/historico" className="block">
                <div className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-emerald-50">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Ver Relatórios</p>
                    <p className="text-xs text-gray-500">Histórico e métricas</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-emerald-600" />
                </div>
              </Link>

              <Link href="/configuracoes" className="block">
                <div className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Configurar IA</p>
                    <p className="text-xs text-gray-500">Personalizar assistente</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-600" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Atendimento com IA Ativo</h3>
              <p className="text-sm text-blue-100">
                Sua assistente responde automaticamente 24 horas
              </p>
            </div>
          </div>
          <Link href="/chat">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Testar Agente
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
