import React, { useState } from 'react';
import { 
  Sparkles, 
  Video, 
  ShieldCheck, 
  Flame, 
  Lock, 
  Heart, 
  Zap, 
  Smartphone, 
  ArrowRight,
  Layers,
  Award,
  Globe
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { PublicNav } from '../components/PublicNav';
import { PublicFooter } from '../components/PublicFooter';

interface FeaturesPageViewProps {
  onNavigate: (route: string) => void;
}

const SCREENSHOT_TABS = [
  {
    id: 'home',
    title: '🎲 Dare Decks',
    subtitle: 'Swipeable cards across 4 heat tiers',
    image: '/screenshots/home.png',
    badge: 'Core Gameplay',
    desc: 'Hundreds of handcrafted dares categorized by romantic, spicy, playful, and LDR moods. Swipe to draw, skip, or bookmark to favorites.'
  },
  {
    id: 'ldr',
    title: '✈️ LDR Video Rooms',
    subtitle: 'Synchronized live video dares',
    image: '/screenshots/ldr.png',
    badge: 'Long Distance',
    desc: 'High-definition encrypted video calling powered by Agora RTC. Both partners see each other live while synchronized dare cards flip on screen.'
  },
  {
    id: 'daily',
    title: '☀️ Daily Spark',
    subtitle: 'One deep question every morning',
    image: '/screenshots/daily.png',
    badge: 'Daily Connection',
    desc: 'A daily intimacy ritual. Answer synchronized questions together to earn card streaks and reveal sweet, unexpected things about your partner.'
  },
  {
    id: 'profile',
    title: '👑 Rumbala Pro & Studio',
    subtitle: 'AI Dare generator & analytics',
    image: '/screenshots/shop.png',
    badge: 'Unlimited Intimacy',
    desc: 'Unlock infinite card draws, custom Groq AI dare generation tailored to your exact comfort zone, and couple progress tracking.'
  },
];

export const FeaturesPageView: React.FC<FeaturesPageViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-[#0B0D14] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      <PublicNav currentPath="/features" onNavigate={onNavigate} />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          
          {/* HEADER */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Comprehensive Platform Capabilities
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Engineered for Real Intimacy & Chemistry
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Every detail of Rumbala is designed to eliminate awkwardness, spark authentic laughter, and keep couples intimately linked—whether sharing a sofa or living across time zones.
            </p>
          </div>

          {/* INTERACTIVE 4-TAB VISUAL TOUR */}
          <section className="bg-gradient-to-br from-[#121624] via-[#0E121D] to-[#0A0D14] rounded-3xl p-6 sm:p-10 border border-white/[0.08] shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Interactive Tab Selectors */}
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Interactive App Walkthrough
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  See the Real Mobile Experience
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 pb-2">
                  Click through the core modes below to inspect how Rumbala runs on iOS and Android devices.
                </p>

                <div className="space-y-3">
                  {SCREENSHOT_TABS.map((tab, idx) => {
                    const isSelected = activeTab === idx;
                    return (
                      <div
                        key={tab.id}
                        onClick={() => setActiveTab(idx)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500/15 to-rose-500/15 border-primary/50 shadow-md'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className={`font-bold text-sm sm:text-base ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {tab.title}
                          </h4>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-primary text-white' : 'bg-white/5 text-slate-400'
                          }`}>
                            {tab.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {tab.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Realistic iPhone Frame displaying selected screenshot */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="relative w-[280px] sm:w-[310px] aspect-[9/19.5] rounded-[48px] p-3 bg-gradient-to-b from-[#323847] via-[#1B1E28] to-[#11131A] shadow-2xl border-[3.5px] border-[#3F475B]">
                  <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-black border border-white/[0.12]">
                    {/* Dynamic Island */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30" />

                    <img
                      src={SCREENSHOT_TABS[activeTab].image}
                      alt={SCREENSHOT_TABS[activeTab].title}
                      className="w-full h-full object-cover object-top transition-all duration-300 select-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* BENTO GRID: ARCHITECTURE & SECURITY */}
          <section className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Security & Intelligence
              </span>
              <h2 className="text-3xl font-black text-white">
                Built with Zero Compromise
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento 1: Groq AI Studio */}
              <div className="p-8 rounded-3xl bg-[#121624] border border-white/[0.08] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Groq AI Dare Studio</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Ultra-low latency serverless LLM generation. Crafts personalized dares factoring in your relationship status, vibe, and comfort boundaries within 400 milliseconds.
                </p>
                <div className="pt-2 text-xs font-mono text-purple-300 font-semibold">
                  • Server-side Groq API • Zero client leakage
                </div>
              </div>

              {/* Bento 2: Agora RTC P2P Video */}
              <div className="p-8 rounded-3xl bg-[#121624] border border-white/[0.08] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Peer-to-Peer Agora RTC</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Encrypted, low-latency video calling engineered specifically for long-distance couples. Realtime synchronized game turn signals with sub-100ms card flips.
                </p>
                <div className="pt-2 text-xs font-mono text-rose-300 font-semibold">
                  • Zero video recordings • Ephemeral sessions
                </div>
              </div>

              {/* Bento 3: PostgreSQL Row-Level Security */}
              <div className="p-8 rounded-3xl bg-[#121624] border border-white/[0.08] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">PostgreSQL Row-Level Security</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Your relationship data is locked behind cryptographic auth IDs. Anti-cheat triggers, privileged RPC barriers, and own-row RLS guarantee total data confidentiality.
                </p>
                <div className="pt-2 text-xs font-mono text-emerald-300 font-semibold">
                  • Bank-grade isolation • Zero ad-trackers
                </div>
              </div>
            </div>
          </section>

          {/* BOTTOM CTA */}
          <div className="text-center bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-10 space-y-5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Experience the Full App on Your Phone
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Download Rumbala free and explore all 4 decks with your partner today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => onNavigate('/download')}
                className="font-bold text-sm"
              >
                <Smartphone className="w-4 h-4 mr-2" /> Download Rumbala
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('/simulator')}
                className="text-sm font-bold"
              >
                Test Simulator First
              </Button>
            </div>
          </div>

        </div>
      </main>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
};
