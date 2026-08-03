"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Lightbulb, MessageSquare, CheckCircle, Clock, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Issue {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  message_type: 'bug' | 'feature' | 'incorrect_answer' | 'general';
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export default function IssueTracker() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'bugs' | 'features' | 'general'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all');

  useEffect(() => {
    loadIssues();
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, activeTab, statusFilter]);

  async function loadIssues() {
    try {
      const { data, error } = await supabase
        .from('feedback_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterIssues() {
    let filtered = issues;

    if (activeTab === 'bugs') {
      filtered = filtered.filter((i) => i.message_type === 'bug');
    } else if (activeTab === 'features') {
      filtered = filtered.filter((i) => i.message_type === 'feature');
    } else if (activeTab === 'general') {
      filtered = filtered.filter((i) => i.message_type === 'general' || i.message_type === 'incorrect_answer');
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    setFilteredIssues(filtered);
  }

  async function updateStatus(id: string, status: 'new' | 'read' | 'replied') {
    try {
      const { error } = await supabase
        .from('feedback_messages')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await loadIssues();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  const tabs = [
    { id: 'all' as const, label: 'All Issues', icon: MessageSquare },
    { id: 'bugs' as const, label: 'Bugs', icon: AlertTriangle },
    { id: 'features' as const, label: 'Features', icon: Lightbulb },
    { id: 'general' as const, label: 'General', icon: MessageSquare },
  ];

  const statusConfig = {
    new: { label: 'New', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    read: { label: 'Read', icon: CheckCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    replied: { label: 'Replied', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Issue Tracker</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {issues.filter((i) => {
                  if (tab.id === 'all') return true;
                  if (tab.id === 'bugs') return i.message_type === 'bug';
                  if (tab.id === 'features') return i.message_type === 'feature';
                  return i.message_type === 'general' || i.message_type === 'incorrect_answer';
                }).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'new', 'read', 'replied'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              statusFilter === status
                ? 'bg-brand-500 text-white'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {status === 'all' ? 'All Status' : statusConfig[status].label}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.map((issue) => {
          const status = statusConfig[issue.status as keyof typeof statusConfig] || statusConfig.new;
          const StatusIcon = status.icon;
          return (
            <div
              key={issue.id}
              className="border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color} ${status.border}`}>
                      <div className="flex items-center gap-1">
                        <StatusIcon size={12} />
                        {status.label}
                      </div>
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{issue.subject}</h3>
                  <p className="text-slate-400 text-sm mb-3">{issue.message}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{issue.name}</span>
                    <span>•</span>
                    <span>{issue.email}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['new', 'read', 'replied'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(issue.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        issue.status === s
                          ? 'bg-brand-500 text-white'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {filteredIssues.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No issues found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
