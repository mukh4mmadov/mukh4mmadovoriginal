"use client";

import { useEffect, useState } from 'react';
import { Calendar, Tag, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ChangelogPage() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError(error.message);
      // Load demo data as fallback
      setEntries(getDemoChangelog());
    } finally {
      setIsLoading(false);
    }
  }

  function getDemoChangelog() {
    return [
      {
        id: 1,
        version: '1.0.0',
        title: 'Initial Release',
        description: 'First stable release of IELTS Reading Practice platform',
        published_at: '2024-09-15',
        features: [
          '33 IELTS reading passages with full test functionality',
          'Real-time timer with pause/resume/reset controls',
          'Text highlighting with eraser mode',
          'Instant band score calculation and analytics',
          'User authentication and progress tracking',
          'Responsive design for desktop and mobile',
          'Daily study missions and streak tracking',
          'Contact form and issue reporting'
        ],
        fixes: [
          'Fixed React key duplication in paragraph rendering',
          'Fixed roadmap data loading with demo fallback',
          'Improved error handling across all pages'
        ],
        breaking_changes: []
      },
      {
        id: 2,
        version: '0.9.0',
        title: 'Beta Release',
        description: 'Public beta testing phase',
        published_at: '2024-08-20',
        features: [
          'Core reading test functionality',
          'Basic highlighting features',
          'Timer and scoring system',
          'Passage catalogue with filters'
        ],
        fixes: [
          'Fixed navigation issues',
          'Improved mobile responsiveness'
        ],
        breaking_changes: [
          'Changed API endpoint structure',
          'Updated authentication flow'
        ]
      }
    ];
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Changelog</h1>
          <p className="text-slate-400 text-lg">
            Track the latest updates, features, and improvements
          </p>
        </div>

        {error && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center mb-8">
            <p className="text-yellow-400 mb-2">⚠️ Database connection error</p>
            <p className="text-slate-400 text-sm">Showing demo data instead</p>
          </div>
        )}

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Changelog</h1>
          <p className="text-slate-400 text-lg">
            Track the latest updates, features, and improvements
          </p>
        </div>

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
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-sm font-mono">
                          v{entry.version}
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(entry.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <h3 className="text-2xl font-semibold text-white">{entry.title}</h3>
                    </div>

                    {entry.description && (
                      <p className="text-slate-300 mb-6">{entry.description}</p>
                    )}

                    {entry.features.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                          <Tag size={16} />
                          Features
                        </h4>
                        <ul className="space-y-2">
                          {entry.features.map((feature, index) => (
                            <li key={index} className="text-slate-300 flex items-start gap-2">
                              <span className="text-green-400 mt-1">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.fixes.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                          <Tag size={16} />
                          Fixes
                        </h4>
                        <ul className="space-y-2">
                          {entry.fixes.map((fix, index) => (
                            <li key={index} className="text-slate-300 flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.breaking_changes.length > 0 && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                          <AlertCircle size={16} />
                          Breaking Changes
                        </h4>
                        <ul className="space-y-2">
                          {entry.breaking_changes.map((change, index) => (
                            <li key={index} className="text-slate-300 flex items-start gap-2">
                              <span className="text-red-400 mt-1">•</span>
                              <span>{change}</span>
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

        {entries.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No changelog entries yet.
          </div>
        )}
      </div>
    </div>
  );
}
