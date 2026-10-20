import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  CloudDownload,
  Shield,
  Laptop,
  LayoutGrid,
  Calendar,
  Headphones,
  UserCheck,
  HardDrive,
  Scale,
  ShieldAlert,
  Play
} from 'lucide-react';

export default function PreOrderDoubts() {
  const { lang } = useLanguage();

  const doubtsList = [
    {
      id: 1,
      Icon: CloudDownload,
      questionBn: 'এটি কীভাবে আমার নিজস্ব ইমেইলে অ্যাক্টিভ হবে?',
      questionEn: 'How will this activate on my personal email?',
      answerBn: (
        <span>
          অর্ডার সম্পন্ন করার পর আপনার দেওয়া ইমেইলে Autodesk থেকে অফিশিয়াল <strong className="font-bold text-slate-900">Email Invitation</strong> পাঠানো হবে। ইমেইলে থাকা ইনভাইটেশন লিংকটি একসেপ্ট করে আপনার নিজের Autodesk অ্যাকাউন্টে সাইন-ইন করলেই ১ বছরের জন্য লাইসেন্স চালু হয়ে যাবে।
        </span>
      ),
      answerEn: (
        <span>
          After completing the order, an official <strong className="font-bold text-slate-900">Email Invitation</strong> will be sent from Autodesk to your email. Simply accept the invitation link and sign into your own Autodesk account to instantly activate the 1-year license.
        </span>
      )
    },
    {
      id: 2,
      Icon: Shield,
      questionBn: 'আমার অ্যাকাউন্টের পাসওয়ার্ড কি আপনাদের দিতে হবে?',
      questionEn: 'Do I need to give you my account password?',
      answerBn: (
        <span>
          <strong className="font-bold text-slate-900">একেবারেই না!</strong> আপনার কোনো পাসওয়ার্ড আমাদের দিতে হবে না। আমরা সরাসরি আপনার ইমেইলে অফিশিয়াল ইনভাইটেশন লিঙ্ক পাঠাবো। আপনার অ্যাকাউন্টের পাসওয়ার্ড ও সিকিউরিটি শতভাগ আপনার নিজের কাছেই গোপন থাকবে।
        </span>
      ),
      answerEn: (
        <span>
          <strong className="font-bold text-slate-900">Absolutely not!</strong> You never need to share any password with us. We send the official invitation link directly to your email. Your account credentials and security remain 100% private to you.
        </span>
      )
    },
    {
      id: 3,
      Icon: Laptop,
      questionBn: 'এটি কি উইন্ডোজ পিসি এবং ম্যাকবুক উভয় ডিভাইসেই কাজ করবে?',
      questionEn: 'Will this work on both Windows PC and MacBook?',
      answerBn: (
        <span>
          জি অবশ্যই! অটোক্যাডের এই অফিশিয়াল এডুকেশন সাবস্ক্রিপশনটি Windows PC এবং MacBook (Mac OS) উভয় অপারেটিং সিস্টেমে অফিশিয়াল অ্যাপস হিসেবে কাজ করবে।
        </span>
      ),
      answerEn: (
        <span>
          Yes, absolutely! This official Autodesk subscription operates as genuine official software across both Windows PC and MacBook (macOS) operating systems.
        </span>
      )
    },
    {
      id: 4,
      Icon: LayoutGrid,
      questionBn: 'অটোক্যাডের পাশাপাশি আর কি কি অ্যাপস অন্তর্ভুক্ত থাকবে?',
      questionEn: 'What other apps are included alongside AutoCAD?',
      answerBn: (
        <span>
          এই সাবস্ক্রিপশনের অধীনে <strong className="font-bold text-slate-900">AutoCAD</strong> এর পাশাপাশি এডুকেশন প্যাকেজের অন্তর্ভুক্ত অন্যান্য সকল প্রয়োজনীয় Autodesk অ্যাপস সম্পূর্ণ অফিশিয়াল লাইসেন্সসহ ডাউনলোড করতে পারবেন।
        </span>
      ),
      answerEn: (
        <span>
          Under this subscription, alongside <strong className="font-bold text-slate-900">AutoCAD</strong>, you can download all other included essential Autodesk software with complete official licensing.
        </span>
      )
    },
    {
      id: 5,
      Icon: Calendar,
      questionBn: 'মেয়াদের বিষয়টি কী রকম? রিনিউ করতে হবে?',
      questionEn: 'How does the duration work? Does it need renewal?',
      answerBn: (
        <span>
          এটি একটি পুরো <strong className="font-bold text-slate-900">১ বছর মেয়াদী</strong> অফিশিয়াল সাবস্ক্রিপশন। ১ বছর মেয়াদের মধ্যে সরাসরি Autodesk থেকে ক্লাউড আপডেট ও সফটওয়্যার সাপোর্ট পাবেন। ১ বছর পর স্বয়ংক্রিয়ভাবে কোনো টাকা কাটবে না।
        </span>
      ),
      answerEn: (
        <span>
          This is a full <strong className="font-bold text-slate-900">1-year</strong> official subscription. Throughout the 1-year validity, you receive direct cloud updates and support from Autodesk. No recurring charges will be deducted automatically after 1 year.
        </span>
      )
    },
    {
      id: 6,
      Icon: Headphones,
      questionBn: 'পেমেন্টের পর যদি সেটআপ করতে সাহায্য লাগে?',
      questionEn: 'What if I need help setting up after payment?',
      answerBn: (
        <span>
          অর্ডারের পরই ইমেইলে সহজ বাংলায় ছবিসহ সম্পূর্ণ Setup Guide পেয়ে যাবেন। এছাড়া যেকোনো কারিগরি সহায়তায় আমাদের সাপোর্ট টিম সার্বক্ষণিক সহায়তা করবে—প্রয়োজনে <strong className="font-bold text-slate-900">AnyDesk / TeamViewer</strong> এর মাধ্যমে ইনস্টল ফিক্সড করে দেওয়া হবে।
        </span>
      ),
      answerEn: (
        <span>
          Immediately after ordering, you will receive a complete Setup Guide with step-by-step screenshots via email. Furthermore, our support team is available around the clock—providing remote installation assistance via <strong className="font-bold text-slate-900">AnyDesk / TeamViewer</strong> if required.
        </span>
      )
    },
    {
      id: 7,
      Icon: UserCheck,
      questionBn: 'এটি কি কোনো শেয়ার্ড আইডি নাকি সম্পূর্ণ আমার নিজের?',
      questionEn: 'Is this a shared ID or completely my own?',
      answerBn: (
        <span>
          এটি সম্পূর্ণ <strong className="font-bold text-slate-900">আপনার নিজের পার্সোনাল Autodesk অ্যাকাউন্ট</strong>। কোনো থার্ডপার্টি শেয়ার্ড আইডি নয়। আপনার সমস্ত ফাইল, ড্রয়িং ও লাইসেন্স আপনার নিজস্ব অ্যাকাউন্টের অধীনেই থাকবে।
        </span>
      ),
      answerEn: (
        <span>
          This is completely <strong className="font-bold text-slate-900">your own personal Autodesk account</strong>. Not a third-party shared login. All your project files, drawings, and licenses remain strictly under your personal account.
        </span>
      )
    },
    {
      id: 8,
      Icon: HardDrive,
      questionBn: '১ বছর মেয়াদ শেষ হলে আমার ড্রয়িং ফাইল (.dwg) গুলোর কী হবে?',
      questionEn: 'What happens to my drawing files (.dwg) after the 1-year term ends?',
      answerBn: (
        <span>
          <strong className="font-bold text-slate-900">আপনার কোনো ডিজাইন বা ড্রয়িং ফাইল মুছে যাবে না!</strong> আপনার পিসির ড্রাইভের সকল `.dwg` প্রজেক্ট ফাইল আপনার নিজস্ব পিসিতেই শতভাগ সুরক্ষিত থাকবে। মেয়াদের পর ফাইল কারাপ্ট হওয়া বা মুছে যাওয়ার কোনো সুযোগ নেই।
        </span>
      ),
      answerEn: (
        <span>
          <strong className="font-bold text-slate-900">None of your design or drawing files will ever be deleted!</strong> All `.dwg` project files stored on your local PC drive remain 100% safe on your computer. There is zero possibility of files becoming corrupted or deleted after the term.
        </span>
      )
    }
  ];

  return (
    <section id="faq-doubts" className="py-16 md:py-24 relative bg-slate-50 border-t border-slate-200 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug flex items-center justify-center gap-2 flex-wrap">
            <span>{lang === 'bn' ? 'আপনার মনেও কি এই প্রশ্নগুলো ঘুরছে?' : 'Are These Questions on Your Mind Too?'}</span>
            <span className="text-2xl sm:text-3xl">🧐</span>
          </h2>
          
          {/* Dual-color Accent Line (Blue Left, Red Right) */}
          <div className="w-16 h-1 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-rose-500 mx-auto mt-3 mb-3"></div>

          <p className="text-xs sm:text-sm md:text-base font-medium text-slate-600 leading-relaxed">
            {lang === 'bn'
              ? 'অর্ডারের আগেই আপনার সকল দ্বিধা দূর করে নিন এখান থেকে'
              : 'Clear all your doubts right here before placing an order'}
          </p>
        </div>

        {/* 8-Card Pre-Order Doubts Grid (Image 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch mb-8 sm:mb-10">
          {doubtsList.map((item) => {
            const IconComponent = item.Icon;
            return (
              <div
                key={item.id}
                className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-start"
              >
                {/* Question Header */}
                <div className="flex items-start gap-3 mb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {lang === 'bn' ? item.questionBn : item.questionEn}
                  </h3>
                </div>

                {/* Answer with Vertical Emerald Line */}
                <div className="border-l-2 border-emerald-500 pl-3.5 ml-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {lang === 'bn' ? item.answerBn : item.answerEn}
                </div>
              </div>
            );
          })}
        </div>

        {/* CALLOUT 1: Why Official vs Facebook Pirated Sellers vs Our Platform (Image 2 Top) */}
        <div className="rounded-2xl sm:rounded-3xl border-2 border-purple-400 bg-white p-6 sm:p-8 md:p-10 shadow-xs mb-6 transition-all hover:shadow-md">
          
          {/* Header */}
          <div className="flex items-start sm:items-center gap-3 mb-3 pb-3 border-b border-purple-100">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 leading-snug">
              {lang === 'bn'
                ? 'অফিশিয়াল সাইটে দাম এতো বেশি, আবার ফেসবুকে অনেকে কম দামে দেয়— আপনাদের সার্ভিস কেন সেরা?'
                : 'Why is the official site price so high, while sellers on Facebook offer it cheap—why is our service the best?'}
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 mb-4 font-medium italic">
            {lang === 'bn'
              ? 'ক্যাড সফটওয়্যার সাবস্ক্রিপশন নেওয়ার ক্ষেত্রে ৩টি বাস্তব সত্য জেনে নেওয়া জরুরি:'
              : 'When getting a CAD software subscription, it is essential to understand 3 real facts:'}
          </p>

          {/* 3 Reality Truths with Purple Left Accent */}
          <div className="border-l-2 border-purple-400 pl-4 ml-1 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            
            {/* Truth 1: Official Autodesk Website */}
            <div>
              <p className="font-bold text-slate-900 mb-0.5">
                {lang === 'bn' ? '🔴 ১. অফিশিয়াল অটোডেস্ক ওয়েবসাইট (autodesk.com):' : '🔴 1. Official Autodesk Website (autodesk.com):'}
              </p>
              <p className="text-slate-600">
                {lang === 'bn' ? (
                  <span>
                    অটোডেস্কের অফিশিয়াল ওয়েবসাইটে এই সাবস্ক্রিপশনের মূল্য বছরে <strong className="font-bold text-slate-900">$1,865 (প্রায় ২ লাখ ২৫ হাজার+ টাকা)</strong>। সাধারণ স্টুডেন্ট, ইঞ্জিনিয়ার বা ফ্রিল্যান্সারদের জন্য এই বিশাল টাকা দিয়ে সাবস্ক্রিপশন নেওয়া প্রায় অসম্ভব।
                  </span>
                ) : (
                  <span>
                    On the official Autodesk website, this subscription costs <strong className="font-bold text-slate-900">$1,865/year (approx. 225,000+ BDT)</strong>. For general students, engineers, or freelancers, paying this massive amount is virtually out of reach.
                  </span>
                )}
              </p>
            </div>

            {/* Truth 2: Facebook Cheap Sellers */}
            <div>
              <p className="font-bold text-slate-900 mb-0.5">
                {lang === 'bn' ? '⚠️ ২. ফেসবুকে ৩০০-৫০০ টাকার অনিরাপদ ক্র্যাক/পাইরেটেড ফাইল:' : '⚠️ 2. Unsafe Cracked/Pirated Files on Facebook for 300-500 BDT:'}
              </p>
              <p className="text-slate-600">
                {lang === 'bn' ? (
                  <span>
                    কম দাম দেখে কিনে কিছুদিন ব্যবহার করার পর "License Cancelled" হয়ে সফটওয়্যার বন্ধ হয়ে যায় এবং কিছুদিন পর ওই সেলারদের আর খুঁজে পাওয়া যায় না। এছাড়া Keygen ভাইরাসে পিসির ক্যাড ফাইল (.dwg) ও ব্যাংক পাসওয়ার্ড হ্যাকিংয়ের মারাত্মক ঝুঁকি থাকে।
                  </span>
                ) : (
                  <span>
                    Lured by ultra-cheap prices, users purchase these only to have "License Cancelled" pop-ups terminate their access within days, and those sellers vanish. Furthermore, Keygen viruses pose lethal risks of encrypting CAD files (.dwg) and stealing bank credentials.
                  </span>
                )}
              </p>
            </div>

            {/* Truth 3: Our Platform */}
            <div>
              <p className="font-bold text-slate-900 mb-0.5">
                {lang === 'bn' ? '✅ ৩. আমাদের প্ল্যাটফর্ম (১০০% অফিশিয়াল Own Email সার্ভিস):' : '✅ 3. Our Platform (100% Official Own Email Service):'}
              </p>
              <p className="text-slate-600">
                {lang === 'bn' ? (
                  <span>
                    আমরা অফিশিয়াল ইনভাইটেশনের মাধ্যমে সরাসরি <strong className="font-bold text-slate-900">আপনার নিজস্ব পার্সোনাল ইমেইলে</strong> সাবস্ক্রিপশন চালু করে দেই। অফিশিয়াল ২ লাখ টাকার সাবস্ক্রিপশন আমাদের অফার মূল্যে মাত্র <strong className="font-bold text-slate-900">৳649</strong> (১ বছর / ২ বছর ৳1,149 / ৩ বছর ৳1,749) এ পাচ্ছেন, সাথে পাচ্ছেন <strong className="font-bold text-slate-900">পূর্ণ মেয়াদের রিপ্লেসমেন্ট ওয়ারেন্টি</strong> ও ২৪/৭ টেকনিক্যাল সাপোর্ট। সার্ভিস বন্ধ হওয়া বা সেলার হারিয়ে যাওয়ার কোনো সুযোগ নেই।
                  </span>
                ) : (
                  <span>
                    We activate the subscription directly on <strong className="font-bold text-slate-900">your own personal email</strong> via official invitation. You get the 200,000 BDT official subscription at our offer price starting from <strong className="font-bold text-slate-900">649 BDT</strong> (1 Year / 2 Years 1,149 BDT / 3 Years 1,749 BDT), backed by a <strong className="font-bold text-slate-900">full replacement warranty</strong> and 24/7 technical assistance. Zero risk of cancellation or disappearing sellers.
                  </span>
                )}
              </p>
            </div>

          </div>

          {/* Lightbulb Wisdom Bottom Banner */}
          <div className="mt-5 p-3.5 sm:p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-start gap-2.5 text-xs sm:text-sm text-purple-950 leading-relaxed font-medium">
            <span className="text-base flex-shrink-0">💡</span>
            <span>
              {lang === 'bn'
                ? 'সাময়িক সামান্য কিছু টাকা বাঁচাতে গিয়ে কাজের মূল্যবান ড্রয়িং ফাইল নষ্ট করা বা ভূয়া সেলারের প্রতারণায় না পড়ে অরিজিনাল অফিশিয়াল ইনভাইটেশন নেওয়াই শতভাগ বুদ্ধিমানের কাজ।'
                : 'Instead of risking valuable project drawing files to save a temporary small amount or falling victim to fake seller scams, getting a genuine official invitation is 100% the wisest decision.'}
            </span>
          </div>

        </div>

        {/* CALLOUT 2: Transparent & Safe Buying Assurance (Image 2 Bottom) */}
        <div className="rounded-2xl sm:rounded-3xl border-2 border-purple-400 bg-white p-5 sm:p-7 shadow-xs">
          
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4 text-slate-900 font-bold text-sm sm:text-base">
            <ShieldAlert className="w-5 h-5 text-purple-700 flex-shrink-0" />
            <span>
              {lang === 'bn'
                ? 'স্বচ্ছ ও নিরাপদ কেনাকাটার নিশ্চয়তা (জরুরি নির্দেশনা):'
                : 'Assurance of Transparent & Secure Purchase (Essential Guidelines):'}
            </span>
          </div>

          {/* 3 Guidelines */}
          <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold text-xs mt-0.5">▶</span>
              <div>
                <strong className="font-bold text-slate-900">
                  {lang === 'bn' ? '১. সঠিক ইমেইল প্রদান করুন:' : '1. Provide Correct Email:'}
                </strong>{' '}
                {lang === 'bn'
                  ? 'অর্ডার ফর্মে আপনার যে ইমেইল ইনপুট দেবেন, সরাসরি সেই ইমেইলেই Autodesk ইনভাইটেশন লিঙ্ক পাঠানো হবে।'
                  : 'The email address you input in the order form will directly receive the official Autodesk invitation link.'}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold text-xs mt-0.5">▶</span>
              <div>
                <strong className="font-bold text-slate-900">
                  {lang === 'bn' ? '২. অফিশিয়াল সাইট থেকে ডাউনলোড:' : '2. Download from Official Site:'}
                </strong>{' '}
                {lang === 'bn'
                  ? 'কোনো থার্ডপার্টি বা ড্রাইভ লিংক নয়— সরাসরি autodesk.com এর অফিশিয়াল ড্যাশবোর্ড থেকে অটোক্যাড ডাউনলোড করবেন।'
                  : 'No third-party or cloud drive links—download AutoCAD directly from your official dashboard on autodesk.com.'}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold text-xs mt-0.5">▶</span>
              <div>
                <strong className="font-bold text-slate-900">
                  {lang === 'bn' ? '৩. Keygen/ক্র্যাক আনইন্সটল:' : '3. Uninstall Keygen/Cracks:'}
                </strong>{' '}
                {lang === 'bn'
                  ? 'পিসিতে পূর্বে থেকে কোনো ক্র্যাকড অটোক্যাড বা Keygen ফাইল থাকলে অরিজিনাল ইনস্টলের আগে তা রিমুভ করা শ্রেয়।'
                  : 'If you previously had any cracked AutoCAD or Keygen files on your PC, it is recommended to remove them completely before installing the genuine software.'}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

