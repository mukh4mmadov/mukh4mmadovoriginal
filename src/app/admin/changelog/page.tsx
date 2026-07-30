"use client";

import { useEffect, useState } from 'react';
import { Calendar, Plus, Edit, Trash2, Tag, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  features: string[];
  fixes: string[];
  breaking_changes: string[];
  published_at: string;
}

export default function AdminChangelog() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null);
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    description: '',
    features: '',
    fixes: '',
    breaking_changes: '',
  });

  useEffect(() => {
    loadChangelog();
  }, []);

  async function loadChangelog() {
    try {
      const { data, error } = await supabase
        .from('changelog')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading changelog:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const entry = {
      version: formData.version,
      title: formData.title,
      description: formData.description,
      features: formData.features.split('\n').filter(f => f.trim()),
      fixes: formData.fixes.split('\n').filter(f => f.trim()),
      breaking_changes: formData.breaking_changes.split('\n').filter(f => f.trim()),
    };

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('changelog')
          .update(entry)
          .eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('changelog').insert(entry);
        if (error) throw error;
      }

      setIsFormOpen(false);
      setEditingEntry(null);
      setFormData({
        version: '',
        title: '',
        description: '',
        features: '',
        fixes: '',
        breaking_changes: '',
      });
      await loadChangelog();
    } catch (error) {
      console.error('Error saving changelog:', error);
      alert(`Failed to save changelog entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Are you sure you want to delete this changelog entry?')) return;

    try {
      const { error } = await supabase.from('changelog').delete().eq('id', id);
      if (error) throw error;
      await loadChangelog();
    } catch (error) {
      console.error('Error deleting changelog:', error);
      alert(`Failed to delete changelog entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function openForm(entry?: ChangelogEntry) {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        version: entry.version,
        title: entry.title,
        description: entry.description,
        features: entry.features.join('\n'),
        fixes: entry.fixes.join('\n'),
        breaking_changes: entry.breaking_changes.join('\n'),
      });
    } else {
      setEditingEntry(null);
      setFormData({
        version: '',
        title: '',
        description: '',
        features: '',
        fixes: '',
        breaking_changes: '',
      });
    }
    setIsFormOpen(true);
  }

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
        <h1 className="text-3xl font-bold text-white">Changelog</h1>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Entry
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {entries.map((entry) => (
          <div key={entry.id} className="relative">
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-brand-500 border-4 border-surface" />
                <div className="w-0.5 flex-1 bg-white/10 mt-2" />
              </div>
              <div className="flex-1 pb-8">
                <div className="border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-sm font-mono">
                          v{entry.version}
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(entry.published_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white">{entry.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openForm(entry)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit size={16} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  {entry.description && (
                    <p className="text-slate-300 mb-4">{entry.description}</p>
                  )}

                  {entry.features.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                        <Tag size={14} />
                        Features
                      </h4>
                      <ul className="space-y-1">
                        {entry.features.map((feature, index) => (
                          <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.fixes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                        <Tag size={14} />
                        Fixes
                      </h4>
                      <ul className="space-y-1">
                        {entry.fixes.map((fix, index) => (
                          <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            {fix}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.breaking_changes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                        <AlertCircle size={14} />
                        Breaking Changes
                      </h4>
                      <ul className="space-y-1">
                        {entry.breaking_changes.map((change, index) => (
                          <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-red-400 mt-1">•</span>
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingEntry ? 'Edit Entry' : 'New Changelog Entry'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Version (e.g., 1.0.0)
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="1.0.0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Major Release"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Brief description of this release"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Features (one per line)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="• Added new feature&#10;• Improved performance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fixes (one per line)
                </label>
                <textarea
                  value={formData.fixes}
                  onChange={(e) => setFormData({ ...formData, fixes: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="• Fixed bug in authentication&#10;• Resolved display issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Breaking Changes (one per line)
                </label>
                <textarea
                  value={formData.breaking_changes}
                  onChange={(e) => setFormData({ ...formData, breaking_changes: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="• Removed deprecated API&#10;• Changed default behavior"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  {editingEntry ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
