import React from 'react';
import SectionHeading from './common/SectionHeading';
import { subscriptionOptions, autodeskAllAppsPlans } from '../data/autodeskData';
import { useLanguage } from '../context/LanguageContext';
import { Clock, Check, ArrowRight } from 'lucide-react';
import { trackViewContent } from '../services/pixelService';

export default function SubscriptionPlans() {
  const { lang, t, selectedProduct, handleSelectProduct } = useLanguage();

  return (
    <section className="py-16 md:py-24 relative bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="Subscription Tiers"
          title={t.subscriptions.heading}
          subtitle={t.subscriptions.subtitle}
        />

        {/* 3 Plans Grid: 1 Year (699), 2 Years (1249), 3 Years (1849) */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {subscriptionOptions.map((plan) => {
            const planName = lang === 'bn' ? plan.nameBn : plan.name;
            const planBadge = lang === 'bn' ? plan.badgeBn : plan.badge;
            const planDesc = lang === 'bn' ? plan.descriptionBn : plan.description;
            const featuresList = lang === 'bn' && plan.featuresBn ? plan.featuresBn : plan.features;

            return (
              <div
                key={plan.id}
                className="group relative flex flex-col justify-between p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
              >
                <div>
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {planBadge}
                    </span>
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-3xl font-black text-slate-900 mb-3">
                    {planName}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                    {planDesc}
                  </p>

                  {/* Price display */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Subscription Estimate
                      </span>
                      <span className="text-3xl font-black text-slate-900 font-mono">
                        {plan.priceDisplay}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Official Access
                    </span>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {featuresList.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action CTA */}
                <button
                  onClick={() => {
                    const matchedProduct = autodeskAllAppsPlans.find((p) => p.duration === plan.name) || selectedProduct;
                    trackViewContent(plan.name, plan.price);
                    handleSelectProduct(matchedProduct, plan.name);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold bg-slate-100 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-500 text-slate-800 group-hover:text-white border border-slate-200 group-hover:border-transparent transition-all duration-200 shadow-sm"
                >
                  <span>{t.subscriptions.orderThisPlan}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
