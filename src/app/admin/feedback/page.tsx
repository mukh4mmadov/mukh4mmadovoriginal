"use client";

import { useEffect, useState } from 'react';
import { Search, Filter, Check, X, Download, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface FeedbackMessage {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  message_type: 'bug' | 'feature' | 'incorrect_answer' | 'general';
  page_url: string | null;
  created_at: string;
  status: 'new' | 'read' | 'replied';
}

export default function FeedbackManagement() {
  const [feedback, setFeedback] = useState<FeedbackMessage[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'bug' | 'feature' | 'incorrect_answer' | 'general'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    loadFeedback();
  }, []);

  useEffect(() => {
    filterFeedback();
  }, [feedback, searchQuery, statusFilter, typeFilter]);

  async function loadFeedback() {
    try {
      const { data, error } = await supabase
        .from('feedback_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterFeedback() {
    let filtered = feedback;

    if (searchQuery) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((f) => f.message_type === typeFilter);
    }

    setFilteredFeedback(filtered);
  }

  async function updateStatus(id: string, status: 'new' | 'read' | 'replied') {
    try {
      const { error } = await supabase
        .from('feedback_messages')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await loadFeedback();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async function deleteFeedback(id: string) {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const { error } = await supabase
        .from('feedback_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadFeedback();
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  }

  function exportCSV() {
    const headers = ['Name', 'Email', 'Subject', 'Type', 'Status', 'Date'];
    const rows = filteredFeedback.map((f) => [
      f.name,
      f.email,
      f.subject,
      f.message_type,
      f.status,
      new Date(f.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const statusColors = {
    new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    read: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    replied: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  const typeColors = {
    bug: 'text-red-400',
    feature: 'text-orange-400',
    incorrect_answer: 'text-purple-400',
    general: 'text-blue-400',
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Feedback Management</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="incorrect_answer">Incorrect Answer</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredFeedback.map((item) => (
                <tr key={item.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-slate-300">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{item.subject}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`capitalize ${typeColors[item.message_type]}`}>
                      {item.message_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedFeedback(item)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye size={16} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, 'read')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check size={16} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, 'replied')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Mark as replied"
                      >
                        <Check size={16} className="text-green-400" />
                      </button>
                      <button
                        onClick={() => deleteFeedback(item.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFeedback.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No feedback found matching your filters.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Feedback Details</h2>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">From</label>
                <p className="text-white">{selectedFeedback.name}</p>
                <p className="text-sm text-slate-400">{selectedFeedback.email}</p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Subject</label>
                <p className="text-white">{selectedFeedback.subject}</p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Type</label>
                <p className={`capitalize ${typeColors[selectedFeedback.message_type]}`}>
                  {selectedFeedback.message_type.replace('_', ' ')}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Message</label>
                <p className="text-white whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>

              {selectedFeedback.page_url && (
                <div>
                  <label className="text-sm text-slate-400">Page URL</label>
                  <a
                    href={selectedFeedback.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:underline break-all"
                  >
                    {selectedFeedback.page_url}
                  </a>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-400">Submitted</label>
                <p className="text-white">
                  {new Date(selectedFeedback.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
