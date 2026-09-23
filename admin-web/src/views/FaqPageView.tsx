import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle, ShieldCheck, Video, Heart, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PublicNav } from '../components/PublicNav';
import { PublicFooter } from '../components/PublicFooter';

interface FaqPageViewProps {
  onNavigate: (route: string) => void;
}

const FAQS = [
  {
    category: 'privacy',
    q: "Is Rumbala really 100% private and encrypted?",
    a: "Yes, without compromise. All live video streams in LDR rooms use direct peer-to-peer WebRTC via Agora with end-to-end encryption—we never record, intercept, or store audio/video. Your saved favorites, private notes, and scores are locked behind strict PostgreSQL Row-Level Security."
  },
  {
    category: 'privacy',
    q: "Do you sell our data or display ads?",
    a: "No, never. Rumbala is 100% ad-free. We do not sell user data, tracking identifiers, or couple answers to third parties or ad networks. Your intimacy remains strictly between you and your partner."
  },
  {
    category: 'gameplay',
    q: "How does Long Distance Relationship (LDR) play work?",
    a: "One partner creates a secure room code and shares it with the other. Once both join, you see each other on high-definition video while the dare deck syncs in real-time. When one partner draws a card, both screens update instantly."
  },
  {
    category: 'gameplay',
    q: "What is the AI Dare Studio?",
    a: "Our AI Dare Studio runs server-side via Groq AI. It generates brand-new, customized dares based on your selected vibe, relationship stage, and comfort level, ensuring you always have an endless supply of fresh prompts."
  },
  {
    category: 'gameplay',
    q: "Can we play offline without internet?",
    a: "Yes! Rumbala comes preloaded with hundreds of offline cards. When you're on an airplane, road-tripping, or relaxing in a cozy cabin without Wi-Fi, you can still draw and play all standard dare cards smoothly."
  },
  {
    category: 'pricing',
    q: "Is Rumbala free to try?",
    a: "Yes, 100% free to download and start playing immediately. Free users receive daily cards, access to offline decks, and standard games. Rumbala Pro is available for couples who want unlimited draws, AI dare studio generations, and advanced video room features."
  },
  {
    category: 'pricing',
    q: "Do both partners need to purchase Rumbala Pro?",
    a: "No! When one partner unlocks Rumbala Pro, they can host rooms and draw unlimited cards that both partners can enjoy during their sessions."
  },
  {
    category: 'account',
    q: "How can I request deletion of my account and data?",
    a: "You can request immediate permanent deletion of your account and all associated records directly from our Account Deletion portal (/delete-account), or via the Settings screen in the mobile app. All requests are honored within 48 hours."
  }
];

export const FaqPageView: React.FC<FaqPageViewProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [search, setSearch] = useState('');

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0D14] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      <PublicNav currentPath="/faq" onNavigate={onNavigate} />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Got Questions? We Have Answers.
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
              Learn about our end-to-end encryption, Agora video calling, Groq AI dare studio, and Pro entitlements.
            </p>

            {/* Live Search Filter */}
            <div className="pt-4 max-w-md mx-auto relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search FAQ questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-white/[0.03] border-white/10 text-sm"
              />
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3.5">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No matching questions found for "{search}".
              </div>
            ) : (
              filteredFaqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className="rounded-2xl bg-[#121624] border border-white/[0.08] overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                    >
                      <span className="font-bold text-base sm:text-lg text-white">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-orange-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-slate-300 leading-relaxed border-t border-white/[0.04] pt-4">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Need More Help Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-purple-500/10 border border-white/10 text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Still Have Questions or Feedback?</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Our team is here to help. Reach out to our support channel or check our privacy policy for technical details.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('/privacy')}
                className="text-xs font-semibold"
              >
                Read Privacy Policy
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => onNavigate('/download')}
                className="text-xs font-semibold"
              >
                Get Rumbala App
              </Button>
            </div>
          </div>

        </div>
      </main>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
};
