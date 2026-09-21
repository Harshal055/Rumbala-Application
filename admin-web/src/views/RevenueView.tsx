import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  CreditCard, 
  TrendingUp, 
  ShoppingBag, 
  RefreshCw, 
  Layers
} from 'lucide-react';

interface PurchaseItem {
  id?: string;
  sku: string;
  amount?: number;
  amount_paise?: number;
  currency?: string;
  user_id?: string;
  created_at: string;
}

export const RevenueView: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (err: any) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueData();
  }, []);

  const totalRevenue = purchases.reduce((sum, item) => {
    const amt = Number(item.amount ?? (item.amount_paise ? item.amount_paise / 100 : 0));
    return sum + amt;
  }, 0);

  const skuBreakdown = purchases.reduce((acc: Record<string, { count: number; revenue: number }>, p) => {
    const sku = p.sku || 'Unknown SKU';
    const amt = Number(p.amount ?? (p.amount_paise ? p.amount_paise / 100 : 0));
    if (!acc[sku]) acc[sku] = { count: 0, revenue: 0 };
    acc[sku].count += 1;
    acc[sku].revenue += amt;
    return acc;
  }, {});

  const sortedSkus = Object.entries(skuBreakdown).sort((a, b) => b[1].revenue - a[1].revenue);

  const formatMoney = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            Revenue & Transactions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time tracking of in-app dare packs, subscriptions, and store revenue.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadRevenueData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Revenue
        </Button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-gradient-to-br from-emerald-950/40 via-[#121622] to-[#0E121D] border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <Badge variant="success" className="font-bold text-xs">Live Total</Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase font-bold tracking-wider text-emerald-400/80">Total Estimated Revenue</p>
              <h3 className="text-3xl font-black text-white mt-1">{formatMoney(totalRevenue)}</h3>
              <p className="text-xs text-slate-400 mt-1">{purchases.length} total completed transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121622] border-white/[0.08]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="default" className="font-bold text-xs">Products</Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Active Dare Packs (SKUs)</p>
              <h3 className="text-3xl font-black text-white mt-1">{sortedSkus.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Unique store offerings sold</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121622] border-white/[0.08]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                <Layers className="w-6 h-6 text-purple-400" />
              </div>
              <Badge variant="default" className="font-bold text-xs">Avg Value</Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Avg Transaction Value</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {formatMoney(purchases.length ? totalRevenue / purchases.length : 0)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Per paying couple</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SKU Breakdown Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" /> Top Selling Packs (SKUs)
        </h2>
        {sortedSkus.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">No purchases recorded yet.</Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedSkus.map(([sku, data]) => (
              <Card key={sku} className="bg-white/[0.02] border-white/[0.06] hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="text-xs font-mono font-bold text-slate-300 truncate" title={sku}>{sku}</div>
                  <div className="flex items-baseline justify-between mt-3">
                    <span className="text-xl font-black text-primary">{data.count} sales</span>
                    <span className="text-xs font-bold text-emerald-400">{formatMoney(data.revenue)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Recent In-App Transactions</CardTitle>
          <CardDescription>Verified purchase records recorded via RevenueCat & Play Store</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-white/[0.08]">
                <tr>
                  <th className="p-4 font-semibold">SKU / Item</th>
                  <th className="p-4 font-semibold">Buyer User ID</th>
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      Loading transaction records...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No transaction records found.
                    </td>
                  </tr>
                ) : (
                  purchases.slice(0, 50).map((p, idx) => {
                    const amt = Number(p.amount ?? (p.amount_paise ? p.amount_paise / 100 : 0));
                    return (
                      <tr key={p.id || idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white font-mono text-xs">{p.sku || '—'}</div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-400 max-w-[150px] truncate" title={p.user_id || ''}>
                          {p.user_id || 'Guest Buyer'}
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-400">
                          +{formatMoney(amt)}
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
    </div>
  );
};
