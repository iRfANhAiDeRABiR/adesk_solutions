import React, { useState } from 'react';
import SectionHeading from './common/SectionHeading';
import { useLanguage } from '../context/LanguageContext';
import { trackContact } from '../services/pixelService';
import {
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Send,
  CheckCircle2
} from 'lucide-react';

export default function ContactSection() {
  const { t } = useLanguage();
  const [inquirySent, setInquirySent] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email) return;
    setInquirySent(true);
    setTimeout(() => {
      setFormState({ name: '', email: '', message: '' });
      setInquirySent(false);
    }, 4000);
  };

  return (
    <section id="contact" className="py-16 md:py-24 relative bg-slate-50 border-t border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="Direct Advisory"
          title={t.contact.heading}
          subtitle={t.contact.subtitle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Channels Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* WhatsApp Support */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-500 shadow-sm transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-500 mb-1">{t.contact.whatsappLabel}</div>
                <div className="text-sm font-bold text-slate-900 font-mono">{t.contact.whatsappValue}</div>
                <a
                  href={`https://wa.me/${t.contact.whatsappValue.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackContact('ContactSection_WhatsApp')}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                >
                  <span>{t.contact.whatsappBtn} →</span>
                </a>
              </div>

              {/* Phone Helpline */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 shadow-sm transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-500 mb-1">{t.contact.phoneLabel}</div>
                <div className="text-sm font-bold text-slate-900 font-mono">{t.contact.phoneValue}</div>
                <a
                  href={`tel:${t.contact.phoneValue.replace(/[^0-9+]/g, '')}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <span>{t.contact.callBtn} →</span>
                </a>
              </div>

              {/* Email Desk */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 shadow-sm transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-3">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-500 mb-1">{t.contact.emailLabel}</div>
                <div className="text-sm font-bold text-slate-900 font-mono truncate">{t.contact.emailValue}</div>
                <a
                  href={`mailto:${t.contact.emailValue}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <span>{t.contact.emailBtn} →</span>
                </a>
              </div>

              {/* Business Hours */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-500 mb-1">{t.contact.hoursLabel}</div>
                <div className="text-xs font-medium text-slate-700 leading-snug">
                  {t.contact.hoursValue}
                </div>
              </div>

            </div>

            {/* Advisory note */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Pre-Order Consultation:</span> Have questions regarding system requirements, desktop vs. cloud tools, or multi-seat deployments? Our team is available to assist you during business hours.
            </div>
          </div>

          {/* Quick Inquiry Note Form (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Request Autodesk Information</h3>
            <p className="text-xs text-slate-600 mb-6">
              Send a quick query regarding version compatibility, collection inclusions, or custom seat arrangements.
            </p>

            {inquirySent ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Inquiry Sent!</h4>
                <p className="text-xs text-slate-600">Our Autodesk specialist will review your question and respond promptly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="your-email@company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Question / Software Requirement</label>
                  <textarea
                    rows="3"
                    required
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="e.g. Which subscription is best for AutoCAD + Revit on Windows 11?"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-colors"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 text-white shadow-md hover:brightness-105 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Question</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
