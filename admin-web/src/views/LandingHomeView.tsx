import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Heart, 
  Video, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight, 
  Star, 
  Award, 
  Users, 
  Lock,
  Zap,
  Play
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { PublicNav } from '../components/PublicNav';
import { PublicFooter } from '../components/PublicFooter';

interface LandingHomeViewProps {
  onNavigate: (route: string) => void;
}

export const LandingHomeView: React.FC<LandingHomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0B0D14] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      <PublicNav currentPath="/" onNavigate={onNavigate} />

      <main className="flex-1 pt-24">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
          {/* Ambient Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-orange-600/20 via-rose-600/20 to-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Headlines & Call to Actions */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Micro Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/30 backdrop-blur-md shadow-inner">
                  <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                    The #1 Couples Dare & Video App
                  </span>
                </div>

                {/* Primary Hero Title */}
                <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08]">
                  Rediscover <br />
                  <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
                    Pure Chemistry
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Break relationship autopilot. Draw playful, spicy, and deeply romantic dares, play synchronized video dates across oceans, and spark spontaneous intimacy every single day.
                </p>

                {/* Primary CTA Row */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={() => onNavigate('/download')}
                    className="w-full sm:w-auto h-13 px-8 text-base font-extrabold shadow-xl shadow-orange-500/25 group cursor-pointer"
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    <span>Download Free</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onNavigate('/simulator')}
                    className="w-full sm:w-auto h-13 px-7 text-base font-bold bg-white/[0.03] border-white/10 hover:border-orange-500/40 text-white cursor-pointer group"
                  >
                    <Play className="w-4 h-4 mr-2 text-orange-400 fill-orange-400/20" />
                    <span>Try Live Simulator</span>
                  </Button>
                </div>

                {/* Social Proof Strip */}
                <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {['👩‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👨'].map((em, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                          {em}
                        </div>
                      ))}
                    </div>
                    <span className="font-semibold text-slate-200">50,000+ Couples</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-white">4.9/5</span>
                    <span className="text-slate-400">(App Store & Play Store)</span>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>100% Private</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Realistic iPhone 16 Pro Mockup */}
              <div className="lg:col-span-5 flex justify-center relative">
                {/* Floating Streak Badge */}
                <div className="absolute -top-4 -left-6 z-20 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl bg-[#141926]/90 border border-white/10 backdrop-blur-xl shadow-2xl animate-bounce duration-1000">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
                    🔥
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">14-Day Spark Streak!</p>
                    <p className="text-[11px] text-orange-400 font-medium">Unlocked: Wild Nights Deck</p>
                  </div>
                </div>

                {/* Floating Dare Live Badge */}
                <div className="absolute -bottom-6 -right-6 z-20 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl bg-[#141926]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">
                    💋
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Dare Completed</p>
                    <p className="text-[11px] text-rose-300 font-medium">Maya +5 Points • Neck Massage</p>
                  </div>
                </div>

                {/* iPhone Hardware Chassis */}
                <div className="relative w-[290px] sm:w-[320px] aspect-[9/19.5] rounded-[52px] p-3.5 bg-gradient-to-b from-[#2E3340] via-[#1A1D27] to-[#11131A] shadow-[0_25px_70px_rgba(0,0,0,0.85)] border-[3.5px] border-[#3D4456]">
                  {/* Outer Frame Bevel */}
                  <div className="relative w-full h-full rounded-[44px] overflow-hidden bg-black border border-white/[0.12] flex flex-col">
                    {/* Dynamic Island */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-white/10" />
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-slate-300 font-mono font-bold">LDR LIVE</span>
                      </div>
                    </div>

                    {/* Screenshot Display */}
                    <img 
                      src="/screenshots/home.png" 
                      alt="Rumbala Mobile App Interface" 
                      className="w-full h-full object-cover object-top select-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* STANDALONE SECTIONS DIRECTORY (Page Jump Cards) */}
        <section className="py-20 border-t border-white/[0.08] bg-[#0E121D]/60 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Explore the Platform
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Everything You Need for Romantic Connection
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                Choose a dedicated showcase below to explore live features, test dares, or read couple stories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Live Dare Simulator */}
              <div 
                onClick={() => onNavigate('/simulator')}
                className="group p-6 rounded-3xl bg-[#121624] border border-white/[0.08] hover:border-orange-500/40 hover:bg-[#161B2E] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                    Interactive Dare Simulator
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Test live prompts right in your browser. Filter across Romantic, Spicy, Fun, and LDR moods with countdown timer and AI generator.
                  </p>
                </div>
                <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-orange-400">
                  <span>Launch Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Features & Visual Tour */}
              <div 
                onClick={() => onNavigate('/features')}
                className="group p-6 rounded-3xl bg-[#121624] border border-white/[0.08] hover:border-primary/40 hover:bg-[#161B2E] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                    App Tour & Features
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Explore the 4 interactive decks, encrypted Agora RTC video dates, Groq AI dare studio, and PostgreSQL Row-Level Security.
                  </p>
                </div>
                <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-primary">
                  <span>View Full Tour</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Couple Stories & Reviews */}
              <div 
                onClick={() => onNavigate('/reviews')}
                className="group p-6 rounded-3xl bg-[#121624] border border-white/[0.08] hover:border-amber-500/40 hover:bg-[#161B2E] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    Couples Love Stories
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Read verified feedback from long-distance couples, newlyweds, and long-term partners who transformed their connection with Rumbala.
                  </p>
                </div>
                <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <span>Read 50K+ Reviews</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: FAQ & Downloads */}
              <div 
                onClick={() => onNavigate('/faq')}
                className="group p-6 rounded-3xl bg-[#121624] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-[#161B2E] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    FAQ & Privacy Details
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Got questions about peer-to-peer video privacy, offline deck playback, subscription tiers, or supported Android/iOS devices?
                  </p>
                </div>
                <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span>Browse Answers</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM DOWNLOAD CTA BANNER */}
        <section className="py-20 relative overflow-hidden bg-gradient-to-r from-orange-600/10 via-rose-600/10 to-purple-600/10 border-t border-white/[0.08]">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Spark Something Unforgettable?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Download Rumbala for free today on iOS and Android. Zero ads, zero awkwardness, 100% private fun.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => onNavigate('/download')}
                className="w-full sm:w-auto h-13 px-8 text-base font-bold shadow-xl shadow-orange-500/25"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                <span>Get App Free</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('/simulator')}
                className="w-full sm:w-auto h-13 px-7 text-base font-bold"
              >
                <span>Try Live Simulator First</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
};
