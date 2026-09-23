import React from 'react';
import { Flame, Heart, Shield, Lock, ExternalLink } from 'lucide-react';

interface PublicFooterProps {
  onNavigate: (route: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0D14] pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/[0.06]">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight text-white">RUMBALA</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              The premier couples intimacy & dares platform. Rekindle passion, spark uncontrollable laughter, and bridge long distances through synchronized games.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Agora RTC Encrypted • Supabase Row-Level Security</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors cursor-pointer">
                  Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/simulator')} className="hover:text-white transition-colors cursor-pointer text-orange-400 font-semibold">
                  Live Dare Simulator ✨
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/features')} className="hover:text-white transition-colors cursor-pointer">
                  App Visual Tour
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/reviews')} className="hover:text-white transition-colors cursor-pointer">
                  Couples Reviews
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/faq')} className="hover:text-white transition-colors cursor-pointer">
                  FAQ & Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Compliance</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/delete-account')} className="hover:text-rose-400 transition-colors cursor-pointer">
                  Delete Account Portal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/download')} className="hover:text-white transition-colors cursor-pointer">
                  Download Mobile App
                </button>
              </li>
            </ul>
          </div>

          {/* Enterprise Admin */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('/admin')} className="text-orange-400 hover:text-orange-300 font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Command</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/admin/cards')} className="hover:text-white transition-colors cursor-pointer">
                  Game Cards CMS
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/admin/features')} className="hover:text-white transition-colors cursor-pointer">
                  Feature Switches
                </button>
              </li>
              <li>
                <span className="text-xs text-slate-400 block pt-1 font-mono">v1.0.2 Production</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Rumbala Inc. Crafted for couples worldwide.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/privacy')} className="hover:text-slate-300">Privacy</button>
            <button onClick={() => onNavigate('/terms')} className="hover:text-slate-300">Terms</button>
            <button onClick={() => onNavigate('/delete-account')} className="hover:text-slate-300">Data Deletion</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
