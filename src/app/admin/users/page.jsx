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

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <AdminPageLoading label="Loading users" />;
  }

  if (error) {
    return <AdminPageError message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <span className="text-sm text-slate-400">
          Total: {users.length} · Active (with attempts): {filteredUsers.length}
        </span>
      </div>
      <p className="-mt-6 mb-6 text-sm text-slate-400">
        These figures use exact saved attempts. Older progress without question-level attempt records is not included.
        Showing {filteredUsers.length} active {filteredUsers.length === 1 ? 'record' : 'records'}.
      </p>

      <div className="mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or username..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
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
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-brand-400" />
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
                      onClick={(event) => { detailsTriggerRef.current = event.currentTarget; setSelectedUserId(user.id); }}
                      className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors"
                    >
                      View Details
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
