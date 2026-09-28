"use client";

import { useState, useEffect } from 'react';
import { X, User, BookOpen, MessageSquare, Bot, Activity, Calendar, Clock, Target, TrendingUp } from 'lucide-react';
import { usersRepository } from '@/lib/supabase/repositories/users.repository';

export default function UserDetails({ userId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>User not found</p>
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
    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">User Details</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex h-[calc(90vh-80px)]">
        <div className="w-64 border-r border-white/10 p-4">
          <div className="mb-6">
            <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mb-3">
              <User size={32} className="text-brand-400" />
            </div>
            <h3 className="font-semibold text-white">{profile?.full_name || 'Unknown'}</h3>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            {profile?.username && (
              <p className="text-xs text-slate-500">@{profile.username}</p>
            )}
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
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

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4">
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

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      const data = await usersRepository.getUserReadingProgress(userId);
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading...</div>;
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

  useEffect(() => {
    loadChatHistory();
  }, [userId]);

  const loadChatHistory = async () => {
    try {
      const data = await usersRepository.getUserAIChatHistory(userId);
      setChatHistory(data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading...</div>;
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

  useEffect(() => {
    loadFeedback();
  }, [userId]);

  const loadFeedback = async () => {
    try {
      const data = await usersRepository.getUserFeedbackHistory(userId);
      setFeedback(data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading...</div>;
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

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    try {
      const data = await usersRepository.getUserSupportMessages(userId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading support messages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading...</div>;
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