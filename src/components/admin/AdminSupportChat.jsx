"use client";

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Users, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supportRepository } from '@/lib/supabase/repositories/support.repository';
import { notificationsRepository } from '@/lib/supabase/repositories/notifications.repository';
import { supabase } from '@/lib/supabase/client';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';

export default function AdminSupportChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendError, setSendError] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);
  const modalRef = useModalAccessibility(isOpen, () => setIsOpen(false), searchRef);

  useEffect(() => {
    if (user?.id) {
      loadChatList();
      subscribeToAllMessages();
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatList = async () => {
    try {
      const allMessages = await supportRepository.getAllSupportChats();
      const groupedByUser = allMessages.reduce((acc, msg) => {
        if (!acc[msg.user_id]) {
          acc[msg.user_id] = {
            userId: msg.user_id,
            userName: msg.profiles?.full_name || msg.profiles?.email || 'Unknown',
            lastMessage: msg.message,
            lastTime: msg.created_at,
            unreadCount: 0,
          };
        }
        if (msg.is_from_admin === false && !msg.is_read) {
          acc[msg.user_id].unreadCount += 1;
        }
        return acc;
      }, {});

      setChatList(Object.values(groupedByUser));
    } catch (error) {
      console.error('Error loading chat list:', error);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const data = await supportRepository.getSupportMessages(userId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToAllMessages = () => {
    subscriptionRef.current = supabase
      .channel('admin-support-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            await loadChatList();
            if (selectedUserId === payload.new.user_id) {
              await loadMessages(selectedUserId);
            }
          }
        }
      )
      .subscribe();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !selectedUserId) return;

    const message = inputValue.trim();
    setIsLoading(true);
    setSendError("");

    try {
      await supportRepository.sendSupportMessage(selectedUserId, message, true, user.id);
      setInputValue("");
      try {
        await notificationsRepository.createNotification(
          selectedUserId,
          'support_reply',
          'New support reply',
          'You have a new message from the support team',
          '/support'
        );
      } catch (error) {
        console.error('Reply sent, but notification creation failed:', error);
        setSendError("Reply sent. The notification could not be created, but the message is saved in the conversation.");
      }
      await loadMessages(selectedUserId);
      await loadChatList();
    } catch (error) {
      console.error('Error sending message:', error);
      setSendError("The reply was not sent. Your draft is still in the box so you can retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
  };

  const filteredChatList = chatList.filter((chat) =>
    chat.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-20 z-40 bg-brand-500 hover:bg-brand-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Open admin support chat"
        title="Admin Support Chat"
      >
        <MessageSquare size={24} />
        {chatList.some((chat) => chat.unreadCount > 0) && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {chatList.reduce((sum, chat) => sum + chat.unreadCount, 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="admin-support-title" tabIndex={-1} className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-surface shadow-2xl md:inset-x-auto md:bottom-24 md:right-6 md:h-[min(600px,calc(100dvh-8rem))] md:w-[min(600px,calc(100vw-3rem))] md:rounded-2xl md:border md:border-white/10">
          <div className="flex shrink-0 items-center justify-between p-4 border-b border-white/10">
            <div>
              <h3 id="admin-support-title" className="font-semibold text-white flex items-center gap-2">
                <Users size={20} />
                Support Messages
              </h3>
              <p className="mt-1 text-xs text-slate-400">Response target: within one business day</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-[35%] shrink-0 border-r border-white/10 flex flex-col md:w-64">
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredChatList.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  filteredChatList.map((chat) => (
                    <button
                      key={chat.userId}
                      onClick={() => handleSelectUser(chat.userId)}
                      className={`w-full p-3 text-left border-b border-white/10 hover:bg-white/5 transition-colors ${
                        selectedUserId === chat.userId ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm truncate">
                          {chat.userName}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {chat.lastMessage}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(chat.lastTime).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {!selectedUserId ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              msg.is_from_admin
                                ? 'bg-brand-500 text-white'
                                : 'bg-white/10 text-slate-200'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                    {sendError && <p role="alert" className="mb-2 text-xs text-amber-200">{sendError}</p>}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); setSendError(""); }}
                        placeholder="Type your reply..."
                        aria-label="Type your support reply"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
