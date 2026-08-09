import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Terminal,
  Activity
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata?: any;
  created_at: string;
}

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (e: any) {
      console.error('Error loading audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Security & Action Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Immutable ledger tracking all remote feature toggle updates, card modifications, and card grantings.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadAuditLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-white/[0.08]">
                <tr>
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">Admin Account</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">Target Resource</th>
                  <th className="p-4 font-semibold">Payload Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-xs font-mono text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-white text-xs">
                        {log.admin_email || 'Super Admin'}
                      </td>
                      <td className="p-4">
                        <Badge variant="neon">{log.action}</Badge>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-300">
                        {log.target_type} <span className="text-slate-500">({log.target_id || 'global'})</span>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-400 max-w-xs truncate">
                        {JSON.stringify(log.metadata || {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
