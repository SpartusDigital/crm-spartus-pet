'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare, User } from 'lucide-react';
import api from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

export default function WhatsappPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const { data: conversations = [] } = useQuery({
    queryKey: ['wa-conversations'],
    queryFn: () => api.get('/whatsapp/conversations'),
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['wa-messages', selectedId],
    queryFn: () => api.get(`/whatsapp/conversations/${selectedId}/messages`),
    enabled: !!selectedId,
    refetchInterval: 3000,
  });

  const replyMutation = useMutation({
    mutationFn: (msg: string) =>
      api.post(`/whatsapp/conversations/${selectedId}/reply`, { message: msg }),
    onSuccess: () => {
      setMessage('');
      qc.invalidateQueries({ queryKey: ['wa-messages', selectedId] });
      qc.invalidateQueries({ queryKey: ['wa-conversations'] });
    },
  });

  const selected = conversations.find((c: any) => c.id === selectedId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    replyMutation.mutate(message);
  };

  return (
    <div className="h-[calc(100vh-160px)] flex gap-0 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      {/* Conversations list */}
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">WhatsApp</h2>
          <p className="text-xs text-gray-400">{conversations.length} conversas</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="p-8 text-center">
              <MessageSquare size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Nenhuma conversa</p>
            </div>
          )}
          {conversations.map((conv: any) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 border-b border-gray-50 text-left transition-colors ${
                selectedId === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User size={18} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conv.customer?.name ?? conv.contactName ?? conv.contactPhone}
                  </p>
                  {conv.lastMessageAt && (
                    <span className="text-xs text-gray-400 shrink-0 ml-1">
                      {dayjs(conv.lastMessageAt).fromNow()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {conv.messages?.[0]?.body ?? 'Sem mensagens'}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 bg-primary rounded-full text-white text-xs flex items-center justify-center shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400">Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={16} className="text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {selected.customer?.name ?? selected.contactName ?? selected.contactPhone}
                </p>
                <p className="text-xs text-gray-400">{selected.contactPhone}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.direction === 'OUT' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.direction === 'OUT'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                  }`}>
                    <p>{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.direction === 'OUT' ? 'text-white/60' : 'text-gray-400'}`}>
                      {dayjs(msg.sentAt).format('HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 input"
                placeholder="Digite sua mensagem..."
              />
              <button
                type="submit"
                disabled={!message.trim() || replyMutation.isPending}
                className="btn-primary px-4"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
