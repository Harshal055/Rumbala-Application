import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Star, 
  MessageSquare, 
  Bug, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Trash2, 
  Search, 
  TrendingUp, 
  Heart, 
  Smartphone, 
  AlertCircle, 
  Filter,
  User
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  user_id?: string;
  user_email?: string;
  message: string;
  rating: number;
  created_at: string;
}

interface BugReportItem {
  id: string;
  user_id?: string;
  user_email?: string;
  message: string;
  device_info?: any;
  status: string;
  created_at: string;
}

export const SupportView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'bugs'>('feedback');
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [bugReports, setBugReports] = useState<BugReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Feedback
      const { data: fbData, error: fbErr } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fbErr && fbData) {
        setFeedbacks(fbData);
      }

      // 2. Fetch Bug Reports
      const { data: bugData, error: bugErr } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!bugErr && bugData) {
        setBugReports(bugData);
      }
    } catch (e: any) {
      console.error('Error loading feedback & bugs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Realtime Live Listeners for new incoming feedback and bugs
    const channel = supabase
      .channel('public_feedback_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, (payload) => {
        setFeedbacks((prev) => [payload.new as FeedbackItem, ...prev]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bug_reports' }, (payload) => {
        setBugReports((prev) => [payload.new as BugReportItem, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const { error } = await supabase.from('feedback').delete().eq('id', id);
      if (error) throw error;
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(`Error deleting feedback: ${err.message}`);
    }
  };

  const handleUpdateBugStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bug_reports')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setBugReports((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err: any) {
      alert(`Error updating bug status: ${err.message}`);
    }
  };

  const handleDeleteBug = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bug report?')) return;
    try {
      const { error } = await supabase.from('bug_reports').delete().eq('id', id);
      if (error) throw error;
      setBugReports((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(`Error deleting bug report: ${err.message}`);
    }
  };

  // Metrics
  const totalFeedbackCount = feedbacks.length;
  const avgRating = totalFeedbackCount > 0
    ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / totalFeedbackCount).toFixed(1)
    : '5.0';
  const fiveStarCount = feedbacks.filter((f) => f.rating === 5).length;
  const openBugsCount = bugReports.filter((b) => b.status === 'open' || !b.status).length;

  // Filters
  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch =
      (f.user_email && f.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.message && f.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      f.id.includes(searchTerm);
    const matchesRating = ratingFilter === 'all' || f.rating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  const filteredBugs = bugReports.filter((b) => {
    return (
      (b.user_email && b.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.message && b.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      b.id.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-primary" />
            User Feedback & Bug Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Read live customer reviews, star ratings, and bug reports submitted directly from the mobile app.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#121624]/90 border-white/[0.08]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Rating</p>
              <h3 className="text-2xl font-black text-white mt-1 flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                {avgRating} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121624]/90 border-white/[0.08]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Feedbacks</p>
              <h3 className="text-2xl font-black text-white mt-1">{totalFeedbackCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121624]/90 border-white/[0.08]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">5-Star Reviews</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-2">
                {fiveStarCount}
                <span className="text-xs font-normal text-slate-400">
                  ({totalFeedbackCount > 0 ? Math.round((fiveStarCount / totalFeedbackCount) * 100) : 0}%)
                </span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121624]/90 border-white/[0.08]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Bug Reports</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">{openBugsCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Bug className="w-6 h-6 text-rose-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-white/[0.06] w-fit">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'feedback'
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            User Feedback ({feedbacks.length})
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bugs'
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            Bug Reports ({bugReports.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Rating filter for feedback */}
          {activeTab === 'feedback' && (
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/[0.06]">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Filter:</span>
              {(['all', 5, 4, 3, 2, 1] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRatingFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    ratingFilter === r
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r === 'all' ? 'All' : `${r}★`}
                </button>
              ))}
            </div>
          )}

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by text, user email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* FEEDBACK TAB CONTENT */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading user feedbacks...</div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-white/[0.06]">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="font-semibold text-white">No user feedback found</p>
              <p className="text-xs text-slate-400 mt-1">When users submit reviews from the mobile app settings screen, they will appear here in real-time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeedbacks.map((f) => (
                <Card key={f.id} className="bg-[#121624]/90 border-white/[0.08] hover:border-primary/30 transition-all">
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div>
                      {/* Top bar: Stars + User Email */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (f.rating || 5)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-black text-amber-300 ml-1.5">
                            {f.rating || 5}.0
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {f.message?.includes('[ACCOUNT DELETION') && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                              🚨 Deletion Request
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            {f.created_at ? new Date(f.created_at).toLocaleString() : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Feedback Message */}
                      <p className="text-sm text-slate-200 mt-3 whitespace-pre-line leading-relaxed font-medium bg-black/20 p-3.5 rounded-xl border border-white/[0.04]">
                        "{f.message || 'No written message provided.'}"
                      </p>
                    </div>

                    {/* Footer: User Details + Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] truncate max-w-[240px]">
                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{f.user_email || f.user_id || 'Anonymous App User'}</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFeedback(f.id)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 px-2 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BUG REPORTS TAB CONTENT */}
      {activeTab === 'bugs' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-white/[0.08]">
                  <tr>
                    <th className="p-4 font-semibold">Bug Description</th>
                    <th className="p-4 font-semibold">User / Reporter</th>
                    <th className="p-4 font-semibold">Device Diagnostics</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Reported At</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Loading bug reports...</td>
                    </tr>
                  ) : filteredBugs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No bug reports found.</td>
                    </tr>
                  ) : (
                    filteredBugs.map((b) => (
                      <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 max-w-xs">
                          <div className="font-bold text-white leading-snug">{b.message}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs text-slate-300 font-mono">{b.user_email || 'Anonymous'}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">{b.user_id}</div>
                        </td>
                        <td className="p-4">
                          {b.device_info ? (
                            <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                              <div>Platform: <span className="text-slate-200">{b.device_info.platform || 'mobile'}</span></div>
                              {b.device_info.vibe && <div>Vibe: <span className="text-primary">{b.device_info.vibe}</span></div>}
                              {b.device_info.width && <div>Screen: <span className="text-slate-200">{Math.round(b.device_info.width)}px</span></div>}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={b.status === 'resolved' ? 'success' : 'destructive'}
                            className="capitalize font-bold"
                          >
                            {b.status || 'open'}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {b.status !== 'resolved' ? (
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={() => handleUpdateBugStatus(b.id, 'resolved')}
                              className="h-7 px-2.5 text-xs font-bold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateBugStatus(b.id, 'open')}
                              className="h-7 px-2.5 text-xs"
                            >
                              Reopen
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBug(b.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 px-2 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

