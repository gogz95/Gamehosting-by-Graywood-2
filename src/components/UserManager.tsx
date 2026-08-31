import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, KeyRound, Server, Trash2, CheckCircle2, AlertCircle, RefreshCw, X, ShieldAlert, Sparkles } from 'lucide-react';
import { SafeUser, UserRole, DeployedServer } from '../types';

interface UserManagerProps {
  currentUser: SafeUser | null;
  servers: DeployedServer[];
}

export const UserManager: React.FC<UserManagerProps> = ({ currentUser, servers }) => {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('SERVER_OWNER');
  const [assignedServerIds, setAssignedServerIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const token = localStorage.getItem('gh_token');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreateLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          password,
          email,
          role,
          assignedServerIds
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setShowCreateModal(false);
      setUsername('');
      setPassword('');
      setEmail('');
      setRole('SERVER_OWNER');
      setAssignedServerIds([]);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, uname: string) => {
    if (!window.confirm(`Are you sure you want to delete user '${uname}'?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  const toggleServerAssignment = (srvId: string) => {
    if (assignedServerIds.includes(srvId)) {
      setAssignedServerIds(assignedServerIds.filter((id) => id !== srvId));
    } else {
      setAssignedServerIds([...assignedServerIds, srvId]);
    }
  };

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Administrator</span>
          </span>
        );
      case 'SERVER_OWNER':
        return (
          <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center space-x-1">
            <Server className="w-3 h-3" />
            <span>Server Owner</span>
          </span>
        );
      case 'MODERATOR':
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Moderator</span>
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Viewer</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">Cluster Role-Based Access Control</h2>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-md uppercase font-mono">
                RBAC v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl mt-1">
              Manage operators, grant server ownership, assign moderator console privileges, and enforce granular cluster boundaries.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-3 bg-[#161922] hover:bg-white/5 border border-white/5 text-slate-300 rounded-2xl transition cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.35)] transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const isMe = currentUser?.id === user.id;
          const assignedCount = user.assignedServerIds?.length || 0;

          return (
            <div
              key={user.id}
              className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 hover:border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-5 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-white text-base">{user.username}</h4>
                      {isMe && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-md">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{user.email || 'No email registered'}</span>
                  </div>
                  {getRoleBadge(user.role)}
                </div>

                <div className="p-3 bg-[#161922] border border-white/5 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Assigned Permissions:</span>
                    <span className="font-bold text-slate-200">
                      {user.role === 'ADMIN' ? 'All Servers (Cluster-Wide)' : `${assignedCount} Instance(s)`}
                    </span>
                  </div>
                  {user.role !== 'ADMIN' && assignedCount > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {user.assignedServerIds.map((sid) => {
                        const srv = servers.find((s) => s.id === sid);
                        return (
                          <span key={sid} className="px-2 py-0.5 bg-white/5 text-slate-300 rounded text-[10px] font-mono truncate max-w-[140px]">
                            {srv?.name || sid}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>Created {new Date(user.createdAt).toLocaleDateString()}</span>
                {user.id !== 'usr-admin-master' && !isMe && (
                  <button
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0D1017] border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Provision New Operator</h3>
                  <p className="text-xs text-slate-400">Add an operator with tailored cluster roles & permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jake_moderator"
                    className="w-full bg-[#161922] border border-white/5 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#161922] border border-white/5 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jake@community.gg"
                  className="w-full bg-[#161922] border border-white/5 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Role & Permissions Tier</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-[#161922] border border-white/5 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                >
                  <option value="SERVER_OWNER">Server Owner (Manage Assigned Servers)</option>
                  <option value="MODERATOR">Moderator (Console Commands & Players Only)</option>
                  <option value="VIEWER">Viewer (Read-Only Status & Telemetry)</option>
                  <option value="ADMIN">Administrator (Full Cluster Root Privileges)</option>
                </select>
              </div>

              {role !== 'ADMIN' && (
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Assigned Server Instances ({assignedServerIds.length} selected)
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 bg-[#161922] p-2.5 rounded-2xl border border-white/5">
                    {servers.length === 0 ? (
                      <p className="text-xs text-slate-500 p-2 text-center">No active servers deployed yet.</p>
                    ) : (
                      servers.map((srv) => {
                        const isChecked = assignedServerIds.includes(srv.id);
                        return (
                          <div
                            key={srv.id}
                            onClick={() => toggleServerAssignment(srv.id)}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                              isChecked ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <span className="font-bold truncate">{srv.name} ({srv.gameName})</span>
                            <span className="font-mono text-[10px] text-slate-500">{srv.fullDomain}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.35)] transition cursor-pointer flex items-center justify-center space-x-2 mt-2"
              >
                <span>{createLoading ? 'Provisioning...' : 'Confirm & Create User'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
