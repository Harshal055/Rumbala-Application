import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  Terminal,
  Trash2,
  User,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

interface CrashLog {
  id: string;
  user_id?: string | null;
  error_message: string;
  stack_trace?: string | null;
  component_stack?: string | null;
  is_fatal: boolean;
  source: string;
  screen?: string | null;
  platform: string;
  app_version?: string | null;
  device_info: Record<string, any>;
  status: 'new' | 'investigating' | 'resolved' | 'wont_fix';
  created_at: string;
}

export const CrashLogsView: React.FC = () => {
  const [logs, setLogs] = useState<CrashLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<CrashLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'investigating' | 'resolved'>('all');
  const [fatalFilter, setFatalFilter] = useState<'all' | 'fatal' | 'non_fatal'>('all');

  const fetchCrashLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crash_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching crash reports:', error);
        return;
      }
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrashLogs();

    // Real-time subscription for live incoming crash reports
    const channel = supabase
      .channel('admin_crash_reports_stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crash_reports' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLogs((prev) => [payload.new as CrashLog, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLogs((prev) =>
              prev.map((log) => (log.id === payload.new.id ? (payload.new as CrashLog) : log))
            );
          } else if (payload.eventType === 'DELETE') {
            setLogs((prev) => prev.filter((log) => log.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: CrashLog['status']) => {
    try {
      const { error } = await supabase
        .from('crash_reports')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
      if (selectedLog && selectedLog.id === id) {
        setSelectedLog((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const totalCrashes = logs.length;
  const fatalCrashes = logs.filter((l) => l.is_fatal).length;
  const unresolvedCrashes = logs.filter((l) => l.status === 'new' || l.status === 'investigating').length;
  const resolvedCrashes = logs.filter((l) => l.status === 'resolved').length;

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (fatalFilter === 'fatal' && !log.is_fatal) return false;
    if (fatalFilter === 'non_fatal' && log.is_fatal) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.error_message?.toLowerCase().includes(q);
      const matchScreen = log.screen?.toLowerCase().includes(q);
      const matchSrc = log.source?.toLowerCase().includes(q);
      const matchUser = log.user_id?.toLowerCase().includes(q);
      if (!matchMsg && !matchScreen && !matchSrc && !matchUser) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Bug className="w-7 h-7 text-rose-500" />
              Real-Time Crash & Error Monitoring
            </h1>
            <Badge variant="neon" className="bg-rose-500/20 text-rose-300 border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-1.5" />
              Live Stream
            </Badge>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Live telemetry stream capturing unhandled exceptions, error boundaries, and promise rejections across all devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCrashLogs}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-slate-900/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Ingested Logs</p>
              <h3 className="text-2xl font-black text-white mt-1">{totalCrashes}</h3>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-500/30 bg-rose-950/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">Fatal App Crashes</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">{fatalCrashes}</h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-950/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Needs Investigation</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{unresolvedCrashes}</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-950/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Resolved Errors</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{resolvedCrashes}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by error message, screen, user..."
              className="pl-9 bg-slate-900/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center rounded-lg bg-slate-900/80 p-1 border border-white/10 text-xs">
              {(['all', 'new', 'investigating', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-primary text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Fatal Filter */}
            <div className="flex items-center rounded-lg bg-slate-900/80 p-1 border border-white/10 text-xs">
              <button
                onClick={() => setFatalFilter('all')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  fatalFilter === 'all' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Severities
              </button>
              <button
                onClick={() => setFatalFilter('fatal')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  fatalFilter === 'fatal' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                Fatal Only
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Stream Table */}
      <Card>
        <CardHeader className="border-b border-white/[0.08] pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live Telemetry Feed ({filteredLogs.length} Events)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
              <p className="font-bold text-white text-base">No Crash Logs Found</p>
              <p className="text-xs text-slate-400 mt-1">Your mobile apps are running smoothly with 0 matching errors.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-white/[0.08]">
                  <tr>
                    <th className="p-3.5 font-semibold">Severity & Source</th>
                    <th className="p-3.5 font-semibold">Error Message</th>
                    <th className="p-3.5 font-semibold">Screen / Origin</th>
                    <th className="p-3.5 font-semibold">App Version & OS</th>
                    <th className="p-3.5 font-semibold">Timestamp</th>
                    <th className="p-3.5 font-semibold">Status</th>
                    <th className="p-3.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredLogs.map((log) => {
                    const dateStr = new Date(log.created_at).toLocaleString();
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        {/* Severity & Source */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.is_fatal ? 'destructive' : 'warning'}>
                              {log.is_fatal ? 'FATAL' : 'NON-FATAL'}
                            </Badge>
                            <span className="text-[11px] font-mono text-slate-400">
                              {log.source || 'global'}
                            </span>
                          </div>
                        </td>

                        {/* Error Message */}
                        <td className="p-3.5 max-w-md">
                          <p className="font-semibold text-white truncate text-xs font-mono">
                            {log.error_message}
                          </p>
                        </td>

                        {/* Screen */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-mono">
                            {log.screen || 'Background / Root'}
                          </span>
                        </td>

                        {/* App Version & Platform */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="text-xs">
                            <span className="text-orange-400 font-bold font-mono">
                              v{log.app_version || '1.0.5'}
                            </span>
                            <span className="text-slate-400 ml-1.5 font-mono">
                              ({log.platform})
                            </span>
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="p-3.5 whitespace-nowrap text-xs text-slate-400 font-mono">
                          {dateStr}
                        </td>

                        {/* Status Dropdown */}
                        <td className="p-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={log.status}
                            onChange={(e) => handleUpdateStatus(log.id, e.target.value as any)}
                            className="bg-slate-900 text-xs font-semibold rounded-lg px-2.5 py-1 border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="new">🔴 New</option>
                            <option value="investigating">🟡 Investigating</option>
                            <option value="resolved">🟢 Resolved</option>
                            <option value="wont_fix">⚪ Won't Fix</option>
                          </select>
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="h-8 text-xs font-semibold"
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expandable Stack Trace & Telemetry Modal */}
      {selectedLog && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121624] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${selectedLog.is_fatal ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <Bug className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Error Details & Diagnostics</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedLog.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedLog.status === 'resolved' ? 'outline' : 'gradient'}
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedLog.id, selectedLog.status === 'resolved' ? 'new' : 'resolved')}
                    className="text-xs"
                  >
                    {selectedLog.status === 'resolved' ? 'Reopen Bug' : 'Mark Resolved'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)} className="h-8 w-8 p-0 text-slate-400">
                    ✕
                  </Button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5 text-sm">
                {/* Error Summary Banner */}
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">Error Message</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyText(selectedLog.error_message, 'msg')}
                      className="h-6 px-2 text-xs text-slate-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === 'msg' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <p className="font-mono text-xs text-rose-200 break-words leading-relaxed font-bold">
                    {selectedLog.error_message}
                  </p>
                </div>

                {/* Device & Environment Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Platform</p>
                    <p className="text-xs font-mono font-bold text-white mt-1 capitalize">{selectedLog.platform}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">App Version</p>
                    <p className="text-xs font-mono font-bold text-orange-400 mt-1">{selectedLog.app_version || '1.0.5'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Screen</p>
                    <p className="text-xs font-mono font-bold text-white mt-1">{selectedLog.screen || 'Root'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">User ID</p>
                    <p className="text-xs font-mono font-bold text-slate-300 mt-1 truncate">{selectedLog.user_id || 'Anonymous'}</p>
                  </div>
                </div>

                {/* JavaScript Stack Trace */}
                {selectedLog.stack_trace && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Stack Trace</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyText(selectedLog.stack_trace || '', 'stack')}
                        className="h-6 px-2 text-xs text-slate-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === 'stack' ? 'Copied!' : 'Copy Stack'}
                      </Button>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-[#090C15] border border-white/10 text-slate-300 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed">
                      {selectedLog.stack_trace}
                    </pre>
                  </div>
                )}

                {/* Component Stack */}
                {selectedLog.component_stack && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">React Component Stack</span>
                    <pre className="p-3.5 rounded-xl bg-[#090C15] border border-white/10 text-purple-300 text-xs font-mono overflow-x-auto max-h-40 leading-relaxed">
                      {selectedLog.component_stack}
                    </pre>
                  </div>
                )}

                {/* Device Info JSON */}
                {selectedLog.device_info && Object.keys(selectedLog.device_info).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Device Hardware Telemetry</span>
                    <pre className="p-3.5 rounded-xl bg-[#090C15] border border-white/10 text-emerald-300 text-xs font-mono overflow-x-auto max-h-40 leading-relaxed">
                      {JSON.stringify(selectedLog.device_info, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
