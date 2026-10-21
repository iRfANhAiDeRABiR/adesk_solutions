import React, { useState } from 'react';
import SectionHeading from './common/SectionHeading';
import { catalogCategories } from '../data/autodeskFullCatalogData';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, ArrowRight } from 'lucide-react';
import { trackViewContent, trackInitiateCheckout } from '../services/pixelService';

export default function ProductCategories() {
  const { lang, handleSelectProduct } = useLanguage();
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  const onCardClick = (app, category) => {
    trackViewContent(app.name || category.title, 649);
    handleSelectProduct({
      id: category.id,
      name: category.title,
      selectedApp: app.name
    }, '1 Year');
  };

  const displayedCategories =
    activeCategoryFilter === 'all'
      ? catalogCategories
      : catalogCategories.filter((cat) => cat.id === activeCategoryFilter);

  return (
    <section id="collections" className="py-16 md:py-24 relative bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <SectionHeading
          badge="Complete Autodesk Catalog"
          title={lang === 'bn' ? "অটোডেস্ক ৪৭টি প্রফেশনাল অ্যাপসের পূর্ণাঙ্গ তালিকা" : "Autodesk Official Professional Apps Directory"}
          subtitle={lang === 'bn' ? "সকল প্রধান ইন্ডাস্ট্রি, বিআইএম, মেকানিক্যাল ও ৩ডি অ্যানিমেশন টুলসেটের সুসংগঠিত ক্যাটালগ।" : "Complete directory of architecture, engineering, mechanical, and 3D visual software organized across 6 dedicated categories."}
        />

        {/* Category Navigation Pills (Jump to Category) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none sm:justify-center no-scrollbar">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
              activeCategoryFilter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 shadow-xs'
            }`}
          >
            All 6 Categories ({catalogCategories.reduce((acc, cat) => acc + cat.apps.length, 0)})
          </button>

          {catalogCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
                activeCategoryFilter === cat.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 shadow-xs'
              }`}
            >
              <span>{cat.iconEmoji}</span>
              <span className="truncate max-w-[140px] sm:max-w-none">
                {cat.id === 'autocad-toolsets' ? '7 Toolsets' : cat.id === 'autodesk-all-apps' ? 'All Apps' : cat.title.split(' ')[0]}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
                {cat.apps.length}
              </span>
            </button>
          ))}
        </div>

        {/* 6 Category Groups */}
        <div className="space-y-12">
          {displayedCategories.map((category) => {
            const catTitle = lang === 'bn' ? category.titleBn || category.title : category.title;

            return (
              <div key={category.id} className="space-y-4">
                
                {/* Category Header Bar with Left Red Accent Strip */}
                <div className="relative rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4 shadow-sm overflow-hidden flex items-center justify-between">
                  {/* Left Red Vertical Accent Line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-500 via-rose-500 to-red-600 rounded-l-2xl"></div>

                  {/* Header Title with Emoji & Crisp Dark Text */}
                  <div className="flex items-center gap-2.5 pl-3 sm:pl-4">
                    <span className="text-base sm:text-lg select-none">{category.iconEmoji}</span>
                    <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 font-sans tracking-tight">
                      {catTitle}
                    </h3>
                  </div>

                  {/* App count badge */}
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                    {category.apps.length} Apps
                  </span>
                </div>

                {/* Grid of Horizontal App Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-3.5">
                  {category.apps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => onCardClick(app, category)}
                      className="group flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5"
                    >
                      {/* Signature 2-Tier Colored Badge Icon */}
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 flex flex-col items-center justify-between overflow-hidden shadow-sm border border-white/20 ${app.color}`}
                      >
                        {/* Top Large Letter */}
                        <div className="flex-1 w-full flex items-center justify-center font-black text-base sm:text-lg text-white leading-none pt-0.5">
                          {app.letter}
                        </div>
                        {/* Bottom Abbreviation Tag */}
                        <div
                          className={`w-full text-center py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white ${app.badgeBg}`}
                        >
                          {app.code}
                        </div>
                      </div>

                      {/* Right Text Details */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {app.name}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors line-clamp-2 leading-tight mt-0.5 font-normal">
                          {app.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Catalog Callout */}
        <div className="mt-12 p-6 rounded-3xl bg-white border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Need an entire Autodesk suite or custom bundle?</h4>
              <p className="text-xs text-slate-500 font-normal">All applications can be ordered individually or as part of the Autodesk All Apps Ultimate collection.</p>
            </div>
          </div>

          <a
            href="#order"
            onClick={() => trackInitiateCheckout({ product: 'Autodesk All Apps', rawPrice: '649', quantity: 1 })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md hover:brightness-110 transition-all flex-shrink-0"
          >
            <span>Order Autodesk Software</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
