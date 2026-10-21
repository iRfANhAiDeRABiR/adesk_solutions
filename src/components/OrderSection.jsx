import React, { useState } from 'react';
import SectionHeading from './common/SectionHeading';
import { autodeskAllAppsPlans } from '../data/autodeskData';
import { useLanguage } from '../context/LanguageContext';
import { BkashLogo, NagadLogo, RocketLogo } from './common/PaymentLogos';
import { AutoCadLogo, AutodeskLogo, AutodeskBrandBadge } from './common/AutodeskLogos';
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  ShieldCheck,
  Sparkles,
  Tag,
  X
} from 'lucide-react';
import { trackInitiateCheckout } from '../services/pixelService';

export default function OrderSection() {
  const {
    lang,
    t,
    selectedProduct,
    setSelectedProduct,
    selectedDuration,
    setSelectedDuration,
    startPayment
  } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('Bkash');
  const [requirements, setRequirements] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Secret Coupon Code state (SAVE10 for 10% discount, not displayed in UI)
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // 'SAVE10' | null
  const [couponError, setCouponError] = useState('');

  // The 3 simplified Autodesk All Apps duration options requested by user
  const planOptions = autodeskAllAppsPlans;

  // Resolve currently active plan from selectedDuration or selectedProduct
  const currentPlan = planOptions.find(
    (p) => p.duration === selectedDuration ||
           p.id === selectedDuration ||
           p.name === selectedProduct?.name ||
           p.nameBn === selectedProduct?.name ||
           p.id === selectedProduct?.id ||
           (selectedProduct?.duration && p.duration === selectedProduct.duration)
  ) || planOptions[0];

  const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
  const baseTotalPrice = currentPlan.price * parsedQty;
  const discountPercent = (appliedCoupon === 'SAFE10' || appliedCoupon === 'SAVE10') ? 0.10 : 0;
  const discountAmount = Math.round(baseTotalPrice * discountPercent);
  const finalTotalPrice = baseTotalPrice - discountAmount;
  const finalUnitPrice = Math.round(finalTotalPrice / parsedQty);
  const totalPriceDisplay = `৳ ${finalTotalPrice.toLocaleString()}`;

  // Coupon apply and remove handlers
  const handleApplyCoupon = (e) => {
    if (e) e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError(lang === 'bn' ? 'কুপন কোড লিখুন' : 'Please enter a coupon code');
      return;
    }
    if (cleanCode === 'SAFE10' || cleanCode === 'SAVE10') {
      setAppliedCoupon(cleanCode);
      setCouponError('');
    } else {
      setCouponError(lang === 'bn' ? 'ভুল বা মেয়াদোত্তীর্ণ কুপন কোড' : 'Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const paymentMethodsConfig = [
    {
      id: "Bkash",
      label: "Bkash",
      labelBn: "বিকাশ",
      Icon: BkashLogo,
      instructions: lang === 'bn' ? "বিকাশ অ্যাপ বা *২৪৭# থেকে Send Money বা Payment করুন" : "Send Money / Payment via bKash App or dial *247#"
    },
    {
      id: "Nagad",
      label: "Nagad",
      labelBn: "নগদ",
      Icon: NagadLogo,
      instructions: lang === 'bn' ? "নগদ অ্যাপ বা *১৬৭# ডায়াল করে Send Money করুন" : "Send Money via Nagad App or dial *167#"
    },
    {
      id: "Rocket",
      label: "Rocket",
      labelBn: "রকেট",
      Icon: RocketLogo,
      instructions: lang === 'bn' ? "রকেট অ্যাপ বা *৩২২# ডায়াল করে Send Money করুন" : "Send Money via Rocket App or dial *322#"
    }
  ];

  const handlePlanSelect = (plan) => {
    setSelectedDuration(plan.duration);
    setSelectedProduct(plan);
  };

  const handlePlanChangeById = (planId) => {
    const found = planOptions.find((p) => p.id === planId);
    if (found) {
      handlePlanSelect(found);
    }
  };

  const handleDurationChange = (dur) => {
    const found = planOptions.find((p) => p.duration === dur);
    if (found) {
      handlePlanSelect(found);
    } else {
      setSelectedDuration(dur);
    }
  };

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) {
      errs.fullName = lang === 'bn' ? 'দয়া করে আপনার নাম লিখুন' : 'Full name is required';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = lang === 'bn' ? 'সঠিক ইমেইল দিন (এখানে সাবস্ক্রিপশন পাঠানো হবে)' : 'Valid delivery email is required';
    }
    if (!phone.trim() || phone.length < 9) {
      errs.phone = lang === 'bn' ? 'সঠিক ফোন বা হোয়াটসঅ্যাপ নম্বর দিন' : 'Valid phone or WhatsApp number is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Security input sanitization
      const cleanName = fullName.trim().replace(/[<>]/g, '').slice(0, 80);
      const cleanEmail = email.trim().replace(/[<>]/g, '').slice(0, 100);
      const cleanPhone = phone.trim().replace(/[^0-9+\s-]/g, '').slice(0, 25);
      const cleanReq = requirements ? requirements.trim().replace(/[<>]/g, '').slice(0, 300) : '';

      const generatedRef = `SOFT-ATD-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderPayload = {
        refId: generatedRef,
        product: 'Autodesk All Apps',
        planFullName: lang === 'bn' ? currentPlan.nameBn : currentPlan.name,
        duration: currentPlan.duration,
        quantity: parsedQty,
        paymentMethod: paymentMethod,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        unitPrice: `৳ ${finalUnitPrice.toLocaleString()}`,
        totalPrice: totalPriceDisplay,
        rawPrice: finalTotalPrice.toLocaleString(),
        basePrice: `৳ ${baseTotalPrice.toLocaleString()}`,
        couponApplied: appliedCoupon || null,
        discountAmount: appliedCoupon ? `৳ ${discountAmount.toLocaleString()}` : null,
        requirements: cleanReq
      };
      setIsSubmitting(false);
      trackInitiateCheckout(orderPayload);
      startPayment(orderPayload);
    }, 400);
  };

  return (
    <section id="order" className="py-16 md:py-24 relative bg-slate-50 border-t border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="Order Processing"
          title={t.order.heading}
          subtitle={t.order.subtitle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: Selected Product & Summary (5 Cols) */}
          <div className="lg:col-span-5 rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl relative flex flex-col justify-between h-full">
            <div>
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {t.order.summaryTitle}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {lang === 'bn' ? currentPlan.badgeBn : currentPlan.badge}
              </span>
            </div>

            {/* Modern AutoCAD / Autodesk Brand Badge */}
            <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-slate-50 via-red-50/25 to-slate-50 border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AutoCadLogo className="w-10 h-10 flex-shrink-0 drop-shadow-sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AutodeskLogo className="h-4 w-auto text-slate-900" />
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-100 text-red-700 tracking-wider">
                      AutoCAD Suite
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    AutoCAD &bull; Revit &bull; 3ds Max &bull; Maya &bull; 47+ Apps
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Official</span>
              </div>
            </div>

            {/* Selected Category Highlight */}
            <div className="mb-6">
              <span className="text-xs text-slate-500 block mb-1 font-medium">
                {t.order.selectedProductLabel}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {lang === 'bn' ? "Autodesk All Apps (All 47+ Professional Apps)" : "Autodesk All Apps (All 47+ Professional Apps)"}
              </h3>
              <p className="text-xs text-blue-600 mt-1.5 leading-relaxed font-medium">
                {lang === 'bn' ? currentPlan.taglineBn : currentPlan.tagline}
              </p>
            </div>

            {/* Duration Selector Buttons: 1 Year (699), 2 Years (1249), 3 Years (1849) */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                {t.order.selectedDurationLabel}
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {planOptions.map((plan) => {
                  const isSelected = currentPlan.duration === plan.duration;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan)}
                      className={`py-2.5 px-2 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md font-bold'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300 font-medium'
                      }`}
                    >
                      <div className="text-xs font-bold">{lang === 'bn' ? plan.durationBn : plan.duration}</div>
                      <div className={`text-[10px] mt-0.5 font-mono ${isSelected ? 'text-blue-100 font-bold' : 'text-slate-500'}`}>
                        ৳ {plan.price.toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coupon / Promo Code Input (SAVE10 for 10% discount, code not printed in UI) */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'bn' ? 'কুপন বা প্রোমো কোড' : 'Coupon / Promo Code'}</span>
                </span>
                {appliedCoupon && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full animate-in fade-in">
                    10% DISCOUNT APPLIED
                  </span>
                )}
              </label>

              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        if (couponError) setCouponError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder={lang === 'bn' ? "কুপন কোড লিখুন" : "Enter coupon code"}
                      className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 transition-colors placeholder:text-slate-400 placeholder:normal-case placeholder:font-sans"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-blue-600 text-white transition-all shadow-xs"
                  >
                    {lang === 'bn' ? 'প্রয়োগ' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-[11px]">
                        {lang === 'bn' ? '১০% ডিসকাউন্ট সফলভাবে যুক্ত হয়েছে!' : '10% Discount Applied!'}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-mono">
                        -৳ {discountAmount.toLocaleString()} saved
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors text-[11px] font-bold flex items-center gap-1"
                    title="Remove coupon"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'বাতিল' : 'Remove'}</span>
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{couponError}</span>
                </p>
              )}
            </div>

            {/* Estimated Price Display */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {t.order.summaryPriceLabel}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {totalPriceDisplay}
                  </span>
                  {appliedCoupon && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ৳ {baseTotalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono font-semibold text-slate-700 block">
                  {parsedQty} Seat(s) • {currentPlan.duration}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  ৳ {finalUnitPrice.toLocaleString()} / seat
                </span>
              </div>
            </div>

            </div>

            {/* Assurance Bullet Points (Anchored to bottom for equal box height) */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Fast digital delivery on your own email</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>All 47+ official Autodesk applications unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Full {currentPlan.duration} instant replacement warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Dedicated remote setup and installation guidance</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Official Autodesk Invitation &amp; Cloud Storage</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Form (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl flex flex-col justify-between h-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <span>{t.order.formTitle}</span>
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              Please enter your details below. Our team will verify your subscription request and contact you directly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Package Select Dropdown (Strictly Only the 3 Autodesk All Apps Options) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t.order.productSelectLabel} *
                </label>
                <select
                  value={currentPlan.id}
                  onChange={(e) => handlePlanChangeById(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-colors"
                >
                  {planOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {lang === 'bn' ? plan.nameBn : plan.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    {t.order.fullName} *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: null });
                    }}
                    placeholder={t.order.fullNamePlaceholder}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:bg-white transition-colors ${
                      errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.fullName && (
                    <span className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.fullName}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    {t.order.phone} *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: null });
                    }}
                    placeholder={t.order.phonePlaceholder}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:bg-white transition-colors ${
                      errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.phone && (
                    <span className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Email Address */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t.order.email} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  placeholder={t.order.emailPlaceholder}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:bg-white transition-colors ${
                    errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.email && (
                  <span className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </span>
                )}
              </div>

              {/* Duration & Quantity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    {t.order.durationSelectLabel}
                  </label>
                  <select
                    value={currentPlan.duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  >
                    <option value="1 Year">{lang === 'bn' ? '১ বছর (1 Year - 699 BDT)' : '1 Year Subscription (699 BDT)'}</option>
                    <option value="2 Years">{lang === 'bn' ? '২ বছর (2 Years - 1249 BDT)' : '2 Years Subscription (1249 BDT)'}</option>
                    <option value="3 Years">{lang === 'bn' ? '৩ বছর (3 Years - 1849 BDT)' : '3 Years Subscription (1849 BDT)'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    {t.order.quantityLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Payment Method Options (Verified Online Vector Logos) */}
              <div>
                <label className="text-xs font-mono font-bold tracking-wider text-slate-700 block mb-2.5">
                  PAYMENT METHOD *
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {paymentMethodsConfig.map((item) => {
                    const isSelected = paymentMethod === item.id;
                    const IconComponent = item.Icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPaymentMethod(item.id)}
                        className={`flex items-center justify-center gap-2 py-3 px-2 sm:px-3 rounded-2xl border transition-all duration-200 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                        <span className={`text-xs sm:text-sm font-extrabold tracking-tight ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Helpful Instruction Snippet */}
                <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>
                    {paymentMethodsConfig.find((m) => m.id === paymentMethod)?.instructions}
                  </span>
                  <span className="font-mono text-blue-600 font-bold ml-2">
                    {paymentMethod}
                  </span>
                </div>
              </div>

              {/* Additional Requirements */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t.order.requirementsLabel}
                </label>
                <textarea
                  rows="2"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder={t.order.requirementsPlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-colors"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 text-white shadow-md hover:brightness-105 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.order.processing}</span>
                  </div>
                ) : (
                  <span>{t.order.submitBtn}</span>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
