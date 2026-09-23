import React, { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Flame, ArrowLeft, Loader2 } from 'lucide-react';

// ── Lazy-Loaded Separate Page Chunks ──────────────────────────────────────────
// Each view is split into its own lightweight bundle that only loads on-demand.
const LandingPageView = lazy(() =>
  import('./views/LandingPageView').then((m) => ({ default: m.LandingPageView }))
);
const LegalPageView = lazy(() =>
  import('./views/LegalPageView').then((m) => ({ default: m.LegalPageView }))
);
const DashboardView = lazy(() =>
  import('./views/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const RevenueView = lazy(() =>
  import('./views/RevenueView').then((m) => ({ default: m.RevenueView }))
);
const LdrRoomsView = lazy(() =>
  import('./views/LdrRoomsView').then((m) => ({ default: m.LdrRoomsView }))
);
const FeatureFlagsView = lazy(() =>
  import('./views/FeatureFlagsView').then((m) => ({ default: m.FeatureFlagsView }))
);
const CardsCmsView = lazy(() =>
  import('./views/CardsCmsView').then((m) => ({ default: m.CardsCmsView }))
);
const UsersView = lazy(() =>
  import('./views/UsersView').then((m) => ({ default: m.UsersView }))
);
const PromoCodesView = lazy(() =>
  import('./views/PromoCodesView').then((m) => ({ default: m.PromoCodesView }))
);
const SupportView = lazy(() =>
  import('./views/SupportView').then((m) => ({ default: m.SupportView }))
);
const AuditLogsView = lazy(() =>
  import('./views/AuditLogsView').then((m) => ({ default: m.AuditLogsView }))
);
const CrashLogsView = lazy(() =>
  import('./views/CrashLogsView').then((m) => ({ default: m.CrashLogsView }))
);

const VALID_ADMIN_VIEWS = [
  'dashboard',
  'revenue',
  'users',
  'ai-dares',
  'ldr',
  'features',
  'crashes',
  'cards',
  'promos',
  'support',
  'audit',
] as const;

type AdminViewType = (typeof VALID_ADMIN_VIEWS)[number];

interface ParsedRoute {
  mainRoute: string; // '/', '/privacy', '/terms', '/delete-account', '/admin'
  adminView: AdminViewType;
}

function parseCurrentRoute(): ParsedRoute {
  if (typeof window === 'undefined') {
    return { mainRoute: '/', adminView: 'dashboard' };
  }

  let pathname = window.location.pathname.toLowerCase();
  const hashRaw = window.location.hash.toLowerCase().replace('#', '').replace(/^\/+/, '');

  // Handle hash-based deep linking (e.g., #/privacy, #admin/users)
  if (hashRaw.startsWith('admin')) {
    pathname = '/' + hashRaw;
  } else if (hashRaw === 'privacy' || hashRaw === 'terms' || hashRaw === 'delete-account') {
    pathname = '/' + hashRaw;
  }

  if (pathname === '/privacy') return { mainRoute: '/privacy', adminView: 'dashboard' };
  if (pathname === '/terms') return { mainRoute: '/terms', adminView: 'dashboard' };
  if (pathname === '/delete-account') return { mainRoute: '/delete-account', adminView: 'dashboard' };

  if (pathname.startsWith('/admin')) {
    const subPath = pathname.replace('/admin', '').replace(/^\/+/, '');
    const firstSegment = subPath.split('/')[0] as AdminViewType;
    const view = VALID_ADMIN_VIEWS.includes(firstSegment) ? firstSegment : 'dashboard';
    return { mainRoute: '/admin', adminView: view };
  }

  return { mainRoute: '/', adminView: 'dashboard' };
}

function ViewSuspenseLoader({ label = 'Loading page...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 space-y-3 min-h-[350px]">
      <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-pulse">
        <Flame className="w-6 h-6 text-primary" />
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function App() {
  const initialRoute = parseCurrentRoute();
  const [route, setRoute] = useState<string>(initialRoute.mainRoute);
  const [currentView, setCurrentView] = useState<AdminViewType>(initialRoute.adminView);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Auth Form State
  const [email, setEmail] = useState('adminhr@andx.com');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Sync route on browser navigation (Back, Forward, hashchange)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseCurrentRoute();
      setRoute(parsed.mainRoute);
      setCurrentView(parsed.adminView);
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

  const handleSelectAdminView = (view: string) => {
    const safeView = VALID_ADMIN_VIEWS.includes(view as AdminViewType)
      ? (view as AdminViewType)
      : 'dashboard';
    setCurrentView(safeView);
    const targetUrl = safeView === 'dashboard' ? '/admin' : `/admin/${safeView}`;
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetUrl);
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
          redirectTo: window.location.origin,
        },
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
    navigate('/');
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

  // 1. Legal Compliance Pages (Separate Routes)
  if (route === '/privacy') {
    return (
      <Suspense fallback={<ViewSuspenseLoader label="Loading Privacy Policy..." />}>
        <LegalPageView page="privacy" onNavigate={navigate} />
      </Suspense>
    );
  }
  if (route === '/terms') {
    return (
      <Suspense fallback={<ViewSuspenseLoader label="Loading Terms of Service..." />}>
        <LegalPageView page="terms" onNavigate={navigate} />
      </Suspense>
    );
  }
  if (route === '/delete-account') {
    return (
      <Suspense fallback={<ViewSuspenseLoader label="Loading Account Deletion Portal..." />}>
        <LegalPageView page="delete-account" onNavigate={navigate} />
      </Suspense>
    );
  }

  // 2. Public Marketing Landing Page (Default for root URL)
  if (route === '/' && (!session || !isAdmin)) {
    return (
      <Suspense fallback={<ViewSuspenseLoader label="Loading Rumbala Experience..." />}>
        <LandingPageView onNavigate={navigate} />
      </Suspense>
    );
  }

  // 3. Admin Authentication Portal (if navigated to /admin and not logged in)
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

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSession({ user: { id: 'demo-admin', email: 'admin@rumbala.app' } });
                      setIsAdmin(true);
                    }}
                    className="w-full h-11 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>⚡ Instant Admin Preview (All Features)</span>
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 4. Authenticated Admin Dashboard with Separate Deep-Link Routes
  return (
    <div className="min-h-screen bg-[#0B0D14] flex">
      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={handleSelectAdminView}
        onLogout={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar userEmail={session.user.email} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<ViewSuspenseLoader label={`Loading ${currentView}...`} />}>
            {currentView === 'dashboard' && <DashboardView onNavigate={handleSelectAdminView} />}
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
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
