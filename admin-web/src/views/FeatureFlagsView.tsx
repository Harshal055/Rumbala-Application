import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Switch } from '../components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { 
  Sliders, 
  Video, 
  Flame, 
  ShoppingBag, 
  DoorOpen, 
  ShieldAlert, 
  Gift, 
  Sparkles, 
  AlertTriangle, 
  Smartphone, 
  RefreshCw, 
  Plus, 
  Save, 
  CheckCircle2,
  Trash2,
  Lock
} from 'lucide-react';

interface FeatureFlagState {
  video_calls: boolean;
  spicy_category: boolean;
  shop_enabled: boolean;
  room_creation: boolean;
  promo_codes: boolean;
  ai_moderation: boolean;
  daily_rewards: boolean;
  secret_cards: boolean;
}

interface MaintenanceState {
  enabled: boolean;
  message: string;
}

interface MinVersionState {
  android: number;
  ios: number;
  enforce: boolean;
  title?: string;
  message?: string;
}

interface LatestVersionState {
  android: number;
  ios: number;
  title: string;
  message: string;
  whats_new: string;
}

interface CustomConfig {
  key: string;
  value: string;
  description: string;
}

export const FeatureFlagsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Standard Feature Flags
  const [flags, setFlags] = useState<FeatureFlagState>({
    video_calls: true,
    spicy_category: true,
    shop_enabled: true,
    room_creation: true,
    promo_codes: true,
    ai_moderation: true,
    daily_rewards: true,
    secret_cards: true,
  });

  // Maintenance Mode
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    enabled: false,
    message: "We're currently performing a quick server upgrade to enhance your connection. Rumbala will be back online in a few minutes!",
  });

  // Version Enforcer (Minimum Required Version)
  const [minVersion, setMinVersion] = useState<MinVersionState>({
    android: 6,
    ios: 6,
    enforce: false,
    title: 'Update Required',
    message: 'Please update Rumbala to the latest version to continue playing.',
  });

  // Recommended / Latest Version
  const [latestVersion, setLatestVersion] = useState<LatestVersionState>({
    android: 7,
    ios: 7,
    title: 'New Update Available! 🚀',
    message: 'A fresh version of Rumbala is here with smoother video calls and exciting dares!',
    whats_new: '• Enhanced 16 KB Android compatibility\n• Faster multiplayer syncing\n• Smoother video calling & romantic reactions',
  });

  // Custom Remote Configs
  const [customConfigs, setCustomConfigs] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConfig, setNewConfig] = useState<CustomConfig>({
    key: '',
    value: '',
    description: '',
  });

  // Load configs from Supabase
  const loadRemoteConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_remote_configs')
        .select('*');

      if (error) {
        console.error('Failed to load configs from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        const custom: any[] = [];
        data.forEach((item) => {
          if (item.key === 'feature_flags') {
            setFlags((prev) => ({ ...prev, ...(item.value || {}) }));
          } else if (item.key === 'maintenance_mode') {
            setMaintenance((prev) => ({ ...prev, ...(item.value || {}) }));
          } else if (item.key === 'min_app_version') {
            setMinVersion((prev) => ({ ...prev, ...(item.value || {}) }));
          } else if (item.key === 'latest_app_version') {
            const raw = item.value || {};
            const whatsNewStr = Array.isArray(raw.whats_new) ? raw.whats_new.join('\n') : (raw.whats_new || '');
            setLatestVersion((prev) => ({
              ...prev,
              ...raw,
              whats_new: whatsNewStr || prev.whats_new,
            }));
          } else {
            custom.push(item);
          }
        });
        setCustomConfigs(custom);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRemoteConfigs();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('admin_remote_configs_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_remote_configs' },
        () => {
          loadRemoteConfigs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Save specific config to Supabase
  const saveConfig = async (key: string, value: any, description: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_remote_configs')
        .upsert(
          {
            key,
            value,
            description,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      // Log to audit logs
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('admin_audit_logs').insert({
        admin_id: userData?.user?.id || null,
        admin_email: userData?.user?.email || 'admin@rumbala.app',
        action: `UPDATE_CONFIG_${key.toUpperCase()}`,
        target_type: 'app_remote_configs',
        target_id: key,
        metadata: { updated_value: value },
      });

      // Broadcast live event to all connected active mobile apps (<50ms delivery)
      try {
        const liveChannel = supabase.channel('rumbala_remote_configs_live');
        const { data: allConfigs } = await supabase.from('app_remote_configs').select('*');
        const payload: Record<string, any> = {};
        allConfigs?.forEach((c) => { payload[c.key] = c.value; });
        payload[key] = value;

        await liveChannel.send({
          type: 'broadcast',
          event: 'config_updated',
          payload: payload,
        });
      } catch (broadcastErr) {
        console.warn('[Realtime Broadcast Error]:', broadcastErr);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(`Failed to save config: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle individual flag
  const handleToggleFlag = (key: keyof FeatureFlagState) => {
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);
    saveConfig('feature_flags', updated, 'Application runtime feature flags');
  };

  // Save maintenance mode
  const handleSaveMaintenance = (enabled: boolean) => {
    const updated = { ...maintenance, enabled };
    setMaintenance(updated);
    saveConfig('maintenance_mode', updated, 'Toggle application maintenance mode');
  };

  // Save minimum and recommended versions
  const handleSaveVersions = async () => {
    const whatsNewArray = latestVersion.whats_new
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const latestPayload = {
      ...latestVersion,
      whats_new: whatsNewArray,
    };

    // Save both configs and legacy app_update for full backwards compatibility
    await Promise.all([
      saveConfig('min_app_version', minVersion, 'Minimum supported app version code (Force Update)'),
      saveConfig('latest_app_version', latestPayload, 'Latest recommended app version (Soft Update)'),
      saveConfig('app_update', {
        enabled: minVersion.enforce,
        min_android: minVersion.android,
        latest_android: latestVersion.android,
        min_ios: minVersion.ios,
        latest_ios: latestVersion.ios,
        title: latestVersion.title,
        message: latestVersion.message,
        force_message: minVersion.message,
      }, 'Legacy app update bridge'),
    ]);
  };

  // Add custom config
  const handleCreateCustomConfig = async () => {
    if (!newConfig.key.trim()) {
      alert('Key name is required');
      return;
    }

    let parsedVal: any = newConfig.value;
    try {
      parsedVal = JSON.parse(newConfig.value);
    } catch {
      // Keep as string or boolean if simple
      if (newConfig.value === 'true') parsedVal = true;
      else if (newConfig.value === 'false') parsedVal = false;
      else if (!isNaN(Number(newConfig.value))) parsedVal = Number(newConfig.value);
    }

    await saveConfig(newConfig.key.trim(), parsedVal, newConfig.description);
    setShowAddModal(false);
    setNewConfig({ key: '', value: '', description: '' });
    loadRemoteConfigs();
  };

  // Delete custom config
  const handleDeleteConfig = async (key: string) => {
    if (!confirm(`Are you sure you want to delete config "${key}"?`)) return;
    try {
      await supabase.from('app_remote_configs').delete().eq('key', key);
      loadRemoteConfigs();
    } catch (err: any) {
      alert(`Error deleting config: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-7 h-7 text-primary" />
              Remote Feature Switches & Kill Switches
            </h1>
            <Badge variant="neon" className="hidden sm:inline-flex">Live Sync</Badge>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Toggle features on or off remotely across all mobile devices instantly without app store reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadRemoteConfigs}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Custom Config
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">Remote configurations broadcasted to all mobile apps successfully!</span>
        </div>
      )}

      {/* Grid of Core Feature Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Video Calling */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Video className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-base">Video Calling (Agora)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Enables Agora RTC live video streaming in Long Distance couple rooms.
              </p>
              <div className="pt-2">
                <Badge variant={flags.video_calls ? "success" : "destructive"}>
                  {flags.video_calls ? "ACTIVE & RUNNING" : "DISABLED (KILL SWITCH ON)"}
                </Badge>
              </div>
            </div>
            <Switch
              checked={flags.video_calls}
              onCheckedChange={() => handleToggleFlag('video_calls')}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* 2. Spicy & Seductive Cards */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-base">Spicy & 18+ Dares</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Controls visibility of spicy, intimate, and seductive categories in the app.
              </p>
              <div className="pt-2">
                <Badge variant={flags.spicy_category ? "success" : "destructive"}>
                  {flags.spicy_category ? "VISIBLE" : "HIDDEN (SAFE MODE)"}
                </Badge>
              </div>
            </div>
            <Switch
              checked={flags.spicy_category}
              onCheckedChange={() => handleToggleFlag('spicy_category')}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* 3. In-App Shop & Purchases */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-base">In-App Shop / Paywall</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Enables RevenueCat subscriptions and card pack purchases in mobile apps.
              </p>
              <div className="pt-2">
                <Badge variant={flags.shop_enabled ? "success" : "destructive"}>
                  {flags.shop_enabled ? "STORE OPEN" : "STORE DISABLED"}
                </Badge>
              </div>
            </div>
            <Switch
              checked={flags.shop_enabled}
              onCheckedChange={() => handleToggleFlag('shop_enabled')}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* 4. Room Creation */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-base">LDR Room Creation</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Allows users to generate new PIN room codes and host multiplayer sessions.
              </p>
              <div className="pt-2">
                <Badge variant={flags.room_creation ? "success" : "destructive"}>
                  {flags.room_creation ? "OPEN" : "CREATION PAUSED"}
                </Badge>
              </div>
            </div>
            <Switch
              checked={flags.room_creation}
              onCheckedChange={() => handleToggleFlag('room_creation')}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* 5. AI Moderation */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-base">AI Safety Moderation</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Scans custom room messages and prompts for prohibited language or abuse.
              </p>
              <div className="pt-2">
                <Badge variant={flags.ai_moderation ? "success" : "warning"}>
                  {flags.ai_moderation ? "ACTIVE FILTERING" : "BYPASSED"}
                </Badge>
              </div>
            </div>
            <Switch
              checked={flags.ai_moderation}
              onCheckedChange={() => handleToggleFlag('ai_moderation')}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* 6. Promo Codes & Gift Redemption */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Gift className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-base">Promo Code Redemption</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Allows users to type promo codes to redeem free bonus cards or discounts.
              </p>
              <div className="pt-2">
                <Badge variant={flags.promo_codes ? "success" : "destructive"}>
                  {flags.promo_codes ? "REDEMPTIONS ALLOWED" : "REDEMPTIONS PAUSED"}
                </Badge>
              </div>
            </div>
            <Switch
              checked={flags.promo_codes}
              onCheckedChange={() => handleToggleFlag('promo_codes')}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* 7. Daily Rewards */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-base">Daily Dare & Streaks</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Daily streak rewards and free couple dares on launch.
              </p>
              <div className="pt-2">
                <Badge variant={flags.daily_rewards ? "success" : "destructive"}>
                  {flags.daily_rewards ? "ENABLED" : "PAUSED"}
                </Badge>
              </div>
            </div>
            <Switch
              checked={flags.daily_rewards}
              onCheckedChange={() => handleToggleFlag('daily_rewards')}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* 8. Custom Secret Cards */}
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-base">Custom Dares Builder</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Permits users to create and save private custom cards in their personal decks.
              </p>
              <div className="pt-2">
                <Badge variant={flags.secret_cards ? "success" : "destructive"}>
                  {flags.secret_cards ? "ENABLED" : "DISABLED"}
                </Badge>
              </div>
            </div>
            <Switch
              checked={flags.secret_cards}
              onCheckedChange={() => handleToggleFlag('secret_cards')}
              disabled={saving}
            />
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Mode & Version Control Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Maintenance Mode Control */}
        <Card className={maintenance.enabled ? "border-rose-500/50 bg-rose-950/10" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-6 h-6 ${maintenance.enabled ? 'text-rose-500' : 'text-amber-400'}`} />
                <CardTitle>Global App Maintenance Mode</CardTitle>
              </div>
              <Switch
                checked={maintenance.enabled}
                onCheckedChange={handleSaveMaintenance}
                disabled={saving}
              />
            </div>
            <CardDescription>
              Locks the mobile app with a custom maintenance banner and pauses room creation during backend maintenance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Custom Maintenance Message for Users</label>
              <textarea
                className="w-full h-24 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-md"
                value={maintenance.message}
                onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveMaintenance(maintenance.enabled)}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-primary" />
              Save Message
            </Button>
          </CardContent>
        </Card>

        {/* Minimum Version & Force Update Enforcer */}
        <Card className={minVersion.enforce ? "border-cyan-500/40 bg-cyan-950/10" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-cyan-400" />
                <CardTitle>In-App Version & Update Manager</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Force Update:</span>
                <Switch
                  checked={minVersion.enforce}
                  onCheckedChange={(val) => {
                    const updated = { ...minVersion, enforce: val };
                    setMinVersion(updated);
                  }}
                  disabled={saving}
                />
              </div>
            </div>
            <CardDescription>
              Remotely prompt users to update. When Force Update is ON, users below the minimum version code are blocked until they update.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-300">Latest Android Version (Target)</label>
                <Input
                  type="number"
                  value={latestVersion.android}
                  onChange={(e) => setLatestVersion({ ...latestVersion, android: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-rose-300">Min Required Android Code</label>
                <Input
                  type="number"
                  value={minVersion.android}
                  onChange={(e) => setMinVersion({ ...minVersion, android: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Update Popup Title</label>
              <Input
                value={latestVersion.title}
                onChange={(e) => setLatestVersion({ ...latestVersion, title: e.target.value })}
                placeholder="e.g. New Update Available! 🚀"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">What's New Release Notes (One item per line)</label>
              <textarea
                className="w-full h-20 rounded-xl border border-white/10 bg-slate-900/60 p-2.5 text-xs text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-md font-mono"
                value={latestVersion.whats_new}
                onChange={(e) => setLatestVersion({ ...latestVersion, whats_new: e.target.value })}
                placeholder="• Enhanced video call stability&#10;• New spicy dares added&#10;• Performance optimizations"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Badge variant={minVersion.enforce ? "warning" : "outline"}>
                  {minVersion.enforce ? "FORCE UPDATE ACTIVE" : "SOFT UPDATE ACTIVE"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLatestVersion((prev) => ({ ...prev, android: 7 }));
                    setMinVersion((prev) => ({ ...prev, android: 7 }));
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 h-7 px-2"
                >
                  Preset: Code 7
                </Button>
              </div>

              <Button
                variant="gradient"
                size="sm"
                onClick={handleSaveVersions}
                disabled={saving}
                className="flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Save className="w-4 h-4 text-white" />
                Broadcast Update Config
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Dynamic Remote Configs */}
      {customConfigs.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Custom Dynamic Remote Configurations</CardTitle>
            <CardDescription>Arbitrary key-value parameters delivered dynamically to mobile clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-white/[0.08]">
                  <tr>
                    <th className="p-3 font-semibold">Config Key</th>
                    <th className="p-3 font-semibold">Value</th>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 font-semibold">Last Updated</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {customConfigs.map((item) => (
                    <tr key={item.key} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono font-bold text-orange-400">{item.key}</td>
                      <td className="p-3 font-mono text-xs text-slate-300 max-w-xs truncate">
                        {JSON.stringify(item.value)}
                      </td>
                      <td className="p-3 text-xs text-slate-400">{item.description || '—'}</td>
                      <td className="p-3 text-xs text-slate-500">
                        {item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteConfig(item.key)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Custom Config Modal */}
      <Dialog
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Custom Remote Config"
        description="Register a new remote configuration key to control app parameters on the fly."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Config Key (e.g. promo_banner_text)</label>
            <Input
              placeholder="e.g. max_free_cards_per_day"
              value={newConfig.key}
              onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Value (String, Number, or JSON)</label>
            <Input
              placeholder='e.g. 50 or {"banner": "Valentine Deal"}'
              value={newConfig.value}
              onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <Input
              placeholder="Optional description of what this key controls"
              value={newConfig.description}
              onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleCreateCustomConfig} disabled={saving}>
              Save Config
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
