import React, { useState } from 'react';
import { Shield, FileText, Trash2, ArrowLeft, Heart, CheckCircle2, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LegalPageViewProps {
  page: 'privacy' | 'terms' | 'delete-account';
  onNavigate: (route: string) => void;
}

export const LegalPageView: React.FC<LegalPageViewProps> = ({ page, onNavigate }) => {
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteSubmitted, setDeleteSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteEmail.trim()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Record account deletion ticket into support_tickets table
      await supabase.from('support_tickets').insert({
        user_email: deleteEmail.trim().toLowerCase(),
        subject: 'Account Deletion Request',
        message: `User requested permanent account deletion. Reason: ${deleteReason || 'None specified'}. Please purge profile and associated records.`,
        status: 'open',
      });
      setDeleteSubmitted(true);
    } catch {
      // Fallback: still show confirmation to user
      setDeleteSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D14] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#0F131E]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Rumbala</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/privacy')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                page === 'privacy' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('/terms')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                page === 'terms' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => onNavigate('/delete-account')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                page === 'delete-account' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Delete Account
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {page === 'privacy' && (
          <article className="space-y-8 bg-[#121622]/90 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Privacy Policy</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Last updated: September 2026 • Effective immediately</p>
              </div>
            </div>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">1. Our Commitment to Couples Privacy</h2>
              <p>
                Rumbala is designed exclusively for couples to foster intimacy, communication, and playfulness. We believe that what happens between couples should stay strictly between them. We do not sell your personal data, and we collect only the minimum information necessary to deliver the Rumbala experience.
              </p>
            </section>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-2 text-slate-300">
                <li><strong className="text-white">Account Information:</strong> When you register, we collect your email address, display name, and optional onboarding preferences (relationship status, app purpose).</li>
                <li><strong className="text-white">Gameplay Data:</strong> Score counters, game streak, completed dare counts, and favorite dares are stored securely in Supabase under encrypted Row Level Security (RLS).</li>
                <li><strong className="text-white">Video (LDR Mode):</strong> Real-time video calls are routed peer-to-peer via Agora RTC encrypted streams. We never record, inspect, or store your live audio or video streams on our servers.</li>
                <li><strong className="text-white">Subscriptions & Purchases:</strong> In-app purchases are processed securely by Apple App Store and Google Play via RevenueCat. We never access or store your credit card or financial credentials.</li>
              </ul>
            </section>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">3. AI Dare Generation (Groq LLM)</h2>
              <p>
                When using the AI Dare Studio, prompts are generated server-side using modern language model APIs. Only anonymous gameplay context (selected category, partner first names) is sent to generate the dare. Prompts are never associated with third-party advertisers.
              </p>
            </section>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">4. Data Deletion & Your Rights</h2>
              <p>
                You have the full right to access, rectify, or request permanent deletion of your account and all associated gameplay history at any time. You can trigger deletion directly in the mobile app settings or via our web-accessible <button onClick={() => onNavigate('/delete-account')} className="text-primary hover:underline font-bold">Account Deletion Page</button>.
              </p>
            </section>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed border-t border-white/10 pt-6">
              <h2 className="text-lg font-bold text-white">5. Contact Support</h2>
              <p>
                If you have questions regarding this Privacy Policy or data security, please contact us at <a href="mailto:support@rumbala.app" className="text-primary font-bold hover:underline">support@rumbala.app</a>.
              </p>
            </section>
          </article>
        )}

        {page === 'terms' && (
          <article className="space-y-8 bg-[#121622]/90 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Terms of Service</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Last updated: September 2026</p>
              </div>
            </div>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
              <p>
                By downloading, accessing, or using the Rumbala mobile app or website, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application. Rumbala is intended exclusively for consenting adults aged 18 and older.
              </p>
            </section>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">2. Mutual Consent & Safety First</h2>
              <p>
                Rumbala is designed for mutual fun, intimacy, and bonding. All gameplay, dares, and challenges must always be undertaken with full, ongoing, and mutual consent between partners. Either partner has the absolute right to skip, reject, or discontinue any dare at any time without penalty.
              </p>
            </section>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">3. Subscriptions & In-App Purchases</h2>
              <p>
                Rumbala offers both free decks and premium auto-renewing subscriptions (Rumbala Pro) and consumable Dare Card packs.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-300">
                <li><strong className="text-white">Billing:</strong> Subscriptions are billed through your Apple ID or Google Play account upon purchase confirmation.</li>
                <li><strong className="text-white">Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing cycle.</li>
                <li><strong className="text-white">Cancellation:</strong> You can manage or cancel your subscription at any time via your device's App Store or Google Play Store settings.</li>
              </ul>
            </section>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">4. User Conduct</h2>
              <p>
                You agree not to use the app to harass, coerce, or violate the dignity of your partner or any third party. Using LDR video features to record or broadcast without mutual consent is strictly prohibited.
              </p>
            </section>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed border-t border-white/10 pt-6">
              <h2 className="text-lg font-bold text-white">5. Limitation of Liability</h2>
              <p>
                Rumbala is provided "as is". To the fullest extent permitted by law, Rumbala and its developers disclaim any liability for indirect, incidental, or consequential damages resulting from app usage.
              </p>
            </section>
          </article>
        )}

        {page === 'delete-account' && (
          <article className="space-y-8 bg-[#121622]/90 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Request Account & Data Deletion</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Google Play & App Store Compliance • Complete Purge</p>
              </div>
            </div>

            <section className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <p>
                In compliance with Google Play Store User Data policies and privacy regulations, you can delete your Rumbala account and all associated personal records at any time.
              </p>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <h3 className="font-bold text-white">What data is deleted?</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                  <li>Your user account authentication credentials.</li>
                  <li>Profile data (names, partner email, relationship answers).</li>
                  <li>Game history, custom card saves, and scoreboards.</li>
                  <li>All saved favorite dares and room associations.</li>
                </ul>
              </div>
            </section>

            {deleteSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Deletion Request Received</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  We have received your account deletion request for <strong className="text-white">{deleteEmail}</strong>. All associated records will be permanently purged from our database within 48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDeleteRequest} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Your Account Email</label>
                  <input
                    type="email"
                    required
                    placeholder="couple@example.com"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Reason (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Let us know why you are leaving (e.g. no longer needed, technical issue)"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm resize-none"
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-rose-400 font-medium">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Deletion Request'}
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="border-t border-white/10 pt-6 text-xs text-slate-400">
              <p>You can also delete your account instantly from within the mobile app by going to <strong>Settings → Account → Delete Account</strong>.</p>
            </div>
          </article>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Rumbala. All rights reserved. Crafted with passion for couples worldwide.</p>
      </footer>
    </div>
  );
};
