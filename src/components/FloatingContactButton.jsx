import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MessageCircle, X, Send } from 'lucide-react';
import { trackContact } from '../services/pixelService';

export default function FloatingContactButton() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const whatsappNumber = "639552506023";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Quick Chat Popup Card */}
      {isOpen && (
        <div className="mb-3 w-80 rounded-3xl bg-navy-900 border border-cyan-400/40 shadow-2xl p-5 text-slate-200 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Autodesk Support Desk</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Online & Ready to Help</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Need assistance choosing between AutoCAD, Revit, or collections? Chat directly with an Autodesk specialist on WhatsApp.
          </p>

          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackContact('Floating_WhatsApp')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <div className="relative group">
        {/* Tooltip on Desktop */}
        <div className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-navy-900 border border-cyan-400/30 text-cyan-300 text-xs font-semibold whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t.floating.tooltip}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-[0_4px_25px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-transform duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50"
          aria-label="Open WhatsApp Chat"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
