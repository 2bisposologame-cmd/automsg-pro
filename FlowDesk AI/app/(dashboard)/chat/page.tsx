'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  User,
  Bot,
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Conversation {
  id: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  status: 'open' | 'pending' | 'closed';
  last_message_preview: string | null;
  last_message_at: string;
  response_count: number;
  ai_response_count: number;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: 'client' | 'assistant' | 'user';
  sender_id: string | null;
  content: string;
  created_at: string;
}

interface NewConversationForm {
  name: string;
  email: string;
  phone: string;
}

interface PendingService {
  id: string;
  name: string;
  base_price: number | null;
  price: number | null;
}

export default function ChatPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [autoRespond, setAutoRespond] = useState(false);
  const [useRealAI, setUseRealAI] = useState(false);
  const [pendingBudget, setPendingBudget] = useState<PendingService[] | null>(null);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string | null>(null);

  const {
    register: registerNew,
    handleSubmit: handleNewSubmit,
    reset: resetNew,
    formState: { errors: errorsNew },
  } = useForm<NewConversationForm>();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('last_message_at', { ascending: false });

      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      setLoadingMessages(true);
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        setMessages(data || []);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [supabase, scrollToBottom]
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (sendToAI = false) => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    const messageContent = messageInput.trim();
    setMessageInput('');

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        tenant_id: profile.tenant_id,
        sender: 'user',
        sender_id: user.id,
        content: messageContent,
      });

      if (error) throw error;

      fetchMessages(selectedConversation.id);
      fetchConversations();

      if (autoRespond || sendToAI) {
        setAiLoading(true);
        try {
          const response = await fetch('/api/chat/smart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: selectedConversation.id,
              user_message: messageContent,
              pending_budget_services: pendingBudget || [],
            }),
          });

          const data = await response.json();
          console.log('AI Response:', data);

          if (response.ok && data.response) {
            await supabase.from('messages').insert({
              conversation_id: selectedConversation.id,
              tenant_id: profile.tenant_id,
              sender: 'assistant',
              sender_id: null,
              content: data.response,
            });

            await supabase
              .from('conversations')
              .update({
                ai_response_count: (selectedConversation.ai_response_count || 0) + 1,
              })
              .eq('id', selectedConversation.id);

            if (data.pendingBudget && data.pendingBudget.length > 0) {
              setPendingBudget(data.pendingBudget);
            } else {
              setPendingBudget(null);
            }

            fetchMessages(selectedConversation.id);
          } else if (data.error) {
            console.error('AI Error:', data.error);
            alert('Erro da IA: ' + data.error);
          }
        } catch (aiErr) {
          console.error('Error generating AI response:', aiErr);
          alert('Erro ao gerar resposta da IA');
        } finally {
          setAiLoading(false);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessageInput(messageContent);
    }
  };

  const handleGenerateAIResponse = async (contextMessage?: string) => {
    if (!selectedConversation || !user) return;

    const targetMessage = contextMessage || messageInput.trim();
    if (!targetMessage && !contextMessage) return;

    setAiLoading(true);
    try {
      const response = await fetch('/api/chat/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          user_message: targetMessage,
          pending_budget_services: pendingBudget,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar resposta');
      }

      const data = await response.json();
      const { response: aiResponse, pendingBudget: newPendingBudget, budgetCreated } = data;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        tenant_id: profile.tenant_id,
        sender: 'assistant',
        sender_id: null,
        content: aiResponse,
      });

      await supabase
        .from('conversations')
        .update({
          ai_response_count: (selectedConversation.ai_response_count || 0) + 1,
        })
        .eq('id', selectedConversation.id);

      if (newPendingBudget) {
        setPendingBudget(newPendingBudget);
        setLastAssistantMessage(aiResponse);
      } else {
        setPendingBudget(null);
        setLastAssistantMessage(null);
      }

      fetchMessages(selectedConversation.id);
      fetchConversations();
    } catch (err) {
      console.error('Error generating AI response:', err);
      alert('Erro ao gerar resposta da IA. Tente novamente.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleClientMessage = async () => {
    if (!messageInput.trim()) return;
    if (autoRespond) {
      await handleSendMessage(true);
    } else {
      await handleSendMessage(false);
    }
  };

  const handleCreateConversation = async (data: NewConversationForm) => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          tenant_id: profile.tenant_id,
          client_name: data.name,
          client_email: data.email || null,
          client_phone: data.phone || null,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;

      setConversations([newConv, ...conversations]);
      setSelectedConversation(newConv);
      setNewDialogOpen(false);
      resetNew();
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'closed' })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      setSelectedConversation({ ...selectedConversation, status: 'closed' });
      fetchConversations();
    } catch (err) {
      console.error('Error closing conversation:', err);
    }
  };

  const handleReopenConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'open' })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      setSelectedConversation({ ...selectedConversation, status: 'open' });
      fetchConversations();
    } catch (err) {
      console.error('Error reopening conversation:', err);
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.client_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'closed':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'pending':
        return 'Pendente';
      case 'closed':
        return 'Fechada';
      default:
        return status;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex w-80 flex-col border-r border-gray-200">
        <div className="space-y-3 border-b border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Conversas</h2>
            <Button
              size="sm"
              onClick={() => setNewDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              className="h-9 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">Nenhuma conversa</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setNewDialogOpen(true)}
              >
                Iniciar conversa
              </Button>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full border-b border-gray-50 p-4 text-left transition hover:bg-gray-50 ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      conv.status === 'open' ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-600">
                      {conv.client_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {conv.client_name || 'Cliente'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {conv.last_message_preview || 'Inicie uma conversa'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge className={`px-1.5 py-0.5 text-[10px] ${getStatusColor(conv.status)}`}>
                        {getStatusLabel(conv.status)}
                      </Badge>
                      {conv.ai_response_count > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-blue-600">
                          <Bot className="h-3 w-3" />
                          {conv.ai_response_count} IA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {selectedConversation ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    selectedConversation.status === 'open' ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}
                >
                  <span className="text-sm font-semibold text-gray-600">
                    {selectedConversation.client_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConversation.client_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedConversation.client_email ||
                      selectedConversation.client_phone ||
                      'Cliente'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(selectedConversation.status)}`}>
                  {getStatusLabel(selectedConversation.status)}
                </Badge>
                {selectedConversation.status === 'open' ? (
                  <Button variant="outline" size="sm" onClick={handleCloseConversation}>
                    Fechar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleReopenConversation}>
                    Reabrir
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="mb-1 font-semibold text-gray-900">Inicie a conversa</h3>
                  <p className="max-w-xs text-sm text-gray-500">
                    Envie a primeira mensagem para este cliente
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.sender !== 'user' && (
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            msg.sender === 'assistant' ? 'bg-blue-100' : 'bg-gray-200'
                          }`}
                        >
                          {msg.sender === 'assistant' ? (
                            <Bot className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                      )}
                      <div className={`max-w-[70%] ${msg.sender === 'user' ? 'order-1' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            msg.sender === 'user'
                              ? 'rounded-br-md bg-blue-600 text-white'
                              : msg.sender === 'assistant'
                                ? 'rounded-bl-md border border-gray-200 bg-white text-gray-900'
                                : 'rounded-bl-md bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </div>
                        <div
                          className={`mt-1 flex items-center gap-1 text-[10px] text-gray-400 ${
                            msg.sender === 'user' ? 'justify-end' : ''
                          }`}
                        >
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {msg.sender === 'user' && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-white p-4">
              {selectedConversation.status !== 'open' ? (
                <div className="flex items-center justify-center py-3 text-sm text-gray-500">
                  Conversa encerrada
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 hover:bg-gray-200">
                      <input
                        type="checkbox"
                        checked={autoRespond}
                        onChange={(e) => setAutoRespond(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-gray-600">Auto-resposta</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 hover:bg-gray-200">
                      <input
                        type="checkbox"
                        checked={useRealAI}
                        onChange={(e) => setUseRealAI(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-gray-600">Usar Gemini</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        autoRespond ? 'Digite e a IA responderá...' : 'Digite sua mensagem...'
                      }
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleClientMessage();
                        }
                      }}
                      className="flex-1"
                      disabled={sending || aiLoading}
                    />
                    {autoRespond ? (
                      <Button
                        onClick={handleClientMessage}
                        disabled={!messageInput.trim() || aiLoading}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        {aiLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleGenerateAIResponse()}
                          disabled={!messageInput.trim() || aiLoading}
                          title="Gerar resposta com IA"
                        >
                          {aiLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-amber-500" />
                          )}
                        </Button>
                        <Button
                          onClick={handleClientMessage}
                          disabled={!messageInput.trim() || sending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gray-50/50">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50">
                <MessageSquare className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Selecione uma conversa</h3>
              <p className="mb-6 text-gray-500">Escolha uma conversa da lista ou inicie uma nova</p>
              <Button
                onClick={() => setNewDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Conversa
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNewSubmit(handleCreateConversation)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do cliente *</Label>
              <Input
                id="name"
                placeholder="Nome completo"
                {...registerNew('name', { required: 'Nome é obrigatório' })}
              />
              {errorsNew.name && <p className="text-sm text-red-500">{errorsNew.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                {...registerNew('email')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-9999" {...registerNew('phone')} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setNewDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Iniciar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
