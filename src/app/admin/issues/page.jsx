"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Lightbulb, MessageSquare, CheckCircle, Clock, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { AdminPageError, AdminPageLoading } from '@/components/admin/AdminPageStatus';

export default function IssueTracker() {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workflowDrafts, setWorkflowDrafts] = useState({});
  const [saveError, setSaveError] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadIssues();
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, activeTab, statusFilter]);

  async function loadIssues() {
    try {
      setLoadError('');
      const { data, error } = await supabase
        .from('feedback_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error loading issues:', error);
      setLoadError(error.message || 'Issues could not be loaded.');
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

  async function updateStatus(id, status) {
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

  function updateDraft(issue, field, value) {
    setWorkflowDrafts((current) => ({
      ...current,
      [issue.id]: {
        severity: issue.severity || 'medium',
        assigned_to: issue.assigned_to || '',
        public_response: issue.public_response || '',
        ...current[issue.id],
        [field]: value,
      },
    }));
  }

  async function saveWorkflow(issue) {
    const draft = workflowDrafts[issue.id] || {
      severity: issue.severity || 'medium',
      assigned_to: issue.assigned_to || '',
      public_response: issue.public_response || '',
    };
    setSavingId(issue.id);
    setSaveError('');
    try {
      const { error } = await supabase
        .from('feedback_messages')
        .update({
          severity: draft.severity,
          assigned_to: draft.assigned_to.trim() || null,
          public_response: draft.public_response.trim() || null,
          status: draft.public_response.trim() ? 'replied' : issue.status,
        })
        .eq('id', issue.id);
      if (error) throw error;
      setWorkflowDrafts((current) => {
        const next = { ...current };
        delete next[issue.id];
        return next;
      });
      await loadIssues();
    } catch (error) {
      setSaveError(error.message || 'Could not save the feedback updates.');
    } finally {
      setSavingId(null);
    }
  }

  const tabs = [
    { id: 'all', label: 'All Issues', icon: MessageSquare },
    { id: 'bugs', label: 'Bugs', icon: AlertTriangle },
    { id: 'features', label: 'Features', icon: Lightbulb },
    { id: 'general', label: 'General', icon: MessageSquare },
  ];

  const statusConfig = {
    new: { label: 'New', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    read: { label: 'Read', icon: CheckCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    replied: { label: 'Replied', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  };

  if (isLoading) {
    return <AdminPageLoading label="Loading issues" />;
  }

  if (loadError) {
    return <AdminPageError message={loadError} onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Issue Tracker</h1>

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

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'new', 'read', 'replied']).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
              statusFilter === status
                ? 'bg-brand-500 text-white'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {status === 'all' ? 'All Status' : statusConfig[status].label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {saveError && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{saveError}</p>}
        {filteredIssues.map((issue) => {
          const status = statusConfig[issue.status] || statusConfig.new;
          const StatusIcon = status.icon;
          const draft = workflowDrafts[issue.id] || {
            severity: issue.severity || 'medium',
            assigned_to: issue.assigned_to || '',
            public_response: issue.public_response || '',
          };
          return (
            <div
              key={issue.id}
              className="border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
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
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 break-words">{issue.subject}</h3>
                  <p className="text-slate-400 text-sm mb-3 break-words">{issue.message}</p>
                  {issue.reproduction_steps && <p className="text-sm text-slate-300 mb-2 break-words"><span className="text-slate-500">Reproduction:</span> {issue.reproduction_steps}</p>}
                  {(issue.expected_behavior || issue.actual_behavior) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 text-sm">
                      {issue.expected_behavior && <p className="text-slate-300 break-words"><span className="text-slate-500">Expected:</span> {issue.expected_behavior}</p>}
                      {issue.actual_behavior && <p className="text-slate-300 break-words"><span className="text-slate-500">Actual:</span> {issue.actual_behavior}</p>}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-500">
                    <span className="break-all">{issue.name}</span>
                    <span>•</span>
                    <span className="break-all">{issue.email}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'read', 'replied']).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(issue.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
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
              <div className="mt-5 border-t border-white/10 pt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Severity
                  <select value={draft.severity} onChange={(event) => updateDraft(issue, 'severity', event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-slate-200">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </label>
                <label className="text-sm text-slate-300">
                  Assigned to
                  <input value={draft.assigned_to} onChange={(event) => updateDraft(issue, 'assigned_to', event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200" placeholder="Owner name or email" />
                </label>
                <label className="text-sm text-slate-300 md:col-span-2">
                  Reply visible to the submitter
                  <textarea value={draft.public_response} onChange={(event) => updateDraft(issue, 'public_response', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200" placeholder="Write a short update or response…" />
                </label>
                <button type="button" onClick={() => saveWorkflow(issue)} disabled={savingId === issue.id} className="justify-self-start rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {savingId === issue.id ? 'Saving…' : 'Save feedback updates'}
                </button>
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
