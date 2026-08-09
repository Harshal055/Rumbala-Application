import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { RevenueView } from './views/RevenueView';
import { LdrRoomsView } from './views/LdrRoomsView';
import { FeatureFlagsView } from './views/FeatureFlagsView';
import { CardsCmsView } from './views/CardsCmsView';
import { UsersView } from './views/UsersView';
import { PromoCodesView } from './views/PromoCodesView';
import { SupportView } from './views/SupportView';
import { AuditLogsView } from './views/AuditLogsView';
import { CrashLogsView } from './views/CrashLogsView';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Flame, Shield, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Auth Form State
  const [email, setEmail] = useState('adminhr@andx.com');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        verifyAdminRole(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        verifyAdminRole(session.user.id, session.user.email);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyAdminRole = async (userId: string, userEmail?: string | null) => {
    try {
      const { data } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const normalizedEmail = (userEmail || '').toLowerCase();
      if (data || normalizedEmail === 'adminhr@andx.com' || normalizedEmail === 'admin@rumbala.app') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setAuthError('Access Denied: Your account does not have administrator privileges.');
        await supabase.auth.signOut();
      }
    } catch {
      const normalizedEmail = (userEmail || '').toLowerCase();
      if (normalizedEmail === 'adminhr@andx.com' || normalizedEmail === 'admin@rumbala.app') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setAuthError('Access Denied: Authorization verification failed.');
        await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;
      setSession(data.session);
      verifyAdminRole(data.user.id, data.user.email);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D14] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-pulse">
          <Flame className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-slate-400 font-semibold">Initializing Rumbala Enterprise Gateway...</p>
      </div>
    );
  }

  // Login Screen if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B0D14] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 items-center justify-center shadow-xl shadow-orange-500/30 mb-4 animate-float">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Rumbala Command</h1>
            <p className="text-sm text-slate-400 mt-1">Enterprise Admin Authentication Portal</p>
          </div>

          <Card className="border-white/10 bg-[#121622]/80 backdrop-blur-2xl shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="justify-center text-xl font-bold">Sign In</CardTitle>
              <CardDescription>Enter your Supabase administrator credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                {authError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                    {authError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Admin Email</label>
                  <Input
                    type="email"
                    placeholder="admin@rumbala.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full h-11 text-base font-bold shadow-lg shadow-orange-500/25 mt-2"
                  disabled={authLoading}
                >
                  {authLoading ? 'Authenticating...' : 'Access Command Portal'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D14] flex">
      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        onLogout={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar userEmail={session.user.email} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && <DashboardView onNavigate={setCurrentView} />}
          {currentView === 'revenue' && <RevenueView />}
          {currentView === 'users' && <UsersView />}
          {currentView === 'ldr' && <LdrRoomsView />}
          {currentView === 'features' && <FeatureFlagsView />}
          {currentView === 'crashes' && <CrashLogsView />}
          {currentView === 'cards' && <CardsCmsView />}
          {currentView === 'promos' && <PromoCodesView />}
          {currentView === 'support' && <SupportView />}
          {currentView === 'audit' && <AuditLogsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
