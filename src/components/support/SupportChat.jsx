"use client";

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supportRepository } from '@/lib/supabase/repositories/support.repository';
import { notificationsRepository } from '@/lib/supabase/repositories/notifications.repository';
import { supabase } from '@/lib/supabase/client';

export default function SupportChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      loadMessages();
      loadUnreadCount();
      subscribeToMessages();
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      markMessagesAsRead();
    }
  }, [isOpen, isMinimized]);

  const loadMessages = async () => {
    try {
      const data = await supportRepository.getSupportMessages(user.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await supportRepository.getUnreadMessageCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const subscribeToMessages = () => {
    subscriptionRef.current = supportRepository.subscribeToSupportMessages(
      user.id,
      async (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          setMessages((prev) => [...prev, newMessage]);
          
          if (newMessage.is_from_admin && !isOpen) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      }
    );
  };

  const markMessagesAsRead = async () => {
    try {
      await supportRepository.markMessagesAsRead(user.id);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      await supportRepository.sendSupportMessage(user.id, message, false);
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={handleToggleOpen}
        className="fixed bottom-24 right-6 z-40 bg-brand-500 hover:bg-brand-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Open support chat"
        title="Support Chat"
      >
        <MessageSquare size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 w-96 bg-surface border border-white/10 rounded-2xl shadow-2xl transition-all ${
          isMinimized ? 'h-14' : 'h-[500px]'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Support Chat</h3>
            <div className="flex gap-2">
              <button
                onClick={handleToggleMinimize}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button
                onClick={handleToggleOpen}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="h-[380px] overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Start a conversation with our support team</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_from_admin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.is_from_admin
                            ? 'bg-white/10 text-slate-200'
                            : 'bg-brand-500 text-white'
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
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
      )}
    </>
  );
}