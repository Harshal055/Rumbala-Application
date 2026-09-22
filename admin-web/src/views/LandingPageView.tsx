import React, { useState } from 'react';
import { 
  Flame, 
  Heart, 
  Sparkles, 
  Video, 
  ShieldCheck, 
  Smartphone, 
  Download, 
  ChevronRight, 
  RotateCw, 
  ChevronDown, 
  Star,
  Users,
  Lock,
  ArrowRight
} from 'lucide-react';

interface LandingPageViewProps {
  onNavigate: (route: string) => void;
}

const SAMPLE_DARES = {
  romantic: [
    { text: "Look deeply into your partner's eyes for 60 seconds without speaking. Then kiss their forehead.", timer: 60, intensity: 1 },
    { text: "Whisper your favorite secret memory of our relationship into my ear.", timer: null, intensity: 1 },
    { text: "Give me a slow, soothing 2-minute shoulder and neck massage.", timer: 120, intensity: 2 },
  ],
  spicy: [
    { text: "Trace your lips along my neck down to my collarbone without making a sound.", timer: 45, intensity: 3 },
    { text: "Send a bold, playful photo or text to my phone right now while sitting across from me.", timer: 60, intensity: 2 },
    { text: "Blindfold your partner and feed them something sweet or give 3 mystery kisses.", timer: 90, intensity: 3 },
  ],
  fun: [
    { text: "Do your best dramatic impression of how I act when I'm hungry.", timer: 30, intensity: 1 },
    { text: "Dance together to a romantic song that only exists in your head for 30 seconds.", timer: 30, intensity: 1 },
    { text: "Let your partner style your hair into the wildest look possible.", timer: 60, intensity: 2 },
  ],
  ldr: [
    { text: "Take a screenshot of us right now with our funniest face and save it as your wallpaper for 24 hours.", timer: 30, intensity: 1 },
    { text: "Order your partner's favorite comfort food to their doorstep without telling them what it is.", timer: null, intensity: 2 },
    { text: "Hold your hand up to the camera screen while your partner matches theirs. Whisper three things you crave when we reunite.", timer: 60, intensity: 2 },
  ],
};

const FAQS = [
  {
    q: "Is Rumbala really private and safe?",
    a: "Yes, 100%. We take couples' privacy with utmost seriousness. All live video calls in LDR mode use end-to-end encrypted peer-to-peer streams with Agora RTC—we never record or store audio/video. Your answers, scores, and favorites are locked behind strict Row Level Security."
  },
  {
    q: "Can we play if we are in a Long Distance Relationship?",
    a: "Absolutely! Rumbala includes a dedicated LDR Video Room feature where you can see your partner in high-definition video while drawing tailored long-distance dares simultaneously."
  },
  {
    q: "How does the AI Dare Studio work?",
    a: "Our AI Dare Studio generates fresh, customized dares based on your chosen vibe, relationship dynamic, and intensity. It ensures you never run out of exciting new prompts, tailored specifically for you two."
  },
  {
    q: "Can I play offline without internet?",
    a: "Yes! Rumbala bundles hundreds of curated offline dare cards. When you're traveling, on a plane, or in a cozy cabin without Wi-Fi, you can continue drawing cards without interruption."
  },
  {
    q: "How does the subscription work?",
    a: "Rumbala is free to download and play with daily dare cards. We offer Rumbala Pro (Monthly and Annual plans) which unlocks unlimited card draws, all premium vibes (like Spicy & LDR), AI generations, and advanced video room features."
  }
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<'romantic' | 'spicy' | 'fun' | 'ldr'>('romantic');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentDares = SAMPLE_DARES[activeCategory];
  const currentDare = currentDares[cardIndex % currentDares.length];

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCardIndex((prev) => prev + 1);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#0A0C14] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* ── Top Navigation ── */}
      <header className="border-b border-white/10 bg-[#0B0E18]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Rumbala<span className="text-orange-500">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#interactive-demo" className="hover:text-white transition-colors">Try Dare</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <button
              onClick={() => onNavigate('/admin')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider font-bold"
            >
              Admin Portal
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#download"
              className="h-10 px-5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Get App</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-16 pb-24 md:py-28 px-4 sm:px-6">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-orange-500/15 via-rose-500/15 to-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-xs font-bold tracking-wide backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>THE #1 INTIMACY & DARES APP FOR COUPLES</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Ignite Your Spark. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
              Unfold Unforgettable Nights.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Handcrafted dares, spicy relationship games, real-time LDR video rooms, and AI-powered personalized challenges for couples everywhere.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#interactive-demo"
              className="h-13 px-8 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-base flex items-center gap-3 shadow-xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Flame className="w-5 h-5 text-white" />
              <span>Try Interactive Dare</span>
            </a>

            <a
              href="#download"
              className="h-13 px-8 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-base flex items-center gap-3 backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
            >
              <Smartphone className="w-5 h-5 text-orange-400" />
              <span>Download Mobile App</span>
            </a>
          </div>

          {/* Social Proof */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-slate-400">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-slate-300 ml-1.5 font-bold">4.9 / 5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-400" />
              <span>50,000+ Couples Playing</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>100% Private & Encrypted</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Live Dare Simulator ── */}
      <section id="interactive-demo" className="py-20 px-4 sm:px-6 bg-[#0E121E]/60 border-y border-white/5 relative">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LIVE IN-BROWSER SIMULATOR</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Experience Rumbala Right Now</h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Pick a vibe below and draw a sample dare to see how Rumbala turns any evening into an unforgettable adventure.
          </p>

          {/* Vibe Selector Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: 'romantic', label: '💖 Romantic', color: 'from-pink-500 to-rose-500' },
              { id: 'spicy', label: '🌶️ Spicy', color: 'from-rose-600 to-red-600' },
              { id: 'fun', label: '🎈 Fun & Playful', color: 'from-blue-500 to-cyan-500' },
              { id: 'ldr', label: '✈️ Long Distance', color: 'from-purple-500 to-indigo-600' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setActiveCategory(v.id as any);
                  setCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeCategory === v.id
                    ? `bg-gradient-to-r ${v.color} text-white shadow-lg shadow-orange-500/20 scale-105`
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Simulator Graphic */}
        <div className="max-w-md mx-auto relative perspective-1000">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full min-h-[320px] rounded-3xl p-8 bg-gradient-to-b from-[#181D2E] to-[#121624] border-2 border-orange-500/30 shadow-2xl shadow-orange-500/10 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-orange-500/60 relative overflow-hidden`}
          >
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-wider">
                  {activeCategory.toUpperCase()}
                </span>
                {currentDare.timer && (
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    ⏱️ {currentDare.timer}s timer
                  </span>
                )}
              </div>
              <div className="flex text-orange-400 text-xs">
                {'🔥'.repeat(currentDare.intensity || 1)}
              </div>
            </div>

            <div className="my-8 text-center">
              <p className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                "{currentDare.text}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
              <span>Card {((cardIndex % currentDares.length) + 1)} of {currentDares.length}</span>
              <span className="text-orange-400 font-bold flex items-center gap-1">
                Tap card to interact ✨
              </span>
            </div>
          </div>

          {/* Action buttons below card */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handleNextCard}
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <RotateCw className="w-4 h-4" />
              <span>Draw Another Dare</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
            <Heart className="w-3.5 h-3.5" />
            <span>BUILT FOR MODERN COUPLES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">Everything You Need To Stay Connected</h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-medium">
            Whether living together under the same roof or separated by continents, Rumbala brings closeness, excitement, and laughter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Sparkles,
              color: 'from-orange-500 to-amber-500',
              title: 'AI Dare Studio',
              desc: 'Custom dares crafted in real-time by Groq AI. Tailored directly to your preferences, mood, and relationship dynamic.'
            },
            {
              icon: Video,
              color: 'from-rose-500 to-pink-500',
              title: 'LDR Video Rooms',
              desc: 'Long-distance video calls with synchronized dare cards and private encrypted rooms powered by Agora RTC.'
            },
            {
              icon: Flame,
              color: 'from-red-500 to-rose-600',
              title: '4 Heat Levels',
              desc: 'Progress seamlessly from sweet icebreakers and hilarious laugh-out-loud dares to deep romance and spicy intimacies.'
            },
            {
              icon: ShieldCheck,
              color: 'from-emerald-500 to-teal-500',
              title: 'Total Privacy',
              desc: 'Your relationship is private. Zero tracking, zero audio/video storage, and protected by enterprise Row Level Security.'
            }
          ].map((feat, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-[#121624] border border-white/10 hover:border-orange-500/40 transition-all duration-300 hover:-translate-y-1 space-y-4"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-lg`}>
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Download CTA Banner ── */}
      <section id="download" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-tr from-orange-600 via-rose-600 to-pink-700 p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-orange-600/30">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Ready To Elevate Your Relationship?</h2>
            <p className="text-base sm:text-lg text-white/90 font-medium">
              Join thousands of couples deepening their connection, sharing unforgettable laughs, and igniting genuine intimacy.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=com.andx.rumbala"
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 px-8 rounded-2xl bg-black/80 hover:bg-black text-white font-bold flex items-center gap-3 backdrop-blur-xl border border-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Get it on</div>
                  <div className="text-base font-extrabold leading-none mt-1">Google Play</div>
                </div>
              </a>

              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 px-8 rounded-2xl bg-black/80 hover:bg-black text-white font-bold flex items-center gap-3 backdrop-blur-xl border border-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Download on the</div>
                  <div className="text-base font-extrabold leading-none mt-1">App Store</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-sm sm:text-base text-slate-400">Everything you need to know about Rumbala</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#121624] border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-white text-base hover:text-orange-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-[#0B0E18] py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-base font-bold text-white">Rumbala</span>
            <span>• Love & Intimacy for Couples</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <button
              onClick={() => onNavigate('/privacy')}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('/terms')}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onNavigate('/delete-account')}
              className="hover:text-rose-400 transition-colors"
            >
              Delete Account
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className="text-slate-600 hover:text-slate-400 transition-colors"
            >
              Admin
            </button>
          </div>

          <div className="text-slate-500">
            © {new Date().getFullYear()} Rumbala. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
