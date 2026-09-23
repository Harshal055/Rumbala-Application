import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Check, 
  Heart, 
  Trash2, 
  ArrowRight,
  ExternalLink,
  Layers,
  Smartphone
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PublicNav } from '../components/PublicNav';
import { PublicFooter } from '../components/PublicFooter';

interface SimulatorPageViewProps {
  onNavigate: (route: string) => void;
}

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

export const SimulatorPageView: React.FC<SimulatorPageViewProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<'romantic' | 'spicy' | 'fun' | 'ldr'>('romantic');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiDare, setAiDare] = useState<any | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [savedFavorites, setSavedFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('rumbala_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Timer tick logic
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

  const handleRemoveFavorite = (text: string) => {
    const updated = savedFavorites.filter((t) => t !== text);
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

  const formatTimer = (sec: number | null) => {
    if (sec === null) return '--:--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0D14] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      <PublicNav currentPath="/simulator" onNavigate={onNavigate} />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center space-y-3 mb-10">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Live In-Browser Simulator
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Test Real Dare Cards Right Now
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
              Select your mood, start the live countdown timer, or generate brand-new AI prompts on the fly.
            </p>
          </div>

          {/* Category Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { id: 'romantic', label: '💖 Romantic', desc: 'Heartfelt Connection' },
              { id: 'spicy', label: '🌶️ Spicy', desc: 'Intimate Heat' },
              { id: 'fun', label: '🎉 Fun & Silly', desc: 'Laughter & Play' },
              { id: 'ldr', label: '✈️ Long Distance', desc: 'Camera Sync' },
            ].map((cat) => {
              const isActive = activeCategory === cat.id && !aiDare;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setAiDare(null);
                    setActiveCategory(cat.id as any);
                    setCardIndex(0);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25 scale-105'
                      : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* DARE CARD CONTAINER */}
          <div className="relative">
            {/* Card Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 via-rose-500/20 to-purple-500/20 rounded-[36px] blur-2xl pointer-events-none" />

            <div
              className={`relative rounded-[32px] p-6 sm:p-10 bg-gradient-to-br from-[#161B2B] via-[#121624] to-[#0E121D] border border-white/10 shadow-2xl transition-all duration-300 ${
                isFlipped ? 'scale-95 opacity-50 blur-sm' : 'scale-100 opacity-100 blur-0'
              }`}
            >
              {/* Card Header Strip */}
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-5 mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-orange-400 font-bold px-3 py-1">
                    {currentDare.tag}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    Intensity: {'🔥'.repeat(currentDare.intensity || 1)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Save to Favorites Button */}
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isCurrentFavorite
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-white/5 text-slate-400 hover:text-rose-400 border-white/10'
                    }`}
                    title={isCurrentFavorite ? 'Saved to Favorites' : 'Save to Favorites'}
                  >
                    <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-rose-400' : ''}`} />
                  </button>

                  {/* Copy Prompt */}
                  <button
                    onClick={handleCopyDare}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title="Copy dare to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Card Dare Prompt Text */}
              <div className="min-h-[140px] flex items-center justify-center text-center px-2 py-4">
                <p className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed tracking-tight">
                  "{currentDare.text}"
                </p>
              </div>

              {/* Interactive Countdown Timer */}
              {currentDare.timer && (
                <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">
                      ⏱️
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Action Timer</p>
                      <p className="text-lg font-mono font-black text-white">
                        {formatTimer(timerSeconds)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={isTimerRunning ? 'destructive' : 'gradient'}
                      size="sm"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="text-xs h-9 px-4 font-bold"
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 mr-1" /> Start Timer
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSeconds(currentDare.timer || null);
                      }}
                      className="text-xs h-9 px-2.5 border-white/10 text-slate-300"
                      title="Reset Timer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleNextCard}
                  className="w-full sm:w-auto text-sm font-black shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  <Flame className="w-4 h-4 mr-2" /> Draw Another Dare 🎲
                </Button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi}
                    className="w-full sm:w-auto text-xs sm:text-sm font-bold border-purple-500/40 text-purple-300 hover:bg-purple-500/10 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 mr-1.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAi ? 'Generating Prompt...' : '✨ Generate with AI'}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFavoritesModal(true)}
                    className="text-xs text-rose-300 hover:text-white hover:bg-white/5"
                  >
                    <Heart className="w-3.5 h-3.5 mr-1 text-rose-400" />
                    <span>Favorites ({savedFavorites.length})</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {favToast && (
            <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-bottom-2">
              <Heart className="w-4 h-4 fill-white" />
              <span>Saved to your favorites collection!</span>
            </div>
          )}

          {/* FAVORITES DRAWER MODAL */}
          {showFavoritesModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-[#121624] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                    <h3 className="font-bold text-white text-base">Your Saved Favorite Dares</h3>
                  </div>
                  <button
                    onClick={() => setShowFavoritesModal(false)}
                    className="text-slate-400 hover:text-white text-sm font-bold"
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                  {savedFavorites.length === 0 ? (
                    <p className="text-slate-500 text-sm py-8 text-center">
                      No saved dares yet. Click the heart icon on any dare card to save it here!
                    </p>
                  ) : (
                    savedFavorites.map((text, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3"
                      >
                        <p className="text-xs text-slate-200 leading-relaxed font-medium">"{text}"</p>
                        <button
                          onClick={() => handleRemoveFavorite(text)}
                          className="text-slate-500 hover:text-rose-400 transition-colors shrink-0 p-1"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
                  <span>Saved locally in your browser</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFavoritesModal(false)}
                    className="h-8 text-xs"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Callout */}
          <div className="mt-16 text-center bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 space-y-4">
            <h3 className="text-xl font-bold text-white">Want the Full 500+ Card Deck on Your Phone?</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Download Rumbala to get synchronized video calls, streak tracking, daily intimacy questions, and personalized Groq AI dares.
            </p>
            <Button
              variant="gradient"
              onClick={() => onNavigate('/download')}
              className="font-bold text-xs"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
              <span>Download Rumbala Free</span>
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
};
