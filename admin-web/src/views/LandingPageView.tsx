import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Heart, 
  Sparkles, 
  Video, 
  ShieldCheck, 
  Smartphone, 
  Download, 
  ChevronDown, 
  Star, 
  Users, 
  Lock, 
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  QrCode,
  Globe,
  Zap,
  Award,
  ExternalLink,
  MessageCircle,
  Menu,
  X
} from 'lucide-react';

interface LandingPageViewProps {
  onNavigate: (route: string) => void;
}

// ─── Live Curated Dares for the In-Browser Simulator ──────────
const SAMPLE_DARES = {
  romantic: [
    { text: "Look deeply into each other's eyes for 60 seconds without speaking. The first one to laugh owes the other three slow forehead kisses.", timer: 60, intensity: 1, tag: "Romantic Spark" },
    { text: "Whisper into my ear the exact moment you realized you were falling in love with me.", timer: null, intensity: 1, tag: "Sweet Memory" },
    { text: "Give me a slow, soothing 2-minute shoulder and neck massage with your hands warm.", timer: 120, intensity: 2, tag: "Touch & Relax" },
    { text: "Slow dance together to a song that only exists in your heads right now in the middle of the room.", timer: 45, intensity: 1, tag: "Intimate Vibe" },
  ],
  spicy: [
    { text: "Trace your lips slowly along my neck down to my collarbone without making a single sound.", timer: 45, intensity: 3, tag: "Heart-Racing" },
    { text: "Send a bold, sultry photo or confession text to my phone right now while sitting across from me.", timer: 60, intensity: 3, tag: "Electric Pulse" },
    { text: "Blindfold your partner. Feed them something sweet or give them 3 mystery kisses on different spots.", timer: 90, intensity: 4, tag: "Sensory Play" },
    { text: "Whisper the single wildest fantasy you've had about us this month, no holding back.", timer: null, intensity: 4, tag: "Unfiltered Desire" },
  ],
  fun: [
    { text: "Do your best, most dramatic impression of how I act when I'm hungry or tired.", timer: 30, intensity: 1, tag: "Laugh Out Loud" },
    { text: "Let your partner style your hair into the wildest, most ridiculous runway look possible.", timer: 60, intensity: 2, tag: "Playful Chaos" },
    { text: "Switch phones for 30 seconds and find the most flattering and most goofy photo of each other.", timer: 30, intensity: 1, tag: "Camera Roll" },
    { text: "Try to teach your partner a dance move in 60 seconds. You must record a 5-second blooper.", timer: 60, intensity: 2, tag: "Dance Challenge" },
  ],
  ldr: [
    { text: "Hold your palm right up against the phone camera while your partner matches theirs. Whisper three things you crave most when we reunite.", timer: 60, intensity: 2, tag: "Across Oceans" },
    { text: "Take a screenshot of us right now with our goofiest synchronized face and make it your lock screen for 24 hours.", timer: 30, intensity: 1, tag: "Virtual Hug" },
    { text: "Order your partner's favorite dessert or comfort meal to their doorstep without telling them what's coming.", timer: null, intensity: 2, tag: "Surprise Delivery" },
    { text: "Give each other a 3-minute video tour of your current room, pointing out 3 items that remind you of us.", timer: 180, intensity: 1, tag: "Room Share" },
  ],
};

const AI_DARES_POOL = [
  { text: "Slowly whisper into your partner's ear 3 specific things you found irresistibly attractive about them this week.", timer: 45, intensity: 3, tag: "AI Spark ✨" },
  { text: "Sit knees-to-knees. Hold both of each other's hands and recount your favorite spontaneous date you've ever had.", timer: 60, intensity: 2, tag: "AI Memory ✨" },
  { text: "Place your hands on your partner's chest over their heart. Breathe together in sync for 1 minute until both heartbeats align.", timer: 60, intensity: 1, tag: "AI Sensory Sync ✨" },
  { text: "Give your partner 5 kisses in 5 different places, whispering a compliment before each one.", timer: 60, intensity: 3, tag: "AI Romance Touch ✨" },
  { text: "Confess one secret thought or fantasy you had about your partner during a mundane moment this week.", timer: null, intensity: 4, tag: "AI Unfiltered Desire ✨" },
  { text: "Take a 20-second slow dance in the dark with only the soft glow of your phone illuminating your faces.", timer: 20, intensity: 2, tag: "AI Mood ✨" },
];

const SCREENSHOT_TABS = [
  {
    id: 'home',
    title: '🎲 Dare Decks',
    subtitle: 'Swipeable cards across 4 heat tiers',
    image: '/screenshots/home.png',
    badge: 'Core Experience',
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

const REVIEWS = [
  {
    author: "Liam & Maya",
    status: "Long Distance • London ↔ NYC",
    rating: 5,
    quote: "Being 3,500 miles apart was brutal until we discovered the LDR video rooms in Rumbala. It turns our FaceTime dates into hilarious, intimate adventures. Feels like we're right next to each other.",
    avatar: "🇬🇧 ✈️ 🇺🇸"
  },
  {
    author: "Elena & Marcus",
    status: "Together 4 Years • Austin, TX",
    rating: 5,
    quote: "We got stuck in the routine of eating dinner and scrolling TikTok silently. Rumbala completely revitalized our Friday nights. The spicy deck is genuinely thrilling without feeling awkward.",
    avatar: "💖"
  },
  {
    author: "Sophie & Daniel",
    status: "Newlyweds • Toronto, Canada",
    rating: 5,
    quote: "The AI Dare Studio is pure genius. You pick your vibe and it crafts prompts that feel shockingly personalized to our inside jokes and relationship chemistry. 10/10.",
    avatar: "💍"
  },
  {
    author: "Aarav & Meera",
    status: "Dating 2 Years • Bangalore",
    rating: 5,
    quote: "Zero ads, gorgeous romantic design, and 100% private. We love that our dares and answers are completely safe. It's our absolute favorite couples app.",
    avatar: "✨"
  }
];

const FAQS = [
  {
    q: "Is Rumbala really 100% private and encrypted?",
    a: "Yes, without compromise. All live video streams in LDR rooms use direct peer-to-peer WebRTC via Agora with end-to-end encryption—we never record, intercept, or store audio/video. Your saved favorites, private notes, and scores are locked behind strict PostgreSQL Row-Level Security."
  },
  {
    q: "How does Long Distance Relationship (LDR) play work?",
    a: "One partner creates a secure room code and shares it with the other. Once both join, you see each other on high-definition video while the dare deck syncs in real-time. When one partner draws a card, both screens update instantly."
  },
  {
    q: "What is the AI Dare Studio?",
    a: "Our AI Dare Studio runs server-side via Groq AI. It generates brand-new, customized dares based on your selected vibe, relationship stage, and comfort level, ensuring you always have an endless supply of fresh prompts."
  },
  {
    q: "Can we play offline without internet?",
    a: "Yes! Rumbala comes preloaded with hundreds of offline cards. When you're on an airplane, road-tripping, or relaxing in a cozy cabin without Wi-Fi, you can still draw and play all standard dare cards smoothly."
  },
  {
    q: "Is Rumbala free to try?",
    a: "Yes, 100% free to download and start playing immediately. Free users receive daily cards, access to offline decks, and standard games. Rumbala Pro is available for couples who want unlimited draws, AI dare studio generations, and advanced video room features."
  }
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  // ── Simulator State ──
  const [activeCategory, setActiveCategory] = useState<'romantic' | 'spicy' | 'fun' | 'ldr'>('romantic');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiDare, setAiDare] = useState<any | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [savedFavorites, setSavedFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('rumbala_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  // ── Timer State for Simulator ──
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Showcase State ──
  const [activeTab, setActiveTab] = useState(0);

  // ── Navigation & Modal State ──
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favToast, setFavToast] = useState(false);

  const currentDares = SAMPLE_DARES[activeCategory];
  const currentDare = aiDare || currentDares[cardIndex % currentDares.length];
  const isCurrentFavorite = savedFavorites.includes(currentDare.text);

  // Sync timer when card changes
  useEffect(() => {
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSeconds(currentDare.timer || null);
  }, [cardIndex, activeCategory, aiDare]);

  // Timer Tick Logic
  useEffect(() => {
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev !== null && prev > 1) return prev - 1;
          setIsTimerRunning(false);
          return 0;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerSeconds]);

  const handleNextCard = () => {
    setAiDare(null);
    setIsFlipped(true);
    setTimeout(() => {
      setCardIndex((prev) => prev + 1);
      setIsFlipped(false);
    }, 180);
  };

  const handleGenerateAi = () => {
    setIsGeneratingAi(true);
    setIsFlipped(true);
    setTimeout(() => {
      const randomAi = AI_DARES_POOL[Math.floor(Math.random() * AI_DARES_POOL.length)];
      setAiDare(randomAi);
      setIsGeneratingAi(false);
      setIsFlipped(false);
    }, 600);
  };

  const handleToggleFavorite = () => {
    let updated: string[];
    if (isCurrentFavorite) {
      updated = savedFavorites.filter((t) => t !== currentDare.text);
    } else {
      updated = [...savedFavorites, currentDare.text];
      setFavToast(true);
      setTimeout(() => setFavToast(false), 2000);
    }
    setSavedFavorites(updated);
    try {
      localStorage.setItem('rumbala_favorites', JSON.stringify(updated));
    } catch {}
  };

  const handleCopyDare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`"${currentDare.text}" — via Rumbala Couples App`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentScreenshot = SCREENSHOT_TABS[activeTab];

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* ── Background Ambient Glow Orbs ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[180px]" />
      </div>

      {/* ── Top Header Navigation ── */}
      <header className="border-b border-white/[0.08] bg-[#070913]/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#070913]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center">
                Rumbala<span className="text-orange-500">.</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block -mt-1">
                Couples & Intimacy
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#simulator" className="hover:text-white transition-colors">Live Dare Demo</a>
            <a href="#showcase" className="hover:text-white transition-colors">App Tour</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#reviews" className="hover:text-white transition-colors">Couples Stories</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <button
              onClick={() => onNavigate('/admin')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
            >
              Admin Portal
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="hidden lg:flex items-center gap-2 h-10 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-orange-400" />
              <span>Scan QR</span>
            </button>

            <a
              href="#download"
              className="hidden sm:flex h-11 px-5 sm:px-6 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-sm items-center gap-2 shadow-xl shadow-orange-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Get App</span>
            </a>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] bg-[#090C18]/95 backdrop-blur-2xl px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <a 
              href="#simulator" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-white hover:text-orange-400 py-1"
            >
              🎲 Live Dare Demo
            </a>
            <a 
              href="#showcase" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-white hover:text-orange-400 py-1"
            >
              📲 App Visual Tour
            </a>
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-white hover:text-orange-400 py-1"
            >
              ✨ Features & Intimacy
            </a>
            <a 
              href="#reviews" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-white hover:text-orange-400 py-1"
            >
              💖 Couples Stories
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-white hover:text-orange-400 py-1"
            >
              ❓ FAQ
            </a>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/admin');
                }}
                className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider cursor-pointer"
              >
                👑 Admin Portal
              </button>
              <a
                href="#download"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-xs"
              >
                Download Free
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section with Photorealistic iPhone Mockup Frame ── */}
      <section className="relative z-10 pt-16 pb-20 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column: Copy & Badges */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-inner">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-200 tracking-wide">
                #1 Romance & Intimacy App for Modern Couples
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
              Turn Routine Evenings Into{' '}
              <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
                Unforgettable Spark.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Break out of Netflix rut. Handcrafted dares, customized AI challenges, encrypted LDR video rooms, and sweet morning rituals designed to make every couple smile, blush, and connect deeply.
            </p>

            {/* Store CTAs & Fast Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#simulator"
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 hover:from-orange-600 hover:to-rose-600 text-white font-black text-base flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Flame className="w-5 h-5 text-white" />
                <span>Try Live Dare Simulator</span>
              </a>

              <a
                href="#download"
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-white font-bold text-base flex items-center justify-center gap-3 backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
              >
                <Smartphone className="w-5 h-5 text-orange-400" />
                <span>Download for Free</span>
              </a>
            </div>

            {/* Live Social Proof Highlights */}
            <div className="pt-8 border-t border-white/[0.08] flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-slate-200 font-extrabold text-sm">4.9 / 5</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-rose-400" />
                <span>50,000+ Couples Playing</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>100% Private & Encrypted</span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Realistic 3D-Styled iPhone 16 Pro Mockup Frame */}
          <div className="lg:col-span-5 flex justify-center relative">
            {/* Background Aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 via-orange-500/20 to-purple-600/20 rounded-full blur-3xl scale-95 pointer-events-none" />

            {/* Floating Glass Badges */}
            <div className="absolute -top-4 -left-4 sm:-left-8 z-30 p-3.5 rounded-2xl bg-[#121622]/90 border border-white/15 backdrop-blur-2xl shadow-2xl flex items-center gap-3 animate-float hidden sm:flex">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-black text-white">14-Day Spark Streak! 🔥</div>
                <div className="text-[10px] font-semibold text-slate-400">Unlocked: Wild Nights Deck</div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-4 sm:-right-8 z-30 p-3.5 rounded-2xl bg-[#121622]/90 border border-white/15 backdrop-blur-2xl shadow-2xl flex items-center gap-3 animate-float hidden sm:flex" style={{ animationDelay: '1.5s' }}>
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Heart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-black text-white">Maya completed dare ❤️</div>
                <div className="text-[10px] font-semibold text-emerald-400">2-min massage • +5 Points</div>
              </div>
            </div>

            {/* Realistic iPhone Bezel Body */}
            <div className="w-[290px] sm:w-[310px] h-[590px] sm:h-[630px] rounded-[50px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-4 border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative z-20 overflow-hidden">
              {/* Screen Inner Glass */}
              <div className="w-full h-full rounded-[42px] bg-[#0A0C16] overflow-hidden relative border border-white/10 flex flex-col">
                {/* Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black z-40 flex items-center justify-between px-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-white/10" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
                </div>

                {/* Actual App Screenshot Frame */}
                <img 
                  src="/screenshots/home.png" 
                  alt="Rumbala Mobile App Interface" 
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />

                {/* Ambient Bottom Gradient Glare */}
                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Interactive Live Dare Simulator ── */}
      <section id="simulator" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0B0F1C]/80 to-[#070913] border-y border-white/[0.06] relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Live Preview</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Draw a Live Dare Right Now
            </h2>
            <p className="text-base text-slate-300 max-w-xl mx-auto font-medium">
              Pick a vibe below and tap to draw cards. Experience how Rumbala instantly injects fun, suspense, and romance into any evening.
            </p>

            {/* Vibe Selection Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-6">
              {[
                { id: 'romantic', label: '💖 Romantic & Deep', color: 'from-pink-500 to-rose-600', border: 'border-rose-500/50' },
                { id: 'spicy', label: '🌶️ Spicy & Intimate', color: 'from-rose-600 to-red-600', border: 'border-red-500/50' },
                { id: 'fun', label: '🎉 Fun & Hilarious', color: 'from-amber-500 to-orange-500', border: 'border-amber-500/50' },
                { id: 'ldr', label: '✈️ Long Distance (LDR)', color: 'from-purple-500 to-indigo-600', border: 'border-purple-500/50' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveCategory(v.id as any);
                    setCardIndex(0);
                  }}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeCategory === v.id
                      ? `bg-gradient-to-r ${v.color} text-white shadow-xl shadow-rose-500/25 scale-105 border ${v.border}`
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 border border-white/10'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Card Canvas */}
          <div className="max-w-xl mx-auto">
            <div 
              className={`rounded-[36px] p-8 sm:p-10 bg-gradient-to-b from-[#151A2B] to-[#0E1220] border-2 border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all duration-300 ${isFlipped ? 'scale-95 opacity-50' : 'scale-100 opacity-100'} hover:border-orange-500/40`}
            >
              {/* Card Ambient Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-b from-rose-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Card Header Tag & Timer */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider">
                    {currentDare.tag}
                  </span>
                  {currentDare.timer && (
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05]">
                      ⏱️ {timerSeconds !== null ? `${timerSeconds}s` : `${currentDare.timer}s`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-400 mr-1">Heat:</span>
                  {[...Array(currentDare.intensity)].map((_, i) => (
                    <span key={i} className="text-sm">🔥</span>
                  ))}
                </div>
              </div>

              {/* Card Main Body */}
              <div className="my-8 sm:my-12 text-center min-h-[120px] flex items-center justify-center">
                <p className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-tight">
                  "{currentDare.text}"
                </p>
              </div>

              {/* Working Timer Progress Bar */}
              {currentDare.timer && (
                <div className="space-y-2 mb-6">
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-1000"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, ((timerSeconds || 0) / currentDare.timer) * 100))}%` 
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                    >
                      {isTimerRunning ? <><Pause className="w-3.5 h-3.5" /> Pause Timer</> : <><Play className="w-3.5 h-3.5" /> Start Timer</>}
                    </button>
                    <button
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSeconds(currentDare.timer || null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Card Footer Controls */}
              <div className="flex items-center justify-between pt-5 border-t border-white/[0.08] text-xs text-slate-400">
                <span className="font-semibold">
                  Card {((cardIndex % currentDares.length) + 1)} of {currentDares.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurrentFavorite 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isCurrentFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{isCurrentFavorite ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    onClick={handleCopyDare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Toast when favorited */}
              {favToast && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-rose-600/90 text-white text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2 z-30">
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>Saved to your couples favorites! 💖</span>
                </div>
              )}
            </div>

            {/* Next Card Button CTA & AI Generation CTA */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={handleNextCard}
                className="h-13 px-7 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Draw Another Dare 🎲</span>
              </button>

              <button
                onClick={handleGenerateAi}
                disabled={isGeneratingAi}
                className="h-13 px-7 rounded-2xl bg-[#1D1730] hover:bg-[#282045] border border-purple-500/40 text-purple-300 font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 text-purple-400 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'AI Crafting...' : '✨ Generate with AI'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive App Screenshot Showcase Tour ── */}
      <section id="showcase" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Visual Tour</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Designed Exclusively for Two
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto font-medium">
            Explore the core features couples love most. Click any tab to see how Rumbala looks on your device.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12">
          {SCREENSHOT_TABS.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer border ${
                activeTab === idx
                  ? 'bg-gradient-to-b from-[#181E32] to-[#121626] border-orange-500/50 shadow-xl shadow-orange-500/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="text-xs font-bold text-orange-400 mb-1">{tab.badge}</div>
              <div className="text-sm font-black text-white truncate">{tab.title}</div>
            </button>
          ))}
        </div>

        {/* Dynamic Showcase Presentation */}
        <div className="max-w-5xl mx-auto rounded-[36px] bg-[#0E1220] border border-white/10 p-6 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <span className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-wider">
              {currentScreenshot.badge}
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {currentScreenshot.title}
            </h3>
            <p className="text-base text-slate-300 leading-relaxed">
              {currentScreenshot.desc}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#download"
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get This on Mobile</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="w-[260px] sm:w-[280px] h-[520px] sm:h-[560px] rounded-[44px] p-2.5 bg-slate-800 border-4 border-slate-700 shadow-2xl overflow-hidden relative">
              <img 
                src={currentScreenshot.image} 
                alt={currentScreenshot.title}
                className="w-full h-full object-cover rounded-[34px] object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Modern Bento-Grid Features ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5" />
            <span>Built For Couples</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Everything You Need To Fall In Love Again
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto font-medium">
            Crafted meticulously with relationship experts, psychology-backed prompts, and high-performance mobile tech.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Dare Studio */}
          <div className="md:col-span-2 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#121626] to-[#0D101C] border border-white/10 hover:border-orange-500/30 transition-all space-y-5 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white">Groq-Powered AI Dare Studio</h3>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base max-w-xl">
              Never run out of inspiration. Our private AI model crafts dares tailored to your vibe, shared memories, comfort boundaries, and intensity preferences in milliseconds.
            </p>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex items-center gap-3">
              <span className="text-orange-400 font-bold">Sample Prompt:</span>
              <span className="italic truncate">"Generate a playful 2-minute massage dare with warm forehead kisses"</span>
            </div>
          </div>

          {/* Card 2: LDR Encrypted Video */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#121626] to-[#0D101C] border border-white/10 hover:border-purple-500/30 transition-all space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white">Private LDR Video</h3>
            <p className="text-slate-300 leading-relaxed text-sm">
              Live synchronized dare cards + encrypted video stream powered by Agora RTC. See your partner smile, blush, and laugh across any distance.
            </p>
          </div>

          {/* Card 3: 4 Heat Levels */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#121626] to-[#0D101C] border border-white/10 hover:border-red-500/30 transition-all space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white">4 Heat Levels</h3>
            <p className="text-slate-300 leading-relaxed text-sm">
              From gentle sweet icebreakers to deep, heart-racing intimacies. Choose your comfort level and let the cards naturally escalate the mood.
            </p>
          </div>

          {/* Card 4: Total Privacy */}
          <div className="md:col-span-2 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#121626] to-[#0D101C] border border-white/10 hover:border-emerald-500/30 transition-all space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white">100% Private, Encrypted & Safe</h3>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base max-w-xl">
              What happens in your relationship stays between you two. Zero ad trackers, zero video recording, and strict PostgreSQL Row Level Security ensure your intimate moments remain completely private.
            </p>
          </div>
        </div>
      </section>

      {/* ── Real Couples Reviews & Social Proof Wall ── */}
      <section id="reviews" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#090C16] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Real Couples Love Stories</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Loved by 50,000+ Couples Worldwide
            </h2>
            <p className="text-base text-slate-300 max-w-xl mx-auto">
              Read how real couples are transforming ordinary weeknights into unforgettable memories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {REVIEWS.map((rev, idx) => (
              <div 
                key={idx}
                className="p-6 sm:p-8 rounded-3xl bg-[#121624] border border-white/10 flex flex-col justify-between space-y-4 hover:border-orange-500/30 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{rev.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center text-lg">
                    {rev.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{rev.author}</div>
                    <div className="text-[11px] text-slate-400">{rev.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-slate-400">
            Got questions about privacy, gameplay, or how Rumbala works? We've got answers.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#111524] border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white text-base hover:text-orange-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-orange-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-white/[0.05] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Final High-Converting Download CTA ── */}
      <section id="download" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="rounded-[40px] bg-gradient-to-tr from-orange-600 via-rose-600 to-pink-700 p-8 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-rose-600/30">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="px-4 py-1.5 rounded-full bg-black/20 text-white font-bold text-xs uppercase tracking-widest backdrop-blur-md">
              Available Worldwide
            </span>
            <h2 className="text-3xl sm:text-6xl font-black tracking-tight leading-tight">
              Ready to Reignite Your Spark?
            </h2>
            <p className="text-base sm:text-lg text-white/90 font-medium">
              Join 50,000+ happy couples deepening their romance, sharing hilarious moments, and creating unforgettable memories tonight.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=com.andx.rumbala"
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 px-8 rounded-2xl bg-black/90 hover:bg-black text-white font-bold flex items-center gap-3 backdrop-blur-xl border border-white/20 transition-all hover:scale-105 active:scale-95"
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
                className="h-14 px-8 rounded-2xl bg-black/90 hover:bg-black text-white font-bold flex items-center gap-3 backdrop-blur-xl border border-white/20 transition-all hover:scale-105 active:scale-95"
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

      {/* ── Footer with Legal Links ── */}
      <footer className="border-t border-white/[0.08] bg-[#05070E] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight">Rumbala</span>
              <span className="block text-[11px] text-slate-500">Love & Intimacy for Couples</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <button
              onClick={() => onNavigate('/privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('/terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onNavigate('/delete-account')}
              className="hover:text-rose-400 transition-colors cursor-pointer"
            >
              Delete Account
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className="text-slate-600 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Admin Portal
            </button>
          </div>

          <div className="text-slate-500 text-center md:text-right">
            © {new Date().getFullYear()} Rumbala. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── Optional QR Code Modal for Desktop Scanning ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#121626] border border-white/15 p-8 text-center space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-white">Scan to Install on Mobile</h3>
            <p className="text-xs text-slate-400">
              Point your phone camera at this code to download Rumbala on iOS or Android.
            </p>
            
            {/* Styled QR Code Box */}
            <div className="p-4 rounded-2xl bg-white mx-auto w-48 h-48 flex items-center justify-center shadow-lg">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://play.google.com/store/apps/details?id=com.andx.rumbala" 
                alt="Rumbala App QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full h-11 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPageView;
