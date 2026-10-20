# Threat Model — Software Solutions BD

This document presents a comprehensive threat model for the **Software Solutions BD** web application based strictly on the current architecture, implementation, and configurations present in the repository.

---

## 1. System Overview & Architecture

Software Solutions BD is a single-page application (SPA) built with **React 18**, **Vite 5**, and **Tailwind CSS 3**, designed to market Autodesk software subscriptions and facilitate customer order placements in Bangladesh.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PUBLIC UNTRUSTED CLIENT                              │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                         Browser Client (React SPA)                       │   │
│   │  • Order Form (OrderSection.jsx)                                         │   │
│   │  • Payment Gateway Simulator & Live Verification (PaymentGatewayPage.jsx)│   │
│   │  • Client State & LocalStorage (LanguageContext.jsx)                     │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
└────────────┬─────────────────────────────┬──────────────────────────┬────────────┘
             │                             │                          │
   [1] Direct HTTPS Poll/Push    [2] Direct JS Tracking     [3] Redirect URL with PII
             │                             │                          │
             ▼                             ▼                          ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌──────────────────────┐
│    Telegram Bot API     │   │    Meta (Facebook)      │   │   WhatsApp Direct    │
│  (api.telegram.org)     │   │      Pixel API          │   │      (wa.me)         │
│                         │   │  (connect.facebook.net) │   │                      │
│ • sendMessage           │   │                         │   │ • Pre-filled support │
│ • getUpdates (2.5s poll)│   │ • PageView / Purchase   │   │   message with order │
│ • answerCallbackQuery   │   │ • InitiateCheckout      │   │   ref & trxId        │
│ • editMessageReplyMarkup│   └─────────────────────────┘   └──────────────────────┘
└─────────────────────────┘
             ▲
             │ Admin inline button click (Confirm / Invalid)
             │
┌─────────────────────────┐
│  Administrator Phone    │
│  (Telegram Client App)  │
└─────────────────────────┘
```

### Architectural Key Observations:
1. **Serverless / Backend-Free Architecture**: There is **no dedicated application backend**, proxy server, database, or API gateway.
2. **Direct Client-to-Third-Party Communication**: The client browser communicates directly with third-party APIs (`api.telegram.org`, `connect.facebook.net`).
3. **Client-Side Secret Embedding**: The Telegram Bot Token is loaded via `import.meta.env.VITE_TELEGRAM_BOT_TOKEN` and bundled directly into static JavaScript assets distributed to all site visitors.

---

## 2. Assets & Business Impact

| Asset ID | Asset Name | Description | Sensitivity | Impact if Compromised |
| :--- | :--- | :--- | :--- | :--- |
| **AST-01** | **Telegram Bot Token** | Production bot credential giving complete control over `@Notification_SolutionsBD_bot` | **Critical** | Complete bot takeover, ability to read all incoming messages, send forged alerts, hijack webhooks. |
| **AST-02** | **Customer PII** | Full name, personal email address, mobile phone number, software requirements | **High** | Customer privacy violation, targeted spam, phishing attacks, breach of trust. |
| **AST-03** | **Transaction & Order Data** | Order reference IDs (`SOFT-ATD-*`), payment methods (bKash, Nagad, Rocket), sender phone numbers, Transaction IDs (TrxID) | **High** | Payment fraud, financial impersonation, unauthorized license claims. |
| **AST-04** | **Admin Identification** | Admin Telegram Chat ID (`VITE_TELEGRAM_CHAT_ID`) and personal telegram profile metadata | **Medium** | Direct targeting of administrator accounts, social engineering, denial of service. |
| **AST-05** | **Business Integrity** | Legitimacy of order confirmation workflow and merchant payment numbers | **High** | Loss of revenue, reputational damage, delivery of licenses for fraudulent transactions. |
| **AST-06** | **Service Availability** | Accessibility of payment processing and order dispatch | **High** | Inability for legitimate customers to complete orders due to Telegram rate limiting. |

---

## 3. Trust Boundaries

```
[Trust Boundary 0: The Public Internet]
     │
     ▼
[Trust Boundary 1: Client Browser Runtime (Untrusted)]
  ├── DOM / JavaScript Context (All code & environment variables exposed)
  └── Browser LocalStorage (Unencrypted persistent storage)
     │
     ├── (MISSING BOUNDARY: No backend server exists to validate or proxy) ──❌
     │
     ▼
[Trust Boundary 2: External Third-Party APIs (Trusted Providers)]
  ├── Telegram Bot API (api.telegram.org)
  └── Meta Events API (connect.facebook.net)
     │
     ▼
[Trust Boundary 3: Administrative Control Channel]
  └── Telegram Messenger Application (Admin private chat)
```

### Trust Boundary Gaps:
* **Missing Backend Boundary (Critical)**: In secure architectures, the client browser never interacts directly with an administrative bot token. A secure backend authenticates requests, rate-limits submissions, verifies payments against banking webhooks, and sends notifications. In this project, the untrusted client is given the authority of the bot administrator.
* **Storage Boundary**: `localStorage` is accessible to any script executing in the origin context (susceptible to physical access, browser extensions, or XSS).

---

## 4. Threat Actors

1. **Malicious Customer / Fraudulent Buyer**:
   * *Motivation*: Obtain paid software licenses without sending legitimate mobile banking funds.
   * *Capabilities*: Browser Developer Tools, manipulating JavaScript variables, editing `localStorage`, submitting fabricated TrxIDs.
2. **External Opportunistic Attacker / Scripter**:
   * *Motivation*: Bot harvesting, credential collection, denial of service, extortion.
   * *Capabilities*: Automated HTTP scanners, extracting bundled secrets from public JavaScript files, abusing Telegram API endpoints.
3. **Competitor / Business Disrupter**:
   * *Motivation*: Sabotaging order flow, flooding the admin with spam alerts, hijacking notifications, locking out the Telegram bot via rate limiting.
   * *Capabilities*: Bot traffic generation, automated form submission, Telegram API calls using the leaked bot token.
4. **Untrusted Third-Party / Public Network Observer**:
   * *Motivation*: Intercepting customer PII or transaction receipts on shared Wi-Fi networks.
   * *Capabilities*: Network inspection (mitigated by HTTPS/HSTS, but vulnerable if proxying or client-side inspection is active).

---

## 5. Entry Points

| Entry Point ID | Component / File | Vector | Data Handled |
| :--- | :--- | :--- | :--- |
| **EP-01** | `OrderSection.jsx` | Web Form Inputs (`fullName`, `email`, `phone`, `requirements`, `couponCode`) | Customer PII, pricing multipliers, coupon strings |
| **EP-02** | `PaymentGatewayPage.jsx` | Web Form Inputs (`senderNumber`, `trxId`) | Mobile numbers, payment transaction IDs |
| **EP-03** | `PaymentGatewayPage.jsx` | URL Hash (`#payment`) & LocalStorage Lookup | Rehydrated active order objects |
| **EP-04** | `telegramService.js` | Direct calls to `https://api.telegram.org/bot<TOKEN>/*` | All order fields, administrative polling updates, callback acknowledgments |
| **EP-05** | Browser `localStorage` | Direct browser storage keys (`softwaresolutions_last_submission`, `softwaresolutions_telegram_chat_id`) | Serialized JSON payloads, admin IDs |
| **EP-06** | `NotFoundPage.jsx` / `404.html` | Arbitrary URL Paths & Query Strings | Navigation history, error monitoring payloads |

---

## 6. Threat Identification (STRIDE Model)

### 6.1. Spoofing
* **Threat S-01: Order Confirmation Status Spoofing**
  * *Evidence*: `PaymentGatewayPage.jsx` lines 218–221 and 285–287 rely entirely on client-side state variable `verificationStatus`.
  * *Mechanism*: A malicious user can open DevTools and set `verificationStatus = 'CONFIRMED'` in React DevTools or forge a callback query matching `confirm_SOFT-ATD-*` via the exposed Telegram Bot token.
  * *Impact*: Client UI displays "Order Confirmed" and fires Meta Pixel purchase events without admin approval.

* **Threat S-02: Admin Impersonation via Auto-Detection**
  * *Evidence*: `telegramService.js` lines 20–44 (`autoDetectAdminChatId`) queries `getUpdates` and sets `targetChatId` to the `chat.id` of whoever recently messaged the bot.
  * *Mechanism*: An attacker sends `/start` or any text to the public bot `@Notification_SolutionsBD_bot`. If `autoDetectAdminChatId()` executes, subsequent orders containing customer names, emails, and phone numbers are dispatched directly to the attacker's Telegram account.

### 6.2. Tampering
* **Threat T-01: Price & Order Payload Manipulation**
  * *Evidence*: `OrderSection.jsx` lines 161–178 constructs `orderPayload` with client-calculated prices and passes it directly to `PaymentGatewayPage.jsx`.
  * *Mechanism*: An attacker can manipulate `rawPrice`, `totalPrice`, or coupon deductions before initiating payment.
  * *Impact*: Discrepancies between expected charges and recorded amounts in Telegram alerts.

* **Threat T-02: In-Transit Notification Message Alteration**
  * *Evidence*: `telegramService.js` sends raw message text over client-side HTTPS.
  * *Mechanism*: An attacker with the bot token can invoke `editMessageText` to change payment instructions or replace merchant payment numbers in Telegram notifications.

### 6.3. Repudiation
* **Threat R-01: Lack of Server-Side Audit Logs & Non-Repudiation**
  * *Evidence*: No server-side database exists. All transaction records reside only in Telegram chat history and user `localStorage`.
  * *Mechanism*: If an admin accidentally deletes the Telegram chat or a message is cleared, no record of customer purchases, timestamps, or TrxIDs exists to verify fulfillment claims.

### 6.4. Information Disclosure
* **Threat I-01: Telegram Bot Token Exposure (Critical Vulnerability)**
  * *Evidence*: `telegramService.js` line 3:
    ```javascript
    export const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "[REDACTED]";
    ```
    Vite bundles all `VITE_*` variables into the public static bundle `dist/assets/index-*.js`.
  * *Impact*: Any site visitor can retrieve the token from browser sources or network requests and execute any Telegram Bot API method.

* **Threat I-02: Customer PII Leakage via `getUpdates` Polling**
  * *Evidence*: `telegramService.js` line 252 executes `fetch('https://api.telegram.org/bot<TOKEN>/getUpdates')` directly from the user's browser every 2.5 seconds.
  * *Impact*: The HTTP response returned to the client browser contains the last 100 updates received by the bot, exposing:
    * Other customers' callback queries and order reference numbers.
    * Private messages sent to the bot by other customers or the admin.
    * The admin's Telegram user ID, first name, last name, and username.

* **Threat I-03: Plaintext Customer PII in Browser `localStorage`**
  * *Evidence*: `PaymentGatewayPage.jsx` line 179 stores `customerPayload` in `localStorage`.
  * *Impact*: PII persists unencrypted on shared devices, internet cafes, or multi-user workstations.

### 6.5. Denial of Service (DoS)
* **Threat D-01: Telegram API Rate Limit Exhaustion**
  * *Evidence*: `PaymentGatewayPage.jsx` lines 238–244 polls `getUpdates` every 2,500ms while on Step 3. Lines 275–330 also schedule recurring reminders every 15 seconds.
  * *Mechanism*: Telegram enforces strict global rate limits on `getUpdates` (roughly 1 req/sec). As few as 2–3 simultaneous customers on the payment verification screen will cause Telegram to return `HTTP 429 Too Many Requests`.
  * *Impact*: Polling fails, orders fail to verify, and new notifications cannot be dispatched.

* **Threat D-02: Telegram Notification Flooding / Spam**
  * *Evidence*: Order form submission (`OrderSection.jsx` line 147) and reminder triggers require no CAPTCHA, authentication, or rate limiting.
  * *Mechanism*: An automated script can loop POST requests to `sendMessage`, overwhelming the admin's Telegram channel with tens of thousands of fake order notifications.

### 6.6. Elevation of Privilege
* **Threat E-01: Bot Administrative Takeover**
  * *Evidence*: The client holds the root bot token (`TELEGRAM_BOT_TOKEN`).
  * *Mechanism*: Using standard Telegram Bot API methods, an attacker can invoke `setWebhook`, pointing all future bot traffic to an attacker-controlled server, permanently severing the business's notification pipeline.

---

## 7. Attack Scenarios & Risk Matrix

| Threat ID | Threat Description | Threat Actor | Entry Point | Likelihood | Impact | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-TM-01** | Bot Token extraction & Webhook takeover | Scripter / Attacker | `dist/assets/*.js` | **High** | **Critical** | **Critical** |
| **SEC-TM-02** | Customer PII & Admin data harvest via `getUpdates` | Malicious Visitor | Client Network Tab | **High** | **High** | **High** |
| **SEC-TM-03** | Order verification spoofing / bypass | Malicious Customer | DevTools Console | **High** | **High** | **High** |
| **SEC-TM-04** | Admin Chat ID hijacking via `autoDetectAdminChatId` | Attacker | Telegram Chat | **Medium** | **High** | **High** |
| **SEC-TM-05** | Notification channel DoS via rate limiting (HTTP 429) | Multiple Users / Attacker | `PaymentGatewayPage.jsx` | **High** | **High** | **High** |
| **SEC-TM-06** | Order form spamming / Notification bomb | Competitor / Bot | `OrderSection.jsx` | **High** | **Medium** | **Medium** |
| **SEC-TM-07** | LocalStorage PII theft on shared computer | Physical / Local User | Browser Storage | **Medium** | **Medium** | **Medium** |

---

## 8. Existing Mitigations vs Missing Mitigations

### Existing Controls Implemented:
* **HTML Sanitization for Telegram**: `escapeHtml()` in `src/services/telegramService.js` safely encodes `&`, `<`, `>`, and `"` to prevent malformed HTML entities from crashing the Telegram message parser.
* **Client-Side Input Trimming & Character Whitelisting**:
  * TrxID restricted to uppercase alphanumeric characters (`replace(/[^A-Z0-9]/g, '')`).
  * Phone numbers sanitized to digits and `+` symbols.
  * Name and email stripped of `<` and `>` tags and length-capped.
* **HTTP Security Headers (`vercel.json`)**:
  * `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  * `X-Content-Type-Options: nosniff`
  * `X-Frame-Options: SAMEORIGIN`
  * `X-XSS-Protection: 1; mode=block`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
* **Scanner & Probe Path Rewrites (`vercel.json` & `robots.txt`)**:
  * Blocks and rewrites common sensitive scanner probes (`/.env*`, `/.git*`, `/wp-admin*`, `*.php`, `*.sql`, `*.bak`) to `404.html`.

### Critical Missing Controls:
* **No Backend API Gateway / Proxy**: Bot token is not held securely on a server; operations are not isolated from public clients.
* **No Server-Side Verification or Transaction Database**: No persistent, tamper-proof record of orders, statuses, or payment receipts.
* **No Server-Side Rate Limiting or Anti-Automation (CAPTCHA)**: No defense against automated form spam or Telegram API hammering.
* **No Content Security Policy (CSP)**: `vercel.json` does not declare a `Content-Security-Policy` header, leaving script and connect origins unconstrained.
* **No Authentication / Access Control**: No authenticated session management or role-based access control.

