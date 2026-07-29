"use client";

import { useEffect, useState } from 'react';
import { Bell, X, MessageSquare, AlertTriangle, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type NotificationType = 'feedback' | 'bug' | 'registration';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  read: boolean;
}

function isNotificationType(value: string): value is NotificationType {
  return value === 'feedback' || value === 'bug' || value === 'registration';
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    setupRealtimeSubscription();
  }, []);

  async function loadNotifications() {
    try {
      const [feedback, bugs, registrations] = await Promise.all([
        supabase
          .from('feedback_messages')
          .select('id, message_type, subject, created_at')
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('feedback_messages')
          .select('id, message_type, subject, created_at')
          .eq('message_type', 'bug')
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('analytics_events')
          .select('id, event_type, created_at')
          .eq('event_type', 'user_registered')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const allNotifications: Notification[] = [
        ...(feedback.data || []).map((f: any): Notification => {
          const type = f.message_type === 'bug' ? 'bug' : 'feedback';
          return {
            id: f.id,
            type: isNotificationType(type) ? type : 'feedback',
            message: f.subject,
            timestamp: f.created_at,
            read: false,
          };
        }),
        ...(registrations.data || []).map((r: any): Notification => ({
          id: r.id,
          type: 'registration',
          message: 'New user registered',
          timestamp: r.created_at,
          read: false,
        })),
      ];

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  function setupRealtimeSubscription() {
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback_messages',
        },
        (payload: any) => {
          const type = payload.new.message_type === 'bug' ? 'bug' : 'feedback';
          const newNotification: Notification = {
            id: payload.new.id,
            type: isNotificationType(type) ? type : 'feedback',
            message: payload.new.subject,
            timestamp: payload.new.created_at,
            read: false,
          };
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: 'event_type=eq.user_registered',
        },
        (payload: any) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'registration',
            message: 'New user registered',
            timestamp: payload.new.created_at,
            read: false,
          };
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  const notificationConfig = {
    feedback: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    bug: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    registration: { icon: UserPlus, color: 'text-green-400', bg: 'bg-green-500/10' },
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="text-slate-400" size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-white/10 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notification) => {
                  const config = notificationConfig[notification.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-white/5 cursor-pointer transition-colors ${
                        !notification.read ? config.bg : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${config.bg}`}>
                          <Icon className={config.color} size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
