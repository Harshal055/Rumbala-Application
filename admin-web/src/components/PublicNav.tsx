import React, { useState } from 'react';
import { Flame, Menu, X, ArrowRight, Smartphone, Sparkles, Heart } from 'lucide-react';
import { Button } from './ui/button';

interface PublicNavProps {
  currentPath: string;
  onNavigate: (route: string) => void;
}

export const PublicNav: React.FC<PublicNavProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Dare Simulator', path: '/simulator', badge: 'Live' },
    { label: 'Features', path: '/features' },
    { label: 'Reviews', path: '/reviews' },
    { label: 'FAQ', path: '/faq' },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0D14]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-all">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-white">RUMBALA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Couples Connection</p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06] backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-white border border-primary/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/40">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavClick('/admin')}
            className="text-xs border-white/10 hover:border-white/20 text-slate-300"
          >
            Admin Portal
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => handleNavClick('/download')}
            className="text-xs font-bold shadow-lg shadow-orange-500/20 group"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5" />
            <span>Get App Free</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="gradient"
            size="sm"
            onClick={() => handleNavClick('/download')}
            className="text-xs font-bold px-3 py-1.5"
          >
            Get App
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-200 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0F131E]/95 backdrop-blur-2xl border-b border-white/10 px-4 py-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/40">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2">
            <Button
              variant="gradient"
              className="w-full justify-center text-sm font-bold"
              onClick={() => handleNavClick('/download')}
            >
              <Smartphone className="w-4 h-4 mr-2" /> Download Rumbala
            </Button>
            <button
              onClick={() => handleNavClick('/admin')}
              className="w-full text-center py-2.5 text-xs text-slate-400 hover:text-white font-semibold"
            >
              Enterprise Admin Portal →
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
