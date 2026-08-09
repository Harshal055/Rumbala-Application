import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Heart, 
  Video, 
  RefreshCw, 
  Users, 
  Clock, 
  AlertCircle,
  XCircle,
  CheckCircle2,
  Radio
} from 'lucide-react';

interface RoomItem {
  id?: string;
  code: string;
  host_name?: string;
  guest_name?: string;
  is_active: boolean;
  game_state?: any;
  created_at?: string;
  updated_at?: string;
}

export const LdrRoomsView: React.FC = () => {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingCode, setActionLoadingCode] = useState<string | null>(null);

  const loadRooms = async () => {
    setLoading(true);
    try {
      // Check both 'rooms' and 'ldr_rooms'
      const { data: rData } = await supabase
        .from('rooms')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      setRooms(rData || []);
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleForceClose = async (code: string) => {
    if (!window.confirm(`Are you sure you want to force-close room ${code}?`)) return;
    setActionLoadingCode(code);
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('code', code);

      if (error) throw error;
      setRooms((prev) => prev.map((r) => (r.code === code ? { ...r, is_active: false } : r)));
    } catch (err: any) {
      alert(`Failed to close room: ${err.message}`);
    } finally {
      setActionLoadingCode(null);
    }
  };

  const activeRooms = rooms.filter((r) => r.is_active);
  const endedRooms = rooms.filter((r) => !r.is_active);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-400" />
            LDR Rooms & Live Sessions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor active couple video dates, Agora channels, and game sync status.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadRooms} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Sessions
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card className="bg-gradient-to-br from-rose-950/40 via-[#121622] to-[#0E121D] border-rose-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Radio className="w-6 h-6 text-rose-400 animate-pulse" />
              </div>
              <Badge variant="default" className="bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold text-xs">
                Live Now
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase font-bold tracking-wider text-rose-400/80">Active LDR Rooms</p>
              <h3 className="text-3xl font-black text-white mt-1">{activeRooms.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Couples currently connected on video</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121622] border-white/[0.08]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <Badge variant="default" className="font-bold text-xs">Total Tracked</Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Recent Sessions</p>
              <h3 className="text-3xl font-black text-white mt-1">{rooms.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Total recorded room instances</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-400 animate-pulse" /> Active Video Call Sessions
          </CardTitle>
          <CardDescription>Couples with live open rooms</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-white/[0.08]">
                <tr>
                  <th className="p-4 font-semibold">Room Code</th>
                  <th className="p-4 font-semibold">Host & Partner</th>
                  <th className="p-4 font-semibold">Last Active</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Loading active rooms...
                    </td>
                  </tr>
                ) : activeRooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No active video rooms right now.
                    </td>
                  </tr>
                ) : (
                  activeRooms.map((r) => (
                    <tr key={r.code} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-black text-primary text-base tracking-wider">
                          {r.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                          <span>{r.host_name || 'Host'} & {r.guest_name || 'Guest'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {r.updated_at ? new Date(r.updated_at).toLocaleTimeString() : '—'}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoadingCode === r.code}
                          onClick={() => handleForceClose(r.code)}
                          className="text-xs h-8"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Force End
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
    </div>
  );
};
