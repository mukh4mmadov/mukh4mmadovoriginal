"use client";

import { useState, useEffect } from 'react';
import { X, User, BookOpen, MessageSquare, Bot, Activity, Calendar, Clock, Target, TrendingUp } from 'lucide-react';
import { usersRepository } from '@/lib/supabase/repositories/users.repository';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';

export default function UserDetails({ userId, onClose, returnFocusRef }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const modalRef = useModalAccessibility(true, onClose, null, returnFocusRef);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await usersRepository.getUserDetails(userId);
      setUserData(data);
    } catch (err) {
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="user-details-title" tabIndex={-1} className="flex min-h-48 w-full max-w-4xl items-center justify-center rounded-2xl border border-white/10 bg-surface p-8">
        <h2 id="user-details-title" className="sr-only">User Details</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="user-details-title" tabIndex={-1} className="w-full max-w-4xl rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <h2 id="user-details-title" className="sr-only">User Details</h2>
        <div role="alert">
          <p className="text-red-300">Could not load this user’s details. Please try again.</p>
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={loadUserData} className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">Try again</button>
            <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="user-details-title" tabIndex={-1} className="w-full max-w-4xl rounded-2xl border border-white/10 bg-surface p-8 text-center text-slate-400">
        <h2 id="user-details-title" className="sr-only">User Details</h2>
        <p>User not found</p>
        <button onClick={onClose} className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300">Close</button>
      </div>
    );
  }

  const { profile, stats, aiSummary } = userData;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'progress', label: 'Reading Progress', icon: BookOpen },
    { id: 'ai-chat', label: 'AI Chat History', icon: Bot },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'support', label: 'Support Messages', icon: Activity },
  ];

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="user-details-title" tabIndex={-1} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4 sm:p-6">
        <h2 id="user-details-title" className="text-xl font-bold text-white">User Details</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
        <div className="w-full shrink-0 border-b border-white/10 p-3 md:w-64 md:border-b-0 md:border-r md:p-4">
          <div className="mb-3 flex min-w-0 items-center gap-3 md:mb-6 md:block">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/20 md:mb-3 md:h-16 md:w-16">
              <User size={32} className="text-brand-400" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-white">{profile?.full_name || 'Unknown'}</h3>
              <p className="break-all text-xs text-slate-400 md:text-sm">{profile?.email}</p>
            {profile?.username && (
                <p className="text-xs text-slate-500">@{profile.username}</p>
            )}
            </div>
          </div>

          <nav aria-label="User detail sections" className="flex gap-1 overflow-x-auto md:block md:space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-auto shrink-0 items-center gap-2 rounded-lg px-3 py-2 transition-colors md:w-full md:gap-3 ${
                    activeTab === tab.id
                      ? 'bg-brand-500/10 text-brand-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Full Name</p>
                    <p className="text-white">{profile?.full_name || 'Not set'}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Username</p>
                    <p className="text-white">{profile?.username || 'Not set'}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Email</p>
                    <p className="text-white">{profile?.email}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Country</p>
                    <p className="text-white">{profile?.country || 'Not set'}</p>
                  </div>
                </div>
              </div>

              {stats && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <BookOpen className="text-brand-400 mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{stats.passages_completed || 0}</p>
                      <p className="text-xs text-slate-400">Passages Completed</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <Target className="text-green-400 mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">
                        {stats.average_score ? `${Math.round(stats.average_score)}%` : 'N/A'}
                      </p>
                      <p className="text-xs text-slate-400">Average Score</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <TrendingUp className="text-orange-400 mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">
                        {stats.highest_score ? `${Math.round(stats.highest_score)}%` : 'N/A'}
                      </p>
                      <p className="text-xs text-slate-400">Highest Score</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <Clock className="text-purple-400 mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">
                        {stats.total_time_spent ? `${Math.round(stats.total_time_spent / 60)}m` : '0m'}
                      </p>
                      <p className="text-xs text-slate-400">Time Spent</p>
                    </div>
                  </div>
                </div>
              )}

              {aiSummary && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">AI Usage</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <Bot className="text-blue-400 mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{aiSummary.total_ai_messages || 0}</p>
                      <p className="text-xs text-slate-400">Total AI Messages</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <BookOpen className="text-brand-400 mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{aiSummary.passages_with_ai_help || 0}</p>
                      <p className="text-xs text-slate-400">Passages with AI Help</p>
                    </div>
                  </div>
                  {aiSummary.last_ai_interaction && (
                    <div className="mt-4 bg-white/5 rounded-lg p-4">
                      <Calendar className="text-slate-400 mb-2" size={16} />
                      <p className="text-sm text-slate-400">
                        Last AI Interaction: {new Date(aiSummary.last_ai_interaction).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {stats?.last_activity && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-slate-400">
                    Last Activity: {new Date(stats.last_activity).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <UserProgress userId={userId} />
          )}

          {activeTab === 'ai-chat' && (
            <UserAIChatHistory userId={userId} />
          )}

          {activeTab === 'feedback' && (
            <UserFeedbackHistory userId={userId} />
          )}

          {activeTab === 'support' && (
            <UserSupportMessages userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}

function UserProgress({ userId }) {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await usersRepository.getUserReadingProgress(userId);
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading...</div>;
  }

  if (error) {
    return <div role="alert" className="py-8 text-center text-slate-300"><p>Reading progress could not be loaded.</p><button onClick={loadProgress} className="mt-3 rounded-lg border border-white/10 px-4 py-2 text-sm">Try again</button></div>;
  }

  if (progress.length === 0) {
    return <div className="text-center text-slate-400 py-8">No reading progress yet</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Reading Progress</h3>
      {progress.map((item) => (
        <div key={item.id} className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-white">{item.slug}</span>
            <span className={`text-sm ${item.completed ? 'text-green-400' : 'text-slate-400'}`}>
              {item.completed ? 'Completed' : 'In Progress'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Score</p>
              <p className="text-white">{item.best_score ? `${Math.round(item.best_score)}%` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400">Time</p>
              <p className="text-white">{Math.round(item.total_time / 60)}m</p>
            </div>
            <div>
              <p className="text-slate-400">Last Updated</p>
              <p className="text-white">{new Date(item.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserAIChatHistory({ userId }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadChatHistory();
  }, [userId]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await usersRepository.getUserAIChatHistory(userId);
      setChatHistory(data);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading...</div>;
  }

  if (error) {
    return <div role="alert" className="py-8 text-center text-slate-300"><p>AI chat history could not be loaded.</p><button onClick={loadChatHistory} className="mt-3 rounded-lg border border-white/10 px-4 py-2 text-sm">Try again</button></div>;
  }

  if (chatHistory.length === 0) {
    return <div className="text-center text-slate-400 py-8">No AI chat history yet</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">AI Chat History</h3>
      {chatHistory.map((chat) => (
        <div key={chat.id} className={`bg-white/5 rounded-lg p-4 ${chat.role === 'assistant' ? 'border-l-4 border-brand-500' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${chat.role === 'assistant' ? 'text-brand-400' : 'text-slate-400'}`}>
              {chat.role === 'assistant' ? 'AI' : 'User'}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(chat.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-white mb-2">{chat.message}</p>
          <div className="flex gap-2 text-xs text-slate-400">
            <span>{chat.passage_slug}</span>
            {chat.personality && <span>• {chat.personality}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function UserFeedbackHistory({ userId }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [userId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await usersRepository.getUserFeedbackHistory(userId);
      setFeedback(data);
    } catch (error) {
      console.error('Error loading feedback:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading...</div>;
  }

  if (error) {
    return <div role="alert" className="py-8 text-center text-slate-300"><p>Feedback history could not be loaded.</p><button onClick={loadFeedback} className="mt-3 rounded-lg border border-white/10 px-4 py-2 text-sm">Try again</button></div>;
  }

  if (feedback.length === 0) {
    return <div className="text-center text-slate-400 py-8">No feedback history yet</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Feedback History</h3>
      {feedback.map((item) => (
        <div key={item.id} className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-brand-400">{item.message_type}</span>
            <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</span>
          </div>
          <p className="text-sm text-white font-medium mb-1">{item.subject}</p>
          <p className="text-sm text-slate-400">{item.message}</p>
          {item.status && (
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-white/10 text-slate-300">
              {item.status}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function UserSupportMessages({ userId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await usersRepository.getUserSupportMessages(userId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading support messages:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading...</div>;
  }

  if (error) {
    return <div role="alert" className="py-8 text-center text-slate-300"><p>Support messages could not be loaded.</p><button onClick={loadMessages} className="mt-3 rounded-lg border border-white/10 px-4 py-2 text-sm">Try again</button></div>;
  }

  if (messages.length === 0) {
    return <div className="text-center text-slate-400 py-8">No support messages yet</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Support Messages</h3>
      {messages.map((msg) => (
        <div key={msg.id} className={`bg-white/5 rounded-lg p-4 ${msg.is_from_admin ? 'border-l-4 border-brand-500' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${msg.is_from_admin ? 'text-brand-400' : 'text-slate-400'}`}>
              {msg.is_from_admin ? 'Admin' : 'User'}
            </span>
            <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleString()}</span>
          </div>
          <p className="text-sm text-white">{msg.message}</p>
        </div>
      ))}
    </div>
  );
}
