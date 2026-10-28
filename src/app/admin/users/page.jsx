"use client";

import { useEffect, useRef, useState } from 'react';
import { Users, Search, X } from 'lucide-react';
import { usersRepository } from '@/lib/supabase/repositories/users.repository';
import { AdminPageError, AdminPageLoading } from '@/components/admin/AdminPageStatus';
import UserDetails from '@/components/admin/UserDetails';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const detailsTriggerRef = useRef(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setError('');
      const data = await usersRepository.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) => !query || [user.email, user.full_name, user.username]
    .some((value) => value?.toLowerCase().includes(query)));

  if (loading) {
    return <AdminPageLoading label="Loading users" />;
  }

  if (error) {
    return <AdminPageError message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">Users</h1>
      <p className="mb-6 max-w-3xl text-sm text-slate-400">
        Registered learners (guest profiles are excluded), most recently active first. Attempt figures use exact saved attempts; older progress without question-level records is not included.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search users by name, email, or username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or username..."
            className="min-h-11 w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <p className="shrink-0 text-sm text-slate-400" aria-live="polite">
          {query ? `${filteredUsers.length} of ${users.length} learners` : `${users.length} learners`}
        </p>
      </div>

      <div className="max-w-full overflow-x-auto rounded-xl border border-white/10 bg-white/5" role="region" aria-label="Users table" tabIndex={0}>
        <table className="w-full min-w-[793px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-sm font-medium text-slate-400">User</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Email</th>
              <th className="text-center p-4 text-sm font-medium text-slate-400">Saved Attempts</th>
              <th className="text-center p-4 text-sm font-medium text-slate-400">Accuracy</th>
              <th className="text-center p-4 text-sm font-medium text-slate-400">Last Saved Attempt</th>
              <th className="text-center p-4 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-slate-400">
                  {query ? 'No learners match your search.' : 'No registered learners yet.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.user_id || user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-brand-400" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.full_name || 'Unknown'}</p>
                        {user.username && (
                          <p className="text-xs text-slate-400">@{user.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-300">{user.email}</td>
                  <td className="p-4 text-center text-sm text-white">{user.passages_completed ?? 0}</td>
                  <td className="p-4 text-center text-sm text-white">
                    {user.average_score != null ? `${Math.round(user.average_score)}%` : 'N/A'}
                  </td>
                  <td className="p-4 text-center text-sm text-slate-400">
                    {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={(event) => { detailsTriggerRef.current = event.currentTarget; setSelectedUserId(user.user_id || user.id); }}
                      className="min-h-9 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors"
                      aria-label={`View details for ${user.full_name || user.email || 'this learner'}`}
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUserId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <UserDetails userId={selectedUserId} onClose={() => setSelectedUserId(null)} returnFocusRef={detailsTriggerRef} />
        </div>
      )}
    </div>
  );
}
