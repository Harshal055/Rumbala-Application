import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { 
  Users, 
  Search, 
  Gift, 
  Crown, 
  RefreshCw, 
  CheckCircle2,
  Zap,
  Heart,
  UserX,
  Clock,
  Edit3
} from 'lucide-react';

interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  partner1?: string;
  partner2?: string;
  card_count?: number;
  is_pro?: boolean;
  pro_expires_at?: string | null;
  streak_count?: number;
  vibe?: string;
  created_at?: string;
  updated_at?: string;
}

export function checkProStatus(isPro?: boolean, expiresAt?: string | null) {
  if (!isPro) return { isActive: false, isExpired: false, label: 'Free Tier', badgeCls: 'bg-slate-800 text-slate-400 border-slate-700' };
  if (!expiresAt) return { isActive: true, isExpired: false, label: '👑 PRO LIFETIME', badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  
  const exp = new Date(expiresAt).getTime();
  if (isNaN(exp)) return { isActive: true, isExpired: false, label: '👑 PRO LIFETIME', badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  
  const now = Date.now();
  if (exp <= now) {
    return {
      isActive: false,
      isExpired: true,
      label: `❌ EXPIRED (${new Date(expiresAt).toLocaleDateString()})`,
      badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    };
  }

  const diffMs = exp - now;
  const days = Math.floor(diffMs / 86400000);
  const hrs = Math.floor((diffMs % 86400000) / 3600000);
  const tag = days >= 1 ? `${days}d ${hrs}h` : `${hrs}h`;

  return {
    isActive: true,
    isExpired: false,
    label: `⚡ PRO (${tag} left)`,
    badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  };
}

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [cardCountInput, setCardCountInput] = useState<number>(0);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (e: any) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Broadcast helper to instantly update the mobile app live
  const broadcastUserUpdate = async (userId: string, updatedFields: Partial<UserProfile>) => {
    try {
      const userChannel = supabase.channel(`profile-${userId}`);
      await userChannel.send({
        type: 'broadcast',
        event: 'user_updated',
        payload: updatedFields,
      });

      const updatesChannel = supabase.channel(`user-updates:${userId}`);
      await updatesChannel.send({
        type: 'broadcast',
        event: 'profile_updated',
        payload: updatedFields,
      });
    } catch (broadcastErr) {
      console.warn('[User Realtime Broadcast Error]:', broadcastErr);
    }
  };

  const openManageModal = (u: UserProfile) => {
    setSelectedUser(u);
    setCardCountInput(u.card_count ?? 0);
    setActionSuccessMsg(null);
    setManageModalOpen(true);
  };

  // Grant Timed Pro or Lifetime Pro
  const handleGrantProDuration = async (days: number | null) => {
    if (!selectedUser) return;
    setSubmitting(true);
    setActionSuccessMsg(null);

    try {
      const expiresAt = days ? new Date(Date.now() + days * 86400000).toISOString() : null;
      
      let updatePayload: any = {
        is_pro: true,
        pro_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      };

      let { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', selectedUser.id);

      if (error && error.message?.includes('pro_expires_at')) {
        delete updatePayload.pro_expires_at;
        const fb = await supabase.from('profiles').update(updatePayload).eq('id', selectedUser.id);
        error = fb.error;
      }

      if (error) throw error;

      await broadcastUserUpdate(selectedUser.id, { is_pro: true, pro_expires_at: expiresAt });

      const updatedUser: UserProfile = {
        ...selectedUser,
        is_pro: true,
        pro_expires_at: expiresAt
      };
      setSelectedUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));

      setActionSuccessMsg(days ? `Granted ${days} day(s) Pro Access!` : 'Granted Lifetime Pro Access!');
    } catch (err: any) {
      alert(`Failed to grant Pro: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Revoke Pro Access
  const handleRevokePro = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    setActionSuccessMsg(null);

    try {
      let updatePayload: any = {
        is_pro: false,
        pro_expires_at: null,
        updated_at: new Date().toISOString()
      };

      let { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', selectedUser.id);

      if (error && error.message?.includes('pro_expires_at')) {
        delete updatePayload.pro_expires_at;
        const fb = await supabase.from('profiles').update(updatePayload).eq('id', selectedUser.id);
        error = fb.error;
      }

      if (error) throw error;

      await broadcastUserUpdate(selectedUser.id, { is_pro: false, pro_expires_at: null });

      const updatedUser: UserProfile = {
        ...selectedUser,
        is_pro: false,
        pro_expires_at: null
      };
      setSelectedUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));

      setActionSuccessMsg('Pro Access has been revoked.');
    } catch (err: any) {
      alert(`Failed to revoke Pro: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Save Card Balance
  const handleSaveCardBalance = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    setActionSuccessMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          card_count: cardCountInput,
          last_card_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      await broadcastUserUpdate(selectedUser.id, { card_count: cardCountInput });

      const updatedUser: UserProfile = { ...selectedUser, card_count: cardCountInput };
      setSelectedUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));

      setActionSuccessMsg(`Card balance updated to ${cardCountInput}!`);
    } catch (err: any) {
      alert(`Failed to update cards: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.display_name && u.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.partner1 && u.partner1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.partner2 && u.partner2.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.id.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            User Directory & Pro Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage player accounts, grant timed/lifetime Pro access, and manage card credits in real-time.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh List
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by email, partner names, or UUID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-white/[0.08]">
                <tr>
                  <th className="p-4 font-semibold">User & Partners</th>
                  <th className="p-4 font-semibold">Account ID</th>
                  <th className="p-4 font-semibold">Plan Status</th>
                  <th className="p-4 font-semibold">Card Balance</th>
                  <th className="p-4 font-semibold">Joined Date</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading users from Supabase...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const proInfo = checkProStatus(u.is_pro, u.pro_expires_at);
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.partner1 && u.partner2 ? (
                              <>
                                <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/20" />
                                <span>{u.partner1} & {u.partner2}</span>
                              </>
                            ) : (
                              u.display_name || 'Couple User'
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {u.email || 'Anonymous Account'}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-400 max-w-[130px] truncate" title={u.id}>
                          {u.id}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${proInfo.badgeCls}`}>
                            {proInfo.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="default" className="font-bold">
                            <Zap className="w-3 h-3 mr-1 text-primary fill-primary" />
                            {u.card_count ?? 0} Cards
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="gradient"
                            size="sm"
                            onClick={() => openManageModal(u)}
                            className="text-xs h-8 flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Manage User
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Manage User Modal */}
      <Dialog
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        title="Manage User & Pro Access"
        description="Grant auto-expiring Pro duration, edit cards balance, and push live changes."
      >
        {selectedUser && (() => {
          const proInfo = checkProStatus(selectedUser.is_pro, selectedUser.pro_expires_at);
          return (
            <div className="space-y-5">
              {/* User Info Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono font-bold text-white">{selectedUser.email || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">UUID:</span>
                  <span className="font-mono text-slate-400 truncate max-w-[200px]" title={selectedUser.id}>{selectedUser.id}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-white/[0.06]">
                  <span className="text-slate-400">Current Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] border ${proInfo.badgeCls}`}>
                    {proInfo.label}
                  </span>
                </div>
              </div>

              {actionSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {actionSuccessMsg}
                </div>
              )}

              {/* Pro Duration Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" /> Grant Pro Duration (Auto-Expires)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleGrantProDuration(1)}
                    className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-xs font-bold transition-colors"
                  >
                    ⚡ 1 Day
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleGrantProDuration(7)}
                    className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-xs font-bold transition-colors"
                  >
                    📅 7 Days
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleGrantProDuration(30)}
                    className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-xs font-bold transition-colors"
                  >
                    🗓️ 30 Days
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleGrantProDuration(90)}
                    className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-xs font-bold transition-colors"
                  >
                    🚀 90 Days
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleGrantProDuration(365)}
                    className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-xs font-bold transition-colors"
                  >
                    👑 1 Year
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleGrantProDuration(null)}
                    className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-colors"
                  >
                    ♾️ Lifetime
                  </button>
                </div>

                {proInfo.isActive && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleRevokePro}
                    className="w-full mt-2 p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" /> Revoke Pro Access Immediately
                  </button>
                )}
              </div>

              {/* Card Balance Editor */}
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-primary" /> Card Balance
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={cardCountInput}
                    onChange={(e) => setCardCountInput(parseInt(e.target.value) || 0)}
                    className="h-10 text-sm font-bold"
                  />
                  <Button
                    variant="gradient"
                    size="sm"
                    disabled={submitting}
                    onClick={handleSaveCardBalance}
                    className="h-10 px-4 whitespace-nowrap text-xs font-bold"
                  >
                    Save Cards
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/[0.08]">
                <Button variant="ghost" onClick={() => setManageModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Dialog>
    </div>
  );
};
