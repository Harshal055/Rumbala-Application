import React from 'react';
import { 
  Smartphone, 
  Download, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Star, 
  ArrowRight,
  ExternalLink 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PublicNav } from '../components/PublicNav';
import { PublicFooter } from '../components/PublicFooter';

interface DownloadPageViewProps {
  onNavigate: (route: string) => void;
}

export const DownloadPageView: React.FC<DownloadPageViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0B0D14] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      <PublicNav currentPath="/download" onNavigate={onNavigate} />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 inline-flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              Official App Distribution
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Download Rumbala for iOS & Android
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Scan the QR code with your phone's camera, or select your platform below for instant direct installation.
            </p>
          </div>

          {/* MAIN DOWNLOAD CARDS + QR GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left: App Store & Play Store Options (7 Cols) */}
            <div className="md:col-span-7 space-y-5">
              
              {/* Android Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#121624] border border-white/[0.08] hover:border-emerald-500/40 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.75h24c-.3432-4.0911-2.6889-7.5633-6.1185-9.4286"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Google Play Store</h3>
                      <p className="text-xs text-slate-400">For Samsung, Pixel, OnePlus & all Android devices</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">
                    Android 8.0+
                  </Badge>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Verified by Google Play Protect. 16 KB page-size optimized for maximum smoothness on Android 15.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button
                    variant="gradient"
                    size="sm"
                    className="font-bold text-xs"
                    onClick={() => window.open('https://play.google.com/store/apps/details?id=com.andx.rumbala', '_blank')}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    <span>Get on Google Play</span>
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                  <span className="text-xs text-slate-400 font-mono">Package: com.andx.rumbala</span>
                </div>
              </div>

              {/* iOS Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#121624] border border-white/[0.08] hover:border-blue-500/40 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.34-.56.63-.97 1.7-.84 2.73 1.01.08 2.05-.51 2.57-1.22z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Apple App Store</h3>
                      <p className="text-xs text-slate-400">For iPhone & iPad</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-xs">
                    iOS 15.0+
                  </Badge>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Engineered with Apple Metal hardware acceleration and native Agora RTC peer-to-peer audio/video.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-bold text-xs border-white/10 text-white"
                    onClick={() => window.open('https://apps.apple.com/app/rumbala/id6742358912', '_blank')}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    <span>Download on App Store</span>
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                  <span className="text-xs text-slate-400 font-mono">Bundle ID: com.andx.rumbala</span>
                </div>
              </div>

            </div>

            {/* Right: Instant Phone QR Code Scanner (5 Cols) */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-[36px] p-8 bg-gradient-to-b from-[#181D2E] to-[#0F131F] border border-white/10 shadow-2xl text-center space-y-6">
                
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20">
                    <QrCode className="w-3.5 h-3.5" /> Quick Scan
                  </div>
                  <h3 className="text-xl font-black text-white">Scan to Install</h3>
                  <p className="text-xs text-slate-400">Point your phone's camera at the code below to open the install link.</p>
                </div>

                {/* Stylized High-Res QR Code Card */}
                <div className="mx-auto w-48 h-48 rounded-2xl bg-white p-3 shadow-xl flex items-center justify-center relative overflow-hidden group">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://rumbala.app/download"
                    alt="Rumbala Download QR Code"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Status Badges */}
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Version 1.0.2 Ready</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">Instant download • Zero setup fees</p>
                </div>

              </div>
            </div>

          </div>

          {/* Security & Peace of Mind Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center space-y-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto" />
              <h4 className="text-xs font-bold text-white">100% Ad-Free</h4>
              <p className="text-[11px] text-slate-400">No popups, no ad trackers</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center space-y-1">
              <Zap className="w-5 h-5 text-orange-400 mx-auto" />
              <h4 className="text-xs font-bold text-white">Offline Mode</h4>
              <p className="text-[11px] text-slate-400">Hundreds of preloaded cards</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center space-y-1">
              <Star className="w-5 h-5 text-amber-400 mx-auto" />
              <h4 className="text-xs font-bold text-white">4.9 Star Rating</h4>
              <p className="text-[11px] text-slate-400">Loved by 50,000+ couples</p>
            </div>
          </div>

        </div>
      </main>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
};
