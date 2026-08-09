import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { 
  Gift, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Tag
} from 'lucide-react';

interface PromoCodeItem {
  code: string;
  bonus_cards: number;
  grant_pro_days: number;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export const PromoCodesView: React.FC = () => {
  const [promos, setPromos] = useState<PromoCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    bonus_cards: 25,
    grant_pro_days: 0,
    max_uses: 100,
  });

  const loadPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromos(data || []);
    } catch (e: any) {
      console.error('Error loading promo codes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const handleCreatePromo = async () => {
    if (!form.code.trim()) {
      alert('Promo code name is required');
      return;
    }

    try {
      const codeUpper = form.code.trim().toUpperCase();
      const { error } = await supabase.from('promo_codes').insert({
        code: codeUpper,
        bonus_cards: form.bonus_cards,
        grant_pro_days: form.grant_pro_days,
        max_uses: form.max_uses,
        used_count: 0,
        is_active: true,
      });

      if (error) throw error;

      setShowModal(false);
      setForm({ code: '', bonus_cards: 25, grant_pro_days: 0, max_uses: 100 });
      loadPromoCodes();
    } catch (err: any) {
      alert(`Failed to create promo code: ${err.message}`);
    }
  };

  const handleDeletePromo = async (code: string) => {
    if (!confirm(`Delete promo code "${code}"?`)) return;
    try {
      const { error } = await supabase.from('promo_codes').delete().eq('code', code);
      if (error) throw error;
      setPromos((prev) => prev.filter((p) => p.code !== code));
    } catch (err: any) {
      alert(`Error deleting code: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Gift className="w-7 h-7 text-primary" />
            Promo Codes & Gift Campaigns
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create coupon codes to grant bonus cards or unlock spicy decks for VIP users and social promotions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadPromoCodes} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Promo Code
          </Button>
        </div>
      </div>

      {/* Promos Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-white/[0.08]">
                <tr>
                  <th className="p-4 font-semibold">Promo Code</th>
                  <th className="p-4 font-semibold">Reward</th>
                  <th className="p-4 font-semibold">Usage</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Loading promo codes...
                    </td>
                  </tr>
                ) : promos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No active promo codes. Click "New Promo Code" to create one.
                    </td>
                  </tr>
                ) : (
                  promos.map((p) => (
                    <tr key={p.code} className="hover:bg-white/[0.02]">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-orange-400 text-base">
                            {p.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(p.code)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedCode === p.code ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="default">+{p.bonus_cards} Bonus Cards</Badge>
                        {p.grant_pro_days > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {p.grant_pro_days}d VIP
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-slate-300">
                        <span className="font-bold">{p.used_count || 0}</span> / {p.max_uses} used
                      </td>
                      <td className="p-4">
                        <Badge variant={p.is_active ? 'success' : 'destructive'}>
                          {p.is_active ? 'ACTIVE' : 'EXPIRED'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePromo(p.code)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* New Promo Modal */}
      <Dialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Promotional Code"
        description="Configure a new coupon code that players can enter in the mobile app."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Promo Code (e.g. LOVE2026)</label>
            <Input
              placeholder="e.g. VALENTINE50"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Bonus Cards Reward</label>
              <Input
                type="number"
                value={form.bonus_cards}
                onChange={(e) => setForm({ ...form, bonus_cards: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Max Total Redemptions</label>
              <Input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 100 })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleCreatePromo}>
              Create Code
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
