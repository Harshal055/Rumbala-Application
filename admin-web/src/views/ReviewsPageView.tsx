import React, { useState } from 'react';
import { Star, Heart, Users, MessageSquare, Award, Smartphone, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PublicNav } from '../components/PublicNav';
import { PublicFooter } from '../components/PublicFooter';

interface ReviewsPageViewProps {
  onNavigate: (route: string) => void;
}

const REVIEWS = [
  {
    author: "Liam & Maya",
    category: "ldr",
    status: "Long Distance • London ↔ NYC",
    rating: 5,
    quote: "Being 3,500 miles apart was brutal until we discovered the LDR video rooms in Rumbala. It turns our FaceTime dates into hilarious, intimate adventures. Feels like we're right next to each other.",
    avatar: "🇬🇧 ✈️ 🇺🇸"
  },
  {
    author: "Elena & Marcus",
    category: "married",
    status: "Together 4 Years • Austin, TX",
    rating: 5,
    quote: "We got stuck in the routine of eating dinner and scrolling TikTok silently. Rumbala completely revitalized our Friday nights. The spicy deck is genuinely thrilling without feeling awkward.",
    avatar: "💖"
  },
  {
    author: "Sophie & Daniel",
    category: "newlyweds",
    status: "Newlyweds • Toronto, Canada",
    rating: 5,
    quote: "The AI Dare Studio is pure genius. You pick your vibe and it crafts prompts that feel shockingly personalized to our inside jokes and relationship chemistry. 10/10.",
    avatar: "💍"
  },
  {
    author: "Aarav & Meera",
    category: "dating",
    status: "Dating 2 Years • Bangalore",
    rating: 5,
    quote: "Zero ads, gorgeous romantic design, and 100% private. We love that our dares and answers are completely safe. It's our absolute favorite couples app.",
    avatar: "✨"
  },
  {
    author: "Jordan & Casey",
    category: "ldr",
    status: "Long Distance • San Francisco ↔ Tokyo",
    rating: 5,
    quote: "The synchronized card flips over video call are so smooth. We've tried standard trivia apps before and they all felt dry. Rumbala makes you laugh, flirt, and connect on a totally different level.",
    avatar: "🇯🇵 ✈️ 🇺🇸"
  },
  {
    author: "Priya & Rohan",
    category: "married",
    status: "Married 6 Years • Mumbai",
    rating: 5,
    quote: "With work and hectic schedules, date night often felt like a chore. The 5-minute daily spark questions give us a quick reason to look at each other and smile every morning.",
    avatar: "🌸"
  }
];

export const ReviewsPageView: React.FC<ReviewsPageViewProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'ldr' | 'married' | 'newlyweds' | 'dating'>('all');

  const filteredReviews = filter === 'all' 
    ? REVIEWS 
    : REVIEWS.filter((r) => r.category === filter);

  return (
    <div className="min-h-screen bg-[#0B0D14] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      <PublicNav currentPath="/reviews" onNavigate={onNavigate} />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Header & Stats Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              Verified Couples Reviews
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Loved by 50,000+ Couples Worldwide
            </h1>
            <p className="text-sm sm:text-base text-slate-400">
              Read how couples across time zones, marriages, and relationships use Rumbala to rekindle their romance and build lasting habits.
            </p>

            {/* Metric Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <span className="text-2xl font-black text-amber-400">4.9 ★</span>
                <span className="text-xs text-slate-400 text-left">Average Rating<br />Across 20,000+ reviews</span>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <span className="text-2xl font-black text-rose-400">98%</span>
                <span className="text-xs text-slate-400 text-left">Couples Report<br />Increased Intimacy</span>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <span className="text-2xl font-black text-emerald-400">0 Ads</span>
                <span className="text-xs text-slate-400 text-left">Uninterrupted<br />Couples Privacy</span>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Reviews' },
              { id: 'ldr', label: '✈️ Long Distance' },
              { id: 'married', label: '💍 Married Couples' },
              { id: 'newlyweds', label: '🥂 Newlyweds' },
              { id: 'dating', label: '💖 Dating' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === f.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((r, i) => (
              <div
                key={i}
                className="p-7 rounded-3xl bg-[#121624] border border-white/[0.08] hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Stars + Avatar */}
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {[...Array(r.rating)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xl">{r.avatar}</span>
                  </div>

                  {/* Quote */}
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    "{r.quote}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{r.author}</h4>
                    <p className="text-xs text-slate-400">{r.status}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Verified Couple
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* BOTTOM CTA */}
          <div className="text-center bg-white/[0.02] border border-white/[0.06] rounded-3xl p-10 space-y-4">
            <h3 className="text-2xl font-black text-white">Join 50,000+ Couples Today</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Download Rumbala for free and start your intimacy spark tonight.
            </p>
            <Button
              variant="gradient"
              onClick={() => onNavigate('/download')}
              className="font-bold text-xs"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
              <span>Get Rumbala Free</span>
            </Button>
          </div>

        </div>
      </main>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
};
