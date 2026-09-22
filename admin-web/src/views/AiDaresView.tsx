import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Trash2, 
  PlusCircle, 
  Search, 
  RefreshCw, 
  Download, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { exportToCsv } from '../lib/csvExport';

interface AiDare {
  id: string;
  user_id: string;
  text: string;
  type?: string;
  vibe?: string;
  intensity?: number;
  source?: string;
  rating?: number; // -1 = downvote, 0 = neutral, 1 = upvote
  created_at: string;
}

export const AiDaresView: React.FC = () => {
  const [dares, setDares] = useState<AiDare[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'upvoted' | 'downvoted' | 'unrated'>('all');
  const [vibeFilter, setVibeFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadDares = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_dares')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setDares(data || []);
    } catch (e: any) {
      console.error('Error loading AI dares:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDares();
  }, []);

  const totalDares = dares.length;
  const upvotes = dares.filter((d) => d.rating === 1).length;
  const downvotes = dares.filter((d) => d.rating === -1).length;
  const ratedCount = upvotes + downvotes;
  const satisfactionRate = ratedCount > 0 ? Math.round((upvotes / ratedCount) * 100) : 100;

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this AI dare?')) return;
    try {
      const { error } = await supabase.from('ai_dares').delete().eq('id', id);
      if (error) throw error;
      setDares((prev) => prev.filter((d) => d.id !== id));
      showNotice('Dare deleted successfully.');
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const handlePromoteToDeck = async (dare: AiDare) => {
    try {
      const { error } = await supabase.from('cards').insert({
        text: dare.text,
        type: dare.type || dare.vibe || 'romantic',
        intensity: dare.intensity || 1,
      });

      if (error) throw error;
      showNotice('🎉 Dare successfully added to the official deck!');
    } catch (e: any) {
      alert(`Failed to add to deck: ${e.message}`);
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredDares = dares.filter((dare) => {
    if (ratingFilter === 'upvoted' && dare.rating !== 1) return false;
    if (ratingFilter === 'downvoted' && dare.rating !== -1) return false;
    if (ratingFilter === 'unrated' && (dare.rating === 1 || dare.rating === -1)) return false;

    if (vibeFilter !== 'all') {
      const vibe = (dare.vibe || dare.type || '').toLowerCase();
      if (!vibe.includes(vibeFilter)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        dare.text.toLowerCase().includes(q) ||
        (dare.vibe && dare.vibe.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const handleExport = () => {
    exportToCsv(
      'rumbala_ai_dares',
      filteredDares.map((d) => ({
        id: d.id,
        user_id: d.user_id,
        text: d.text,
        type: d.type || '',
        vibe: d.vibe || '',
        intensity: d.intensity || 1,
        rating: d.rating === 1 ? 'UPVOTE' : d.rating === -1 ? 'DOWNVOTE' : 'NONE',
        created_at: d.created_at,
      }))
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-orange-400" />
            <span>AI Dares Moderation</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor real-time Groq AI dare generations, review couple ratings, and promote top dares.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
          <Button variant="default" size="sm" onClick={loadDares} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#121624] border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Generated</span>
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{totalDares}</div>
            <p className="text-xs text-slate-500 mt-1">Live Groq LLM generations</p>
          </CardContent>
        </Card>

        <Card className="bg-[#121624] border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Satisfaction Rate</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                {satisfactionRate}%
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2">{satisfactionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">Based on {ratedCount} couple ratings</p>
          </CardContent>
        </Card>

        <Card className="bg-[#121624] border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upvotes 👍</span>
              <ThumbsUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{upvotes}</div>
            <p className="text-xs text-slate-500 mt-1">Loved by couples</p>
          </CardContent>
        </Card>

        <Card className="bg-[#121624] border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Downvotes 👎</span>
              <ThumbsDown className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{downvotes}</div>
            <p className="text-xs text-slate-500 mt-1">Disliked or skipped</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters & Search ── */}
      <Card className="bg-[#121624] border-white/10">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                placeholder="Search generated dare text or vibe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                {(['all', 'upvoted', 'downvoted', 'unrated'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatingFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                      ratingFilter === r
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'all' ? 'All Ratings' : r === 'upvoted' ? '👍 Loved' : r === 'downvoted' ? '👎 Disliked' : 'Unrated'}
                  </button>
                ))}
              </div>

              <select
                value={vibeFilter}
                onChange={(e) => setVibeFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-slate-300 focus:outline-none focus:border-primary"
              >
                <option value="all">All Vibes</option>
                <option value="romantic">💖 Romantic</option>
                <option value="spicy">🌶️ Spicy</option>
                <option value="fun">🎈 Fun</option>
                <option value="ldr">✈️ LDR</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Dares Table / List ── */}
      <Card className="bg-[#121624] border-white/10 overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated AI Prompts</CardTitle>
              <CardDescription>Showing {filteredDares.length} prompts</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading AI dares...</div>
          ) : filteredDares.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              No AI dares match your filter criteria.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredDares.map((dare) => (
                <div key={dare.id} className="p-5 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-black tracking-wider text-orange-400 border-orange-500/30">
                        {dare.vibe || dare.type || 'ROMANTIC'}
                      </Badge>

                      {dare.rating === 1 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <ThumbsUp className="w-3 h-3" /> Loved (+1)
                        </span>
                      )}
                      {dare.rating === -1 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <ThumbsDown className="w-3 h-3" /> Disliked (-1)
                        </span>
                      )}
                      {(!dare.rating || dare.rating === 0) && (
                        <span className="text-[11px] text-slate-500">Unrated</span>
                      )}

                      <span className="text-[11px] text-slate-500">
                        {new Date(dare.created_at).toLocaleDateString()} {new Date(dare.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                      "{dare.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePromoteToDeck(dare)}
                      className="gap-1.5 text-xs text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add to Deck</span>
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(dare.id)}
                      className="text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
