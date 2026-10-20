import React, { useState, useEffect, useRef } from 'react';
import { BkashLogo, NagadLogo, RocketLogo } from '../common/PaymentLogos';
import {
  sendOrderToTelegram,
  autoDetectAdminChatId,
  getAdminChatId,
  setAdminChatId,
  checkOrderStatusFromTelegram
} from '../../services/telegramService';
import {
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  PhoneCall,
  Check,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Send,
  Bell,
  RefreshCw,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { trackAddPaymentInfo, trackPurchase, trackContact, getBrowserFbpCookie, getBrowserFbcCookie } from '../../services/pixelService';

export default function PaymentGatewayPage({ order, onCancel }) {
  const method = order?.paymentMethod || 'Bkash'; // 'Bkash' | 'Nagad' | 'Rocket'

  // Gateway Configurations
  const gatewayInfo = {
    Bkash: {
      name: "bKash",
      receiverNumber: "01641699879",
      helpline: "16247",
      ussdCode: "*247#",
      themeColor: "#e2136e",
      themeGradient: "from-[#e2136e] via-[#c7095b] to-[#990044]",
      accentBg: "bg-[#e2136e]",
      buttonBg: "bg-[#e2136e] hover:bg-[#c7095b]",
      LogoComponent: BkashLogo
    },
    Nagad: {
      name: "Nagad",
      receiverNumber: "01641699879",
      helpline: "16167",
      ussdCode: "*167#",
      themeColor: "#a31414",
      themeGradient: "from-[#990000] via-[#7d0000] to-[#500000]",
      accentBg: "bg-[#a31414]",
      buttonBg: "bg-white text-[#990000] hover:bg-slate-100",
      LogoComponent: NagadLogo
    },
    Rocket: {
      name: "Rocket",
      receiverNumber: "015189028225",
      helpline: "16216",
      ussdCode: "*322#",
      themeColor: "#8c2282",
      themeGradient: "from-[#8c2282] via-[#6f1567] to-[#4a0845]",
      accentBg: "bg-[#8c2282]",
      buttonBg: "bg-[#8c2282] hover:bg-[#6f1567] text-white",
      LogoComponent: RocketLogo
    }
  };

  const currentGateway = gatewayInfo[method] || gatewayInfo.Bkash;

  // Step state: 1 = Sender Number, 2 = Send Money & Enter TrxID, 3 = Pending Verification Summary
  const [step, setStep] = useState(1);
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  
  // Telegram Bot integration state
  const [telegramStatus, setTelegramStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'no_chat_id' | 'failed'
  const [isDetectingChatId, setIsDetectingChatId] = useState(false);
  const [customChatId, setCustomChatId] = useState(getAdminChatId());

  // Real-time verification status from Telegram Bot ('PENDING' | 'CONFIRMED' | 'INVALID')
  const [activeRefId, setActiveRefId] = useState(order?.refId || '');
  const [verificationStatus, setVerificationStatus] = useState('PENDING');
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [isCheckingLive, setIsCheckingLive] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Active refs for interval timers and status tracking
  const lastSubmittedPayloadRef = useRef(null);
  const verificationStatusRef = useRef('PENDING');
  verificationStatusRef.current = verificationStatus;
  const reminderTimerRef = useRef(null);
  const hasTrackedPurchaseRef = useRef(false);

  const handleSafeCancel = () => {
    try {
      localStorage.removeItem('softwaresolutions_last_submission');
    } catch (e) {}
    if (onCancel) onCancel();
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToStep2 = (e) => {
    if (e) e.preventDefault();
    const cleanNum = senderNumber.replace(/\D/g, '');
    if (cleanNum.length !== 11 || !cleanNum.startsWith('01')) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }
    if (!agreeTerms) {
      setError('শর্তাবলী ও নিয়মাবলীতে সম্মত হতে হবে');
      return;
    }
    setError('');
    trackAddPaymentInfo(method);
    setStep(2);
  };

  // Step 2 Validation -> Send to Telegram Bot & Proceed to Step 3
  const handleConfirmTrx = async (e) => {
    if (e) e.preventDefault();
    const cleanTrx = trxId.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 30).toUpperCase();
    const cleanSender = senderNumber.trim().replace(/[^0-9+\s-]/g, '').slice(0, 20);

    // Strict TrxID Validation per Payment Method
    if (method === 'Bkash') {
      if (!cleanTrx.startsWith('DJ')) {
        setError('অবৈধ bKash TrxID! বিকাশ ট্রানজেকশন আইডি অবশ্যই DJ দিয়ে শুরু হতে হবে (যেমন: DJXXXXXXXX)।');
        return;
      }
      if (cleanTrx.length !== 10) {
        setError(`সঠিক ১০ অক্ষরের bKash TrxID দিন (যেমন: DJXXXXXXXX)। আপনি ${cleanTrx.length} অক্ষর দিয়েছেন।`);
        return;
      }
      if (!/^DJ[A-Z0-9]{8}$/.test(cleanTrx)) {
        setError('bKash TrxID শুধুমাত্র ইংরেজি বর্ণ ও সংখ্যা দিয়ে গঠিত হতে হবে।');
        return;
      }
    } else if (method === 'Nagad') {
      if (cleanTrx.length < 8 || cleanTrx.length > 12) {
        setError('দয়া করে সঠিক নগদ Transaction ID (TrxID) লিখুন (সাধারণত ৮ অক্ষরের হয়)।');
        return;
      }
    } else {
      // Rocket or fallback
      if (!cleanTrx || cleanTrx.length < 6 || cleanTrx.length > 12) {
        setError('দয়া করে সঠিক রকেট Transaction ID (TrxID) লিখুন (৬ থেকে ১২ অক্ষর)।');
        return;
      }
    }
    setError('');

    const targetRef = activeRefId || order?.refId || `SOFT-ATD-${Math.floor(100000 + Math.random() * 900000)}`;
    if (!activeRefId) setActiveRefId(targetRef);

    // Prepare complete sanitized payload ready for Telegram Bot
    const customerPayload = {
      refId: targetRef,
      name: (order?.name || '').replace(/[<>]/g, '').slice(0, 80),
      email: (order?.email || '').replace(/[<>]/g, '').slice(0, 100),
      phone: (order?.phone || '').replace(/[^0-9+\s-]/g, '').slice(0, 25),
      product: order?.product || "Autodesk All Apps",
      duration: order?.duration || "1 Year",
      quantity: order?.quantity || 1,
      totalPrice: order?.totalPrice || "৳ 649",
      rawPrice: order?.rawPrice || order?.totalPrice || "649",
      paymentMethod: method,
      senderNumber: cleanSender,
      receiverNumber: currentGateway.receiverNumber,
      trxId: cleanTrx,
      status: "PENDING_VERIFICATION",
      submittedAt: new Date().toISOString(),
      fbp: getBrowserFbpCookie(),
      fbc: getBrowserFbcCookie(),
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : 'https://adesk.solutionsbd.com/#payment'
    };

    // Store in localStorage for status lookup / persistence
    try {
      localStorage.setItem('softwaresolutions_last_submission', JSON.stringify(customerPayload));
    } catch (err) {
      console.warn("Storage error", err);
    }

    // Cache in memory ref for recurring reminders
    lastSubmittedPayloadRef.current = customerPayload;
    verificationStatusRef.current = 'PENDING';

    // Note: AddPaymentInfo milestone was tracked when selecting gateway and entering phone
    // Purchase event is strictly deferred until administrator verification is confirmed
    setVerificationStatus('PENDING');
    setStep(3);

    // Send order to backend API / Telegram Bot automatically
    setTelegramStatus('sending');
    const teleRes = await sendOrderToTelegram(customerPayload);
    if (teleRes.success) {
      const confirmedRef = teleRes.refId || targetRef;
      setActiveRefId(confirmedRef);
      if (lastSubmittedPayloadRef.current) {
        lastSubmittedPayloadRef.current.refId = confirmedRef;
      }
      setTelegramStatus('sent');
    } else if (teleRes.reason === 'DUPLICATE_TRX_ID') {
      setTelegramStatus('failed');
      setStep(2);
      setError('এই ট্রানজেকশন আইডি (TrxID) ইতিপূর্বে ব্যবহার করা হয়েছে। অনুগ্রহ করে আপনার নতুন ও সঠিক TrxID লিখুন।');
      return;
    } else if (teleRes.reason === 'NO_CHAT_ID') {
      setTelegramStatus('no_chat_id');
    } else {
      setTelegramStatus('failed');
    }
  };

  // Live polling for admin confirmation from Telegram Bot when on Step 3
  useEffect(() => {
    if (step !== 3) return;
    const ref = activeRefId || order?.refId;
    if (!ref) return;

    let isMounted = true;

    const performStatusCheck = async () => {
      try {
        setIsCheckingLive(true);
        const res = await checkOrderStatusFromTelegram(ref);
        if (isMounted) {
          setLastCheckTime(new Date());
          if (res && (res.status === 'CONFIRMED' || res.status === 'INVALID')) {
            setVerificationStatus(res.status);
            verificationStatusRef.current = res.status;
            setVerificationDetails(res);

            // Verified Purchase Tracking: Meta Pixel Purchase event fires ONLY after administrator confirmation
            if (res.status === 'CONFIRMED' && !hasTrackedPurchaseRef.current) {
              hasTrackedPurchaseRef.current = true;
              trackPurchase({
                ...(lastSubmittedPayloadRef.current || order),
                purchaseEventId: res.purchaseEventId,
                totalPrice: res.totalPrice || (lastSubmittedPayloadRef.current || order)?.totalPrice,
                product: res.product || (lastSubmittedPayloadRef.current || order)?.product,
                quantity: res.quantity || (lastSubmittedPayloadRef.current || order)?.quantity
              }, { eventID: res.purchaseEventId });
              try {
                localStorage.removeItem('softwaresolutions_last_submission');
              } catch (e) {}
            }

            if (reminderTimerRef.current) {
              clearInterval(reminderTimerRef.current);
              reminderTimerRef.current = null;
            }
          }
        }
      } catch (e) {
        console.error("Live status check error:", e);
      } finally {
        if (isMounted) setIsCheckingLive(false);
      }
    };

    // Immediate initial check
    performStatusCheck();

    // Poll every 2.5 seconds while waiting on Step 3
    const interval = setInterval(performStatusCheck, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [step, activeRefId, order?.refId]);

  // Recurring reminder: If no action (Confirm/Invalid) is taken on Telegram, resend alert every 15s for up to 2 mins
  useEffect(() => {
    // Only run on Step 3 and while status is PENDING
    if (step !== 3 || verificationStatus !== 'PENDING') {
      if (reminderTimerRef.current) {
        clearInterval(reminderTimerRef.current);
        reminderTimerRef.current = null;
      }
      return;
    }

    const ref = activeRefId || order?.refId;
    if (!ref) return;

    let reminderCount = 0;
    const maxReminders = 8; // 8 * 15s = 120s (2 minutes)
    const reminderIntervalMs = 15000; // 15 seconds

    console.log(`⏱️ [Telegram Reminder Service Started] Waiting for admin action on order #${ref}. Will remind every 15s for up to 2 mins.`);

    if (reminderTimerRef.current) {
      clearInterval(reminderTimerRef.current);
    }

    reminderTimerRef.current = setInterval(async () => {
      // 1. If admin confirmed or marked invalid, stop reminders immediately
      if (verificationStatusRef.current !== 'PENDING') {
        console.log(`✅ [Telegram Reminder Stopped] Order status is ${verificationStatusRef.current}`);
        if (reminderTimerRef.current) {
          clearInterval(reminderTimerRef.current);
          reminderTimerRef.current = null;
        }
        return;
      }

      // 2. Check live status from Telegram before sending reminder
      try {
        const liveCheck = await checkOrderStatusFromTelegram(ref);
        if (liveCheck && (liveCheck.status === 'CONFIRMED' || liveCheck.status === 'INVALID')) {
          setVerificationStatus(liveCheck.status);
          verificationStatusRef.current = liveCheck.status;
          setVerificationDetails(liveCheck);

          if (liveCheck.status === 'CONFIRMED' && !hasTrackedPurchaseRef.current) {
            hasTrackedPurchaseRef.current = true;
            trackPurchase({
                ...(lastSubmittedPayloadRef.current || order),
                purchaseEventId: liveCheck.purchaseEventId,
                totalPrice: liveCheck.totalPrice || (lastSubmittedPayloadRef.current || order)?.totalPrice,
                product: liveCheck.product || (lastSubmittedPayloadRef.current || order)?.product,
                quantity: liveCheck.quantity || (lastSubmittedPayloadRef.current || order)?.quantity
              }, { eventID: liveCheck.purchaseEventId });
            try {
              localStorage.removeItem('softwaresolutions_last_submission');
            } catch (e) {}
          }

          if (reminderTimerRef.current) {
            clearInterval(reminderTimerRef.current);
            reminderTimerRef.current = null;
          }
          return;
        }
      } catch (err) {
        console.warn("Live status check before reminder encountered error:", err);
      }

      // 3. If max 2 minutes elapsed (8 reminders), stop
      if (reminderCount >= maxReminders) {
        console.log(`🛑 [Telegram Reminder Ended] 2 minutes limit reached for order #${ref}`);
        if (reminderTimerRef.current) {
          clearInterval(reminderTimerRef.current);
          reminderTimerRef.current = null;
        }
        return;
      }

      // 4. Resolve order payload from memory ref, localStorage, or fallback
      const payload = lastSubmittedPayloadRef.current || (() => {
        try {
          const saved = localStorage.getItem('softwaresolutions_last_submission') || localStorage.getItem('ecosafeguard_last_submission');
          return saved ? JSON.parse(saved) : null;
        } catch (e) {
          return null;
        }
      })() || {
        refId: ref,
        name: order?.name || 'Customer',
        email: order?.email || '',
        phone: senderNumber || order?.phone || '',
        product: order?.product || "Autodesk All Apps",
        duration: order?.duration || "1 Year",
        quantity: order?.quantity || 1,
        totalPrice: order?.totalPrice || "৳ 649",
        paymentMethod: method,
        senderNumber: senderNumber,
        receiverNumber: currentGateway.receiverNumber,
        trxId: trxId,
        status: "PENDING_VERIFICATION",
        submittedAt: new Date().toISOString()
      };

      reminderCount++;
      if (payload) payload.refId = ref;
      console.log(`📨 [Telegram Reminder #${reminderCount}/${maxReminders}] Resending alert for #${ref}...`);

      try {
        const res = await sendOrderToTelegram(payload, {
          isReminder: true,
          reminderIndex: reminderCount,
          maxReminders: maxReminders
        });
        console.log(`📬 [Telegram Reminder #${reminderCount}] Result:`, res);
      } catch (err) {
        console.error(`❌ [Telegram Reminder #${reminderCount}] Error:`, err);
      }

      if (reminderCount >= maxReminders) {
        if (reminderTimerRef.current) {
          clearInterval(reminderTimerRef.current);
          reminderTimerRef.current = null;
        }
      }
    }, reminderIntervalMs);

    return () => {
      if (reminderTimerRef.current) {
        clearInterval(reminderTimerRef.current);
        reminderTimerRef.current = null;
      }
    };
  }, [step, verificationStatus, activeRefId, order?.refId]);


  // Manual refresh trigger
  const handleManualCheck = async () => {
    const ref = activeRefId || order?.refId;
    if (!ref) return;
    setIsCheckingLive(true);
    const res = await checkOrderStatusFromTelegram(ref);
    setIsCheckingLive(false);
    setLastCheckTime(new Date());
    if (res && (res.status === 'CONFIRMED' || res.status === 'INVALID')) {
      setVerificationStatus(res.status);
      setVerificationDetails(res);
    }
  };

  // When admin marked TrxID invalid, user can return to Step 2 to fix it
  const handleReEnterTrxId = () => {
    setStep(2);
    setVerificationStatus('PENDING');
    setError('অনুগ্রহ করে সঠিক Transaction ID টি পুনরায় লিখে সাবমিট করুন');
  };

  // Helper to connect Telegram Bot if not yet connected
  const handleConnectTelegram = async () => {
    setIsDetectingChatId(true);
    const result = await autoDetectAdminChatId();
    setIsDetectingChatId(false);
    if (result) {
      setCustomChatId(result.chatId);
      // Retry sending current order
      const saved = localStorage.getItem('softwaresolutions_last_submission');
      if (saved) {
        setTelegramStatus('sending');
        const res = await sendOrderToTelegram(JSON.parse(saved));
        setTelegramStatus(res.success ? 'sent' : 'failed');
      }
    } else {
      alert("Please open t.me/Notification_SolutionsBD_bot in Telegram, tap Start, then click this button again!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-slate-800">
      
      {/* =========================================================================
          MAIN CONTAINER CARD
         ========================================================================= */}
      <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* =========================================================================
            HEADER BAR (DEDICATED PER GATEWAY)
           ========================================================================= */}
        {method === 'Bkash' && (
          <div className="bg-white px-6 pt-5 pb-4 border-b border-slate-100 flex flex-col items-center">
            <div className="h-10 flex items-center justify-center mb-3">
              <BkashLogo className="h-9 w-auto" />
            </div>
            <div className="w-full flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/logo-icon.png" 
                  alt="Software Solutions BD" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/logo.png";
                  }}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Software Solutions BD</div>
                  <div className="text-[10px] text-slate-500 font-mono">Invoice: {order?.refId || "SOFT-ATD-81923"}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Amount</span>
                <span className="text-base sm:text-lg font-black text-[#e2136e] font-mono">
                  {order?.totalPrice || "৳ 649"}
                </span>
              </div>
            </div>
          </div>
        )}

        {method === 'Nagad' && (
          <div className="bg-gradient-to-r from-[#990000] to-[#700000] text-white px-6 py-4 flex items-center justify-between border-b border-red-900/30">
            <div className="flex items-center gap-2">
              <NagadLogo className="w-8 h-8 bg-white p-1 rounded-full" />
              <div>
                <div className="text-xs font-bold text-white tracking-wide">Software Solutions BD</div>
                <div className="text-[10px] text-red-200 font-mono">Invoice: {order?.refId || "SOFT-ATD-81923"}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-red-200 uppercase font-semibold">Total Amount</div>
              <div className="text-base sm:text-lg font-black font-mono text-white">
                {order?.totalPrice || "৳ 649"}
              </div>
            </div>
          </div>
        )}

        {method === 'Rocket' && (
          <div className="bg-[#8c2282] text-white px-6 py-4 border-b border-purple-900/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RocketLogo className="w-8 h-8 bg-white p-1 rounded-full" />
                <div>
                  <div className="text-xs font-bold text-white">ডাচ-বাংলা ব্যাংক রকেট (Rocket)</div>
                  <div className="text-[10px] text-purple-200">Software Solutions BD &bull; Invoice: {order?.refId || "SOFT-ATD-81923"}</div>
                </div>
              </div>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                {order?.totalPrice || "৳ 649"}
              </span>
            </div>
            <div className="text-[10px] text-purple-100 flex items-center justify-between border-t border-purple-400/30 pt-1.5">
              <span>ডায়াল করুন *322#</span>
              <span>হেল্পলাইন: 16216</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            GATEWAY CONTENT BODY
           ========================================================================= */}
        <div className={`p-6 sm:p-8 ${
          method === 'Bkash'
            ? 'bg-gradient-to-br from-[#e2136e] via-[#cb095e] to-[#990044] text-white'
            : method === 'Nagad'
            ? 'bg-gradient-to-br from-[#8b0000] via-[#750000] to-[#500000] text-white'
            : 'bg-gradient-to-br from-[#8c2282] via-[#6d1264] to-[#450740] text-white'
        }`}>

          {/* =======================================================================
              STEP 1: SENDER NUMBER ENTRY
             ======================================================================= */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm mb-2 border border-white/20">
                  <span>ধাপ ১: সেন্ডার একাউন্ট নম্বর</span>
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {method === 'Bkash' && "Your bKash Account number"}
                  {method === 'Nagad' && "Your Nagad Account Number"}
                  {method === 'Rocket' && "Your Rocket Account Number"}
                </h2>
                <p className="text-xs text-white/80 mt-1">
                  যে {method} নম্বর থেকে আপনি টাকা পাঠাবেন সেই নম্বরটি লিখুন
                </p>
              </div>

              {/* Input Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-800 shadow-lg">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Sender Mobile Number (১১ ডিজিট) *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={11}
                    value={senderNumber}
                    onChange={(e) => {
                      setSenderNumber(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g 01XXXXXXXXX"
                    autoFocus
                    className="w-full px-4 py-3.5 text-center text-lg sm:text-xl font-bold font-mono tracking-widest rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-slate-800 focus:bg-white focus:outline-none transition-all text-slate-900"
                  />
                </div>

                {error && (
                  <div className="mt-2 text-xs text-rose-600 font-bold flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600"
                  />
                  <label htmlFor="terms" className="cursor-pointer">
                    By clicking on <strong>Confirm</strong>, you are agreeing to the terms & conditions
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSafeCancel}
                  className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all text-center"
                >
                  Close / বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all text-center"
                >
                  Confirm / পরবর্তী
                </button>
              </div>

            </div>
          )}

          {/* =======================================================================
              STEP 2: SEND MONEY DETAILS & ENTER TRXID (TIMER REMOVED)
             ======================================================================= */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Header with Clean Trust Badge (No timer) */}
              <div className="flex items-center justify-between pb-3 border-b border-white/20">
                <div>
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-wide block">
                    ধাপ ২: Send Money ও TrxID
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Send Money Instruction
                  </h3>
                </div>
                
                {/* Official Verification Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/30 bg-white/20 text-white backdrop-blur-sm text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Official Verification</span>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs leading-relaxed text-white">
                <p>
                  আপনার <strong>{method}</strong> অ্যাপ বা ডায়াল কোড (<strong>{currentGateway.ussdCode}</strong>) থেকে নিচের নম্বরে <strong>Send Money</strong> করুন:
                </p>
              </div>

              {/* Receiver Number & Amount Box */}
              <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-lg space-y-3">
                
                {/* Receiver Number */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      {method} Personal (Receiver Number)
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                      {currentGateway.receiverNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentGateway.receiverNumber, 'receiver')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
                  >
                    {copiedField === 'receiver' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Amount to Send */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Exact Amount to Send
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono text-emerald-700">
                      {order?.totalPrice || "৳ 649"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy((order?.totalPrice || "649").replace(/[^\d]/g, ''), 'amount')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
                  >
                    {copiedField === 'amount' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sender Reference */}
                <div className="text-[11px] text-slate-500 flex justify-between px-1">
                  <span>আপনার সেন্ডার নম্বর:</span>
                  <span className="font-mono font-bold text-slate-700">{senderNumber}</span>
                </div>

              </div>

              {/* TrxID Input Box */}
              <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-lg">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Enter Transaction ID (TrxID) *
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => {
                    setTrxId(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  placeholder={method === 'Bkash' ? "e.g. DJ1A92X4Z0" : method === 'Nagad' ? "e.g. 72AK94X2" : "e.g. 2938471928"}
                  maxLength={method === 'Bkash' ? 10 : 25}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-slate-800 text-slate-900 font-mono font-bold tracking-wider text-base focus:bg-white focus:outline-none transition-all uppercase"
                />
                
                {error && (
                  <div className="mt-2 text-xs text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                  </div>
                )}
                
                <p className="text-[10px] text-slate-500 mt-2">
                  টাকা পাঠানোর পর প্রাপ্ত SMS বা স্টেটমেন্টের Transaction ID (TrxID) দিন
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all text-center"
                >
                  Back / পেছনে
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTrx}
                  className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all text-center font-mono"
                >
                  Verify & Submit →
                </button>
              </div>

            </div>
          )}

          {/* =======================================================================
              STEP 3: VERIFICATION SUBMITTED + TELEGRAM BOT REALTIME STATUS
             ======================================================================= */}
          {/* =======================================================================
              STEP 3: REAL-TIME VERIFICATION & BOT CONFIRMATION STATUS
             ======================================================================= */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200 text-center">
              
              {/* -------------------------------------------------------------
                  STATE 1: CONFIRMED BY ADMIN VIA TELEGRAM BOT
                 ------------------------------------------------------------- */}
              {verificationStatus === 'CONFIRMED' && (
                <div className="space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl ring-4 ring-emerald-300/40">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                      <span>পেমেন্ট সফলভাবে অনুমোদিত (PAYMENT CONFIRMED)</span>
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Payment Verified & Confirmed!
                    </h3>
                    <p className="text-xs text-white/95 mt-1.5 leading-relaxed max-w-sm mx-auto">
                      অভিনন্দন! আপনার পেমেন্ট অ্যাডমিন কর্তৃক সফলভাবে যাচাই করা হয়েছে। আপনার Autodesk সাবস্ক্রিপশন চালু করা হচ্ছে।
                    </p>
                  </div>

                  {/* Provisioning Notice */}
                  <div className="rounded-2xl bg-emerald-950/50 border border-emerald-400/50 p-4 text-left text-xs text-white space-y-2">
                    <div className="flex items-center justify-between font-bold text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>অ্যাক্টিভেশন স্ট্যাটাস: প্রসেসিং (Processing)</span>
                      </span>
                      <span className="text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30 font-mono">
                        ৫-১০ মিনিট
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100 leading-relaxed">
                      আপনার প্রদত্ত ডেলিভারি ইমেইল <strong className="text-white underline">{order?.email}</strong> এ Autodesk থেকে অফিসিয়াল এক্সেস ইনভাইটেশন পৌঁছে যাবে।
                    </p>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  STATE 2: INVALID TRXID MARKED BY ADMIN VIA TELEGRAM BOT
                 ------------------------------------------------------------- */}
              {verificationStatus === 'INVALID' && (
                <div className="space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-2xl ring-4 ring-rose-400/40">
                    <XCircle className="w-10 h-10" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-xs mb-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>ট্রানজেকশন আইডি মেলেনি (INVALID TRXID)</span>
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      TrxID Verification Failed
                    </h3>
                    <p className="text-xs text-rose-100 mt-1.5 leading-relaxed max-w-sm mx-auto">
                      আপনার প্রদানকৃত Transaction ID (<strong className="text-white font-mono">{trxId}</strong>) আমাদের {method} স্টেটমেন্টে খুঁজে পাওয়া যায়নি বা ভুল রয়েছে।
                    </p>
                  </div>

                  {/* Resolution Guidance Box */}
                  <div className="rounded-2xl bg-rose-950/50 border border-rose-400/40 p-3.5 text-left text-xs text-rose-100 space-y-1.5">
                    <div className="font-bold text-rose-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>কী করবেন এখন?</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-100/90 leading-relaxed pl-1">
                      <li>আপনার {method} অ্যাপ বা এসএমএস চেক করে সঠিক TrxID দেখে নিন</li>
                      <li>নীচের <strong>"সঠিক TrxID দিন"</strong> বাটনে চাপ দিয়ে পুনরায় ট্রাই করুন</li>
                      <li>অথবা সরাসরি WhatsApp এ পেমেন্ট স্ক্রিনশট পাঠিয়ে সহায়তা নিন</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  STATE 3: PENDING VERIFICATION (WAITING FOR BOT CONFIRMATION)
                 ------------------------------------------------------------- */}
              {verificationStatus === 'PENDING' && (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center mx-auto shadow-xl ring-4 ring-white/30">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 shadow-xs mb-2">
                      <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                      <span>ভেরিফিকেশন চলছে (Verification In Progress)</span>
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Payment Submitted Successfully!
                    </h3>
                    <p className="text-xs text-white/90 mt-1 leading-relaxed max-w-sm mx-auto">
                      আপনার পেমেন্ট তথ্য সফলভাবে গ্রহণ করা হয়েছে। ভেরিফিকেশন কনফার্ম হওয়া মাত্রই এই স্ক্রিন স্বয়ংক্রিয়ভাবে আপডেট হবে।
                    </p>
                  </div>
                </div>
              )}

              {/* Customer & Transaction Receipt Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 text-left text-xs space-y-2.5 shadow-xl relative overflow-hidden">
                {verificationStatus === 'CONFIRMED' && (
                  <div className="absolute right-3 top-3 border-2 border-emerald-600 bg-emerald-50 text-emerald-700 font-black text-[10px] tracking-widest px-2.5 py-1 rounded-md rotate-[-6deg] uppercase shadow-xs">
                    ✓ APPROVED & PAID
                  </div>
                )}
                {verificationStatus === 'INVALID' && (
                  <div className="absolute right-3 top-3 border-2 border-rose-600 bg-rose-50 text-rose-700 font-black text-[10px] tracking-widest px-2.5 py-1 rounded-md rotate-[-6deg] uppercase shadow-xs">
                    ✕ INVALID TRXID
                  </div>
                )}
                {verificationStatus === 'PENDING' && (
                  <div className="absolute right-3 top-3 border-2 border-amber-500 bg-amber-50 text-amber-700 font-black text-[10px] tracking-widest px-2 py-0.5 rounded-md uppercase">
                    ⏳ PENDING
                  </div>
                )}

                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Order Reference:</span>
                  <span className="font-mono font-bold text-blue-600">{activeRefId || order?.refId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-bold text-slate-900">{order?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Email:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">{order?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product & Plan:</span>
                  <span className="font-semibold text-slate-900">{order?.product} ({order?.duration})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Gateway:</span>
                  <span className="font-bold text-purple-700">{method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sender Number:</span>
                  <span className="font-mono font-bold text-slate-800">{senderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receiver Number:</span>
                  <span className="font-mono font-bold text-slate-800">{currentGateway.receiverNumber}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Transaction ID (TrxID):</span>
                  <span className={`font-mono font-extrabold uppercase tracking-wider ${
                    verificationStatus === 'INVALID' ? 'text-rose-600 line-through' : 'text-emerald-700'
                  }`}>
                    {trxId}
                  </span>
                </div>
                {order?.discountAmount && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount (10% OFF):</span>
                    <span className="font-mono">-{order.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total Amount:</span>
                  <span className="font-mono font-black text-base text-slate-900">{order?.totalPrice}</span>
                </div>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {/* When INVALID: Provide instant Edit TrxID button */}
                {verificationStatus === 'INVALID' && (
                  <button
                    type="button"
                    onClick={handleReEnterTrxId}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xl transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>সঠিক Transaction ID পুনরায় দিন (Edit TrxID)</span>
                  </button>
                )}

                <a
                  href={`https://wa.me/639552506023?text=${encodeURIComponent(
                    `Hello Software Solutions BD, Order Ref: ${activeRefId || order?.refId}. Method: ${method}, Sender: ${senderNumber}, TrxID: ${trxId}, Status: ${verificationStatus}, Amount: ${order?.totalPrice}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackContact('WhatsApp')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp এ সরাসরি যোগাযোগ করুন</span>
                </a>

                <button
                  type="button"
                  onClick={handleSafeCancel}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all text-center"
                >
                  Return to Homepage / মূল পেজে ফিরুন
                </button>
              </div>

            </div>
          )}

        </div>

        {/* =========================================================================
            BOTTOM BRAND FOOTER
           ========================================================================= */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Secure Official Payment</span>
          </div>
          <div className="flex items-center gap-1 font-mono font-bold text-slate-700">
            <PhoneCall className="w-3 h-3 text-blue-600" />
            <span>Helpline: {currentGateway.helpline}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
