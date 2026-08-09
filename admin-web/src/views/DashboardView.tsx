import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Users, 
  Layers, 
  Flame, 
  Activity, 
  ShieldCheck, 
  Video, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Zap,
  HeartHandshake
} from 'lucide-react';

interface MetricStats {
  totalUsers: number;
  totalCards: number;
  activeRooms: number;
  totalTickets: number;
  cardsByCategory: Record<string, number>;
}

export const DashboardView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState<MetricStats>({
    totalUsers: 0,
    totalCards: 0,
    activeRooms: 0,
    totalTickets: 0,
    cardsByCategory: {},
  });
  const [activeRoomsList, setActiveRoomsList] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Total Cards
      const { count: cardCount, data: cardsData } = await supabase
        .from('cards')
        .select('type', { count: 'exact' });

      // Group cards by category
      const categories: Record<string, number> = {};
      if (cardsData) {
        cardsData.forEach((c) => {
          categories[c.type] = (categories[c.type] || 0) + 1;
        });
      }

      // 2. Active LDR Rooms
      const { data: roomsData, count: roomCount } = await supabase
        .from('ldr_rooms')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (roomsData) setActiveRoomsList(roomsData);

      // 3. User profiles count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 4. User Feedback & Bug Reports
      const { count: fbCount } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true });
      const { count: bugCount } = await supabase
        .from('bug_reports')
        .select('*', { count: 'exact', head: true });

      // 5. Recent Admin Logs
      const { data: logsData } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (logsData) setRecentLogs(logsData);

      setStats({
        totalUsers: userCount || 0,
        totalCards: cardCount || 0,
        activeRooms: roomCount || 0,
        totalTickets: (fbCount || 0) + (bugCount || 0),
        cardsByCategory: categories,
      });
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-pink-500/20 p-6 md:p-8 border border-white/10 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-orange-400 text-xs font-bold border border-primary/30 mb-3">
              <Zap className="w-3.5 h-3.5" /> Rumbala Admin Portal
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Platform Mission Control
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-1 max-w-xl">
              Real-time monitoring of couple dare sessions, remote card decks, instant Pro licensing, and live feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="gradient" onClick={() => onNavigate('cards')}>
              <Layers className="w-4 h-4 mr-2" /> Manage Cards
            </Button>
            <Button variant="outline" onClick={() => onNavigate('features')}>
              <Flame className="w-4 h-4 mr-2 text-primary" /> Feature Switches
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Dare Cards */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cards in CMS</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loading ? '...' : stats.totalCards}
              </h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Dynamic Supabase Deck
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Registered Players */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Users</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loading ? '...' : stats.totalUsers}
              </h3>
              <p className="text-xs text-primary flex items-center gap-1 mt-1">
                <Users className="w-3.5 h-3.5" /> Active Player Base
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Active Couple Rooms */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active LDR Rooms</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loading ? '...' : stats.activeRooms}
              </h3>
              <p className="text-xs text-cyan-400 flex items-center gap-1 mt-1">
                <Activity className="w-3.5 h-3.5" /> Real-time Video / PIN
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <HeartHandshake className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: User Feedback & Reviews */}
        <Card className="hover:border-primary/40 transition-all cursor-pointer" onClick={() => onNavigate('support')}>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">User Feedback & Bugs</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loading ? '...' : stats.totalTickets}
              </h3>
              <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Reviews & Ratings
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Active Rooms & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Rooms Monitor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                <CardTitle>Live Couple Sessions</CardTitle>
              </div>
              <Badge variant="outline">Realtime Agora / Supabase</Badge>
            </div>
            <CardDescription>Recently created multiplayer and long-distance couple rooms.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeRoomsList.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No active rooms right now. Users can create rooms via mobile app.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-white/[0.05]">
                    <tr>
                      <th className="p-3">Room PIN</th>
                      <th className="p-3">Host Name</th>
                      <th className="p-3">Partner Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {activeRoomsList.map((room) => (
                      <tr key={room.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono font-bold text-orange-400">{room.code}</td>
                        <td className="p-3 text-slate-200">{room.host_name || 'Anonymous Host'}</td>
                        <td className="p-3 text-slate-400">{room.guest_name || 'Waiting for partner...'}</td>
                        <td className="p-3">
                          <Badge variant={room.room_type === 'video' ? 'neon' : 'secondary'}>
                            {room.room_type || 'video'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={room.guest_user_id ? 'success' : 'warning'}>
                            {room.guest_user_id ? 'Connected' : 'Waiting'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Categories Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cards by Category</CardTitle>
            <CardDescription>Content distribution in the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(stats.cardsByCategory).length === 0 ? (
              <p className="text-slate-500 text-sm">Loading card stats...</p>
            ) : (
              Object.entries(stats.cardsByCategory).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <span className="font-semibold capitalize text-slate-200">{cat}</span>
                  <Badge variant="default">{count} cards</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
