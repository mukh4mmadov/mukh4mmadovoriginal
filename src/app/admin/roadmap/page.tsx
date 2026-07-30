"use client";

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Clock, Circle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'planned';
  category: 'feature' | 'improvement' | 'bug_fix';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  target_date: string | null;
  created_at: string;
}

type RoadmapStatus = 'completed' | 'in_progress' | 'planned';
type RoadmapCategory = 'feature' | 'improvement' | 'bug_fix';
type RoadmapPriority = 'low' | 'medium' | 'high';

function isRoadmapStatus(value: string): value is RoadmapStatus {
  return value === 'completed' || value === 'in_progress' || value === 'planned';
}

function isRoadmapCategory(value: string): value is RoadmapCategory {
  return value === 'feature' || value === 'improvement' || value === 'bug_fix';
}

function isRoadmapPriority(value: string): value is RoadmapPriority {
  return value === 'low' || value === 'medium' || value === 'high';
}

export default function AdminRoadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'planned' as RoadmapStatus,
    category: 'feature' as RoadmapCategory,
    priority: 'medium' as RoadmapPriority,
    progress: 0,
    target_date: '',
  });

  useEffect(() => {
    loadRoadmap();
  }, []);

  async function loadRoadmap() {
    try {
      const { data, error } = await supabase
        .from('roadmap')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading roadmap:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const entry = {
      ...formData,
      target_date: formData.target_date || null,
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('roadmap')
          .update(entry)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('roadmap').insert(entry);
        if (error) throw error;
      }

      setIsFormOpen(false);
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        status: 'planned',
        category: 'feature',
        priority: 'medium',
        progress: 0,
        target_date: '',
      });
      await loadRoadmap();
    } catch (error) {
      console.error('Error saving roadmap item:', error);
      alert(`Failed to save roadmap item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this roadmap item?')) return;

    try {
      const { error } = await supabase.from('roadmap').delete().eq('id', id);
      if (error) throw error;
      await loadRoadmap();
    } catch (error) {
      console.error('Error deleting roadmap item:', error);
      alert(`Failed to delete roadmap item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function openForm(item?: RoadmapItem) {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description,
        status: item.status,
        category: item.category,
        priority: item.priority,
        progress: item.progress,
        target_date: item.target_date || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        status: 'planned',
        category: 'feature',
        priority: 'medium',
        progress: 0,
        target_date: '',
      });
    }
    setIsFormOpen(true);
  }

  const statusConfig = {
    completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    in_progress: { label: 'In Progress', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    planned: { label: 'Planned', icon: Circle, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  };

  const priorityConfig = {
    low: { label: 'Low', color: 'text-slate-400' },
    medium: { label: 'Medium', color: 'text-yellow-400' },
    high: { label: 'High', color: 'text-red-400' },
  };

  const categoryConfig = {
    feature: { label: 'Feature', color: 'text-brand-400' },
    improvement: { label: 'Improvement', color: 'text-green-400' },
    bug_fix: { label: 'Bug Fix', color: 'text-red-400' },
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
        <h1 className="text-3xl font-bold text-white">Roadmap</h1>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {(['completed', 'in_progress', 'planned'] as const).map((status) => {
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          const sectionItems = items.filter((i) => i.status === status);

          return (
            <div key={status}>
              <div className="flex items-center gap-3 mb-4">
                <StatusIcon className={config.color} size={24} />
                <h2 className="text-2xl font-bold text-white">{config.label}</h2>
                <span className="text-slate-400">({sectionItems.length})</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sectionItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig[item.category].color}`}>
                        {categoryConfig[item.category].label}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openForm(item)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit size={14} className="text-slate-400" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{item.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Progress</span>
                        <span className={priorityConfig[item.priority].color}>
                          {priorityConfig[item.priority].label} Priority
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 transition-all duration-500"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{item.progress}%</span>
                        {item.target_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(item.target_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {sectionItems.length === 0 && (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-slate-400">
                  No items in this section
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit Item' : 'New Roadmap Item'}
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
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Feature name"
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
                  placeholder="Describe this item"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, status: isRoadmapStatus(value) ? value : 'planned' });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, category: isRoadmapCategory(value) ? value : 'feature' });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="feature">Feature</option>
                    <option value="improvement">Improvement</option>
                    <option value="bug_fix">Bug Fix</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, priority: isRoadmapPriority(value) ? value : 'medium' });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Progress: {formData.progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  className="w-full"
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
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
