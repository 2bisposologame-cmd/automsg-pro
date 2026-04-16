'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  MessageSquare,
  Users,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface Conversation {
  id: string;
  client_name: string;
  client_email: string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
  last_message_at: string;
  response_count: number;
  ai_response_count: number;
}

interface Stats {
  totalConversations: number;
  closedConversations: number;
  totalMessages: number;
  avgResponseTime: string;
}

export default function HistoricoPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    closedConversations: 0,
    totalMessages: 0,
    avgResponseTime: '--',
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const [conversationsResult, closedResult, messagesResult] = await Promise.all([
        supabase
          .from('conversations')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id)
          .eq('status', 'closed'),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id),
      ]);

      setConversations(conversationsResult.data || []);
      setStats({
        totalConversations: conversationsResult.count || 0,
        closedConversations: closedResult.count || 0,
        totalMessages: messagesResult.count || 0,
        avgResponseTime: '< 5 min',
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.client_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="success">Aberta</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fechada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/4 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-96 rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Histórico</h1>
        <p className="mt-1 text-gray-500">
          Acompanhe todas as conversas e métricas do seu atendimento
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Conversas</CardTitle>
            <MessageSquare className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Conversas Fechadas</CardTitle>
            <History className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.closedConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Mensagens</CardTitle>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tempo Médio</CardTitle>
            <Clock className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgResponseTime}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Todas as Conversas</CardTitle>
              <CardDescription>
                {filteredConversations.length} conversa(s) encontrada(s)
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  className="w-full pl-9 sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="closed">Fechadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredConversations.length === 0 ? (
            <div className="py-12 text-center">
              <History className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Nenhuma conversa encontrada
              </h3>
              <p className="mb-6 text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tente ajustar seus filtros de busca'
                  : 'Suas conversas aparecerão aqui'}
              </p>
              <Link href="/chat">
                <Button className="bg-blue-600 hover:bg-blue-700">Ir para Chat</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 rounded-lg bg-gray-50 px-4 py-2 text-xs font-medium uppercase text-gray-500">
                <div className="col-span-4">Cliente</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Mensagens</div>
                <div className="col-span-2">Data</div>
                <div className="col-span-2"></div>
              </div>
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="grid grid-cols-12 items-center gap-4 rounded-lg border border-gray-100 px-4 py-4 transition hover:bg-gray-50"
                >
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-sm font-semibold text-gray-600">
                          {conv.client_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{conv.client_name || 'Cliente'}</p>
                        <p className="text-sm text-gray-500">{conv.client_email || 'Sem email'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">{getStatusBadge(conv.status)}</div>
                  <div className="col-span-2 text-sm text-gray-600">{conv.response_count} msgs</div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {formatDate(conv.created_at)}
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <Link href={`/chat/${conv.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver detalhes
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
