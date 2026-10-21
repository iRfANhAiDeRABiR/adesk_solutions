import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Shield3D } from './common/PaymentLogos';
import { ArrowRight } from 'lucide-react';
import { trackInitiateCheckout } from '../services/pixelService';

export default function HowItWorks() {
  const { lang, t } = useLanguage();

  const stepColors = [
    {
      bg: "bg-gradient-to-br from-[#ea580c] to-[#dc2626]",
      shadow: "shadow-red-500/25",
      numBn: "১",
      numEn: "1"
    },
    {
      bg: "bg-gradient-to-br from-[#0284c7] to-[#0369a1]",
      shadow: "shadow-sky-500/25",
      numBn: "২",
      numEn: "2"
    },
    {
      bg: "bg-gradient-to-br from-[#059669] to-[#047857]",
      shadow: "shadow-emerald-500/25",
      numBn: "৩",
      numEn: "3"
    },
    {
      bg: "bg-gradient-to-br from-[#7c3aed] to-[#6d28d9]",
      shadow: "shadow-purple-500/25",
      numBn: "৪",
      numEn: "4"
    }
  ];

  return (
    <section id="how-to-order" className="py-16 md:py-24 bg-white text-slate-900 border-y border-slate-200 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header (Exact Match to Reference Screenshot 1) */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t.howToOrder.heading}
          </h2>

          {/* Dual-color Accent Underline (Left Blue, Right Red) */}
          <div className="w-20 h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-rose-500 mx-auto mt-3.5 mb-3 shadow-sm"></div>

          <p className="text-sm sm:text-base font-medium text-slate-600">
            {t.howToOrder.subtitle}
          </p>
        </div>

        {/* 4-Step Flow Row with Connecting Arrows */}
        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 items-start">
            {t.howToOrder.steps.map((step, idx) => {
              const colorInfo = stepColors[idx] || stepColors[0];
              const isLast = idx === t.howToOrder.steps.length - 1;

              return (
                <div key={idx} className="relative flex flex-col items-center text-center group">
                  
                  {/* Step Number Circle */}
                  <div className="relative mb-5">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${colorInfo.bg} text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg ${colorInfo.shadow} group-hover:scale-105 transition-transform duration-200`}
                    >
                      <span>{lang === 'bn' ? colorInfo.numBn : colorInfo.numEn}</span>
                    </div>
                  </div>

                  {/* Step Title */}
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-2 leading-snug">
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-[210px] mx-auto font-normal">
                    {step.desc}
                  </p>

                  {/* Desktop Right Arrow (Hidden on Last Step & Mobile) */}
                  {!isLast && (
                    <div className="hidden lg:flex absolute -right-4 top-7 text-slate-300 pointer-events-none items-center justify-center">
                      <svg
                        className="w-7 h-7 stroke-[2.5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Replacement Guarantee Card (Exact Match to Reference Screenshot 2) */}
        <div className="max-w-5xl mx-auto mt-16 sm:mt-20">
          <div className="relative rounded-[2rem] bg-[#f0fdf4] border-2 border-emerald-300/90 p-6 sm:p-10 shadow-sm text-center">
            
            {/* Centered 3D Glossy Shield Icon */}
            <div className="flex justify-center mb-4">
              <Shield3D className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md" />
            </div>

            {/* Guarantee Title */}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-950 mb-3 tracking-tight">
              {t.howToOrder.guarantee.title}
            </h3>

            {/* Guarantee Body Text */}
            <p className="text-xs sm:text-sm md:text-[15px] text-emerald-900/90 leading-relaxed max-w-3xl mx-auto font-normal">
              {t.howToOrder.guarantee.desc}
            </p>
          </div>
        </div>

        {/* Quick Order Action Button */}
        <div className="mt-12 text-center">
          <a
            href="#order"
            onClick={() => trackInitiateCheckout({ product: 'Autodesk All Apps', rawPrice: '649', quantity: 1 })}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 hover:-translate-y-0.5 transition-all"
          >
            <span>{lang === 'bn' ? "অটোডেস্ক সফটওয়্যার অর্ডার করুন" : "Order Autodesk Software"}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
