import React from 'react';
import { 
  LayoutDashboard, 
  Sliders, 
  Layers, 
  Users, 
  Gift, 
  CreditCard,
  Heart,
  ShieldCheck, 
  MessageSquare,
  Flame, 
  LogOut,
  Bug
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onLogout,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'revenue', label: 'Revenue & Sales', icon: CreditCard, badge: '₹' },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'ldr', label: 'LDR Live Rooms', icon: Heart, badge: 'Live' },
    { id: 'cards', label: 'Game Cards CMS', icon: Layers },
    { id: 'features', label: 'Feature Switches', icon: Sliders, badge: 'Hot' },
    { id: 'crashes', label: 'Crash & Error Logs', icon: Bug },
    { id: 'promos', label: 'Promo Codes', icon: Gift },
    { id: 'support', label: 'User Feedback & Reviews', icon: MessageSquare, badge: '⭐' },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0E121D] border-r border-white/[0.08] flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg tracking-tight text-white">RUMBALA</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Command v2.0</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-white border border-primary/40 shadow-glass-glow'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-primary text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="pt-4 border-t border-white/[0.06] space-y-2">
        <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs text-slate-300 font-medium">Supabase Production</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">lhfxiueygatmzvchcmyc</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
