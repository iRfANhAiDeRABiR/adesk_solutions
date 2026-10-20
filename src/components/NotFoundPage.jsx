import React, { useEffect } from 'react';
import { ShieldAlert, Home, ArrowRight, MessageCircle, Lock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { trackPixelEvent, trackContact } from '../services/pixelService';
import Logo from './common/Logo';

export default function NotFoundPage({ onGoHome }) {
  const { lang } = useLanguage();

  useEffect(() => {
    // Track 404 hit in Meta Pixel for error monitoring
    trackPixelEvent('404_PageNotFound', {
      path: window.location.pathname,
      referrer: document.referrer || 'direct'
    });
  }, []);

  const handleHomeClick = (e) => {
    if (onGoHome) {
      e.preventDefault();
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleOrderClick = (e) => {
    if (onGoHome) {
      e.preventDefault();
      onGoHome('#order');
    } else {
      window.location.href = '/#order';
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between selection:bg-brand-blue selection:text-white relative overflow-hidden font-sans">
      {/* Background Cybersecurity Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />
      
      {/* Ambient Radial Glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-blue/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 right-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Simple Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <a href="/" onClick={handleHomeClick} className="flex items-center gap-3 group">
          <Logo isDark={true} className="h-10" />
        </a>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{lang === 'bn' ? 'সিস্টেম সক্রিয়' : 'System Secure'}</span>
        </div>
      </header>

      {/* Main 404 Hero Card */}
      <main className="relative z-10 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 flex-grow flex items-center justify-center">
        <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl shadow-black/60 text-center relative overflow-hidden">
          
          {/* Subtle Top Glow Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-6">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>HTTP Status: 404 Not Found</span>
          </div>

          {/* 404 Big Glitch Text */}
          <div className="text-7xl sm:text-9xl font-black tracking-tighter bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent select-none mb-3">
            404
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
            {lang === 'bn' ? 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি' : 'Page Not Found'}
          </h1>

          {/* Description */}
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
            {lang === 'bn' 
              ? 'আপনি যে পেজ বা সাবস্ক্রিপশন লিঙ্কটিতে প্রবেশ করতে চেয়েছেন তা পরিবর্তিত হয়েছে অথবা সরিয়ে নেওয়া হয়েছে। আপনার সুরক্ষায় নিচে প্রদত্ত লিঙ্ক থেকে এগিয়ে যান।'
              : 'The link or subscription page you are trying to access has been moved, removed, or is temporarily unavailable.'
            }
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
            <a
              href="/"
              onClick={handleHomeClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              <span>{lang === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Homepage'}</span>
            </a>

            <a
              href="/#order"
              onClick={handleOrderClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>{lang === 'bn' ? 'Autodesk সাবস্ক্রিপশন দেখুন' : 'View Autodesk Plans'}</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </a>
          </div>

          {/* Support Line */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'bn' ? '২৫৬-বিট এসএসএল সুরক্ষিত' : '256-Bit SSL Encrypted'}
            </span>

            <a
              href="https://wa.me/639552506023"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact('404_WhatsApp')}
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সরাসরি WhatsApp-এ সাহায্য নিন' : 'Need help? Contact WhatsApp'}</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
        © 2024–2027 Software Solutions BD. All Rights Reserved. Official Autodesk Solutions.
      </footer>
    </div>
  );
}

