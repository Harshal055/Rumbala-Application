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
import { AiDaresView } from './views/AiDaresView';
import { LandingPageView } from './views/LandingPageView';
import { LegalPageView } from './views/LegalPageView';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Flame, ArrowLeft } from 'lucide-react';

function getInitialRoute(): string {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace('#', '');
  if (path === '/privacy' || hash === 'privacy') return '/privacy';
  if (path === '/terms' || hash === 'terms') return '/terms';
  if (path === '/delete-account' || hash === 'delete-account') return '/delete-account';
  if (path === '/admin' || hash === 'admin') return '/admin';
  return '/';
}

export function App() {
  const [route, setRoute] = useState<string>(getInitialRoute());
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Auth Form State
  const [email, setEmail] = useState('adminhr@andx.com');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Sync route on popstate / hashchange
  useEffect(() => {
    const handlePopState = () => {
      setRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigate = (targetRoute: string) => {
    setRoute(targetRoute);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetRoute);
    }
  };

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

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Google Authentication failed.');
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
        <p className="text-sm text-slate-400 font-semibold">Initializing Rumbala Gateway...</p>
      </div>
    );
  }

  // 1. Legal Compliance Pages (Accessible to everyone)
  if (route === '/privacy') {
    return <LegalPageView page="privacy" onNavigate={navigate} />;
  }
  if (route === '/terms') {
    return <LegalPageView page="terms" onNavigate={navigate} />;
  }
  if (route === '/delete-account') {
    return <LegalPageView page="delete-account" onNavigate={navigate} />;
  }

  // 2. Public Landing Page (Default for root URL)
  if (route === '/' && (!session || !isAdmin)) {
    return <LandingPageView onNavigate={navigate} />;
  }

  // 3. Admin Authentication Portal (if user navigated to /admin and not logged in)
  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0D14] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Rumbala Homepage</span>
            </button>

            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 items-center justify-center shadow-xl shadow-orange-500/30 mb-4">
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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-700"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#121622] px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 border-none font-bold flex items-center justify-center cursor-pointer"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 4. Authenticated Admin Dashboard
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
          {currentView === 'ai-dares' && <AiDaresView />}
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
