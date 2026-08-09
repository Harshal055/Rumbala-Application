import React from 'react';
import { Badge } from './ui/badge';
import { Flame, Shield, Bell, Zap, Menu } from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ userEmail, onOpenMobileMenu }) => {
  return (
    <header className="h-16 px-6 bg-[#0E121D]/80 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="neon" className="font-mono text-[10px]">PROD LIVE</Badge>
          <span className="hidden sm:inline-block text-xs text-slate-400">
            Realtime WebSocket Sync Enabled
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-black text-white">
            ADM
          </div>
          <span className="text-xs font-semibold text-slate-200">
            {userEmail || 'Super Administrator'}
          </span>
          <Shield className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
    </header>
  );
};
