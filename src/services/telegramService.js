// Telegram Bot Service for Software Solutions BD
// Bot: @Notification_SolutionsBD_bot
export const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "";

// Retrieve saved Chat ID from environment, localStorage, or fallback
export const getAdminChatId = () => {
  return import.meta.env.VITE_TELEGRAM_CHAT_ID || localStorage.getItem('softwaresolutions_telegram_chat_id') || "";
};

export const setAdminChatId = (chatId) => {
  if (chatId) {
    localStorage.setItem('softwaresolutions_telegram_chat_id', chatId.toString().trim());
  }
};

/**
 * Auto-detects the admin Chat ID by querying getUpdates from the bot.
 * When the admin opens t.me/Notification_SolutionsBD_bot and taps /start, their Chat ID appears here.
 */
export const autoDetectAdminChatId = async () => {
  if (!TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
    const data = await res.json();
    if (data.ok && data.result && data.result.length > 0) {
      for (let i = data.result.length - 1; i >= 0; i--) {
        const item = data.result[i];
        const chat = item.message?.chat || item.channel_post?.chat || item.my_chat_member?.chat;
        if (chat && chat.id) {
          const discoveredId = chat.id.toString();
          setAdminChatId(discoveredId);
          return {
            chatId: discoveredId,
            firstName: chat.first_name || chat.title || "Admin",
            username: chat.username || ""
          };
        }
      }
    }
  } catch (err) {
    console.error("Error auto-detecting Telegram Chat ID:", err);
  }
  return null;
};

/**
 * Sanitizes strings for Telegram HTML parse_mode to prevent parsing errors and HTML injection
 */
export const escapeHtml = (text) => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Sends full order details to the Telegram Bot with formatted HTML
 * Supports optional reminder mode for recurring unacknowledged alerts
 */
export const sendOrderToTelegram = async (orderPayload, options = {}) => {
  const { isReminder = false, reminderIndex = 1, maxReminders = 8 } = options;
  let targetChatId = getAdminChatId();

  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("Telegram Bot token is not configured.");
    return {
      success: false,
      reason: "NO_BOT_TOKEN",
      message: "Please configure VITE_TELEGRAM_BOT_TOKEN."
    };
  }

  // If not yet saved in localStorage, try auto-detecting from recent bot updates
  if (!targetChatId) {
    const detected = await autoDetectAdminChatId();
    if (detected) {
      targetChatId = detected.chatId;
    }
  }

  if (!targetChatId) {
    console.warn("Telegram Notification Notice: No chat_id connected yet. Tap Start in @Notification_SolutionsBD_bot.");
    return {
      success: false,
      reason: "NO_CHAT_ID",
      message: "Please open t.me/Notification_SolutionsBD_bot and send /start to receive order alerts."
    };
  }

  // Sanitize all user inputs before inserting into Telegram HTML template
  const safeRefId = escapeHtml(orderPayload.refId || 'N/A');
  const safeName = escapeHtml(orderPayload.name || 'N/A');
  const safeEmail = escapeHtml(orderPayload.email || 'N/A');
  const safePhone = escapeHtml(orderPayload.phone || 'N/A');
  const safeProduct = escapeHtml(orderPayload.product || 'Autodesk All Apps');
  const safeDuration = escapeHtml(orderPayload.duration || '1 Year');
  const safeQuantity = escapeHtml(orderPayload.quantity || 1);
  const safeTotalPrice = escapeHtml(orderPayload.totalPrice || '৳ 649');
  const safeCoupon = orderPayload.couponApplied ? escapeHtml(orderPayload.couponApplied) : null;
  const safeDiscount = orderPayload.discountAmount ? escapeHtml(orderPayload.discountAmount) : null;
  const safeGateway = escapeHtml(orderPayload.paymentMethod || 'bKash');
  const safeSender = escapeHtml(orderPayload.senderNumber || 'N/A');
  const safeReceiver = escapeHtml(orderPayload.receiverNumber || 'N/A');
  const safeTrxId = escapeHtml(orderPayload.trxId || 'N/A');

  const couponLine = safeCoupon ? `\n🏷️ <b>Coupon:</b> <code>${safeCoupon}</code> (-10%, saved ${safeDiscount})` : '';

  const headerTitle = isReminder 
    ? `⚠️ <b>URGENT REMINDER (#${reminderIndex}/${maxReminders})</b>\n🔔 <b>ORDER AWAITING CONFIRMATION</b>`
    : `🔔 <b>NEW SOFTWARE SOLUTIONS BD ORDER</b>`;

  const statusLine = isReminder
    ? `Status: ⏳ <b>PENDING VERIFICATION (ACTION REQUIRED #${reminderIndex})</b>`
    : `Status: ⏳ <b>PENDING MANUAL VERIFICATION</b>`;

  const messageText = `
${headerTitle}
━━━━━━━━━━━━━━━━━━━━━
📋 <b>Order Ref:</b> <code>${safeRefId}</code>
👤 <b>Customer:</b> <b>${safeName}</b>
📧 <b>Delivery Email:</b> <code>${safeEmail}</code>
📱 <b>Customer Phone:</b> <code>${safePhone}</code>
━━━━━━━━━━━━━━━━━━━━━
📦 <b>Product:</b> ${safeProduct}
⏳ <b>Duration:</b> ${safeDuration}
🪑 <b>Seats/Qty:</b> ${safeQuantity} Seat(s)
💰 <b>Total Amount:</b> <b>${safeTotalPrice}</b>${couponLine}
━━━━━━━━━━━━━━━━━━━━━
💳 <b>Payment Gateway:</b> <b>${safeGateway}</b>
📤 <b>Sender Number:</b> <code>${safeSender}</code>
📥 <b>Receiver Number:</b> <code>${safeReceiver}</code>
🔑 <b>Transaction ID (TrxID):</b> <code>${safeTrxId}</code>
⏰ <b>Time:</b> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}
━━━━━━━━━━━━━━━━━━━━━
${statusLine}
`.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Confirm (বৈধ)", callback_data: `confirm_${orderPayload.refId}` },
              { text: "❌ Invalid (ভুল TrxID)", callback_data: `invalid_${orderPayload.refId}` }
            ]
          ]
        }
      })
    });

    const result = await response.json();
    if (!result.ok) {
      console.warn("Telegram sendMessage error:", result);
      return { 
        success: false, 
        reason: result.description?.includes('chat not found') ? 'CHAT_NOT_FOUND' : 'API_ERROR',
        description: result.description,
        data: result 
      };
    }

    return { 
      success: true, 
      data: result,
      messageId: result.result?.message_id || null
    };
  } catch (err) {
    console.error("Error dispatching order to Telegram:", err);
    return { success: false, error: err };
  }
};

/**
 * Acknowledges a Telegram callback query to clear button loading state
 */
export const answerTelegramCallback = async (callbackQueryId, text = "Status updated") => {
  if (!TELEGRAM_BOT_TOKEN || !callbackQueryId) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: false
      })
    });
  } catch (err) {
    // Ignore expired or already answered callback errors
  }
};

/**
 * Updates inline buttons on the Telegram notification message to reflect current status
 */
export const updateTelegramMessageStatus = async (chatId, messageId, status, orderRefId) => {
  if (!TELEGRAM_BOT_TOKEN || !chatId || !messageId) return;
  try {
    const isConfirmed = status === 'CONFIRMED';
    const inline_keyboard = isConfirmed
      ? [
          [
            { text: "✅ Confirmed (যাচাই সম্পন্ন)", callback_data: `confirmed_done_${orderRefId}` },
            { text: "🔄 ভুল হলে Invalid করুন", callback_data: `invalid_${orderRefId}` }
          ]
        ]
      : [
          [
            { text: "❌ Invalid TrxID (বাতিল)", callback_data: `invalid_done_${orderRefId}` },
            { text: "🔄 সঠিক হলে Confirm করুন", callback_data: `confirm_${orderRefId}` }
          ]
        ];

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard }
      })
    });
  } catch (err) {
    console.error("Error updating Telegram message markup:", err);
  }
};

// Set to avoid redundant callback acknowledgments
const processedCallbacks = new Set();

/**
 * Polls Telegram updates to check if the admin clicked Confirm or Invalid
 * for a specific order reference ID.
 * Returns: { status: 'PENDING' | 'CONFIRMED' | 'INVALID', verifiedBy?: string, verifiedAt?: Date }
 */
export const checkOrderStatusFromTelegram = async (orderRefId) => {
  if (!orderRefId || !TELEGRAM_BOT_TOKEN) {
    return { status: 'PENDING' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      const cleanTargetRef = String(orderRefId).trim().toUpperCase();

      // Traverse backwards from newest update to find the latest action on this order
      for (let i = data.result.length - 1; i >= 0; i--) {
        const update = data.result[i];
        const cb = update.callback_query;
        if (!cb || !cb.data) continue;

        const dataStr = String(cb.data).trim().toUpperCase();
        const isConfirm = dataStr === `CONFIRM_${cleanTargetRef}` || dataStr === `CONFIRMED_DONE_${cleanTargetRef}`;
        const isInvalid = dataStr === `INVALID_${cleanTargetRef}` || dataStr === `INVALID_DONE_${cleanTargetRef}`;

        if (isConfirm || isInvalid) {
          const finalStatus = isConfirm ? 'CONFIRMED' : 'INVALID';

          // Acknowledge callback and update buttons in Telegram if not yet processed
          if (!processedCallbacks.has(cb.id)) {
            processedCallbacks.add(cb.id);
            answerTelegramCallback(
              cb.id,
              isConfirm ? `✅ Order #${orderRefId} Confirmed!` : `❌ Order #${orderRefId} marked as Invalid!`
            ).catch(() => {});

            if (cb.message?.chat?.id && cb.message?.message_id) {
              updateTelegramMessageStatus(
                cb.message.chat.id,
                cb.message.message_id,
                finalStatus,
                orderRefId
              ).catch(() => {});
            }
          }

          return {
            status: finalStatus,
            verifiedBy: cb.from?.first_name || 'Admin',
            verifiedAt: new Date(cb.message?.date ? cb.message.date * 1000 : Date.now()),
            note: isConfirm
              ? "Payment verified by administrator on Telegram."
              : "Transaction ID was marked invalid by administrator on Telegram."
          };
        }
      }
    }
  } catch (err) {
    console.error("Error checking order status from Telegram:", err);
  }

  return { status: 'PENDING' };
};
