# Project Security Checklist & Audit Report — Software Solutions BD

This document provides a comprehensive, project-specific security evaluation across 20 distinct security domains for the **Software Solutions BD** codebase.

Every finding follows the standardized structure:  
**Severity → Evidence → Risk → Affected Location → Why It Matters → Recommended Fix**

Findings are strictly classified into:
* **[VULN] Confirmed Vulnerability**: Directly exploitable flaw with verified project evidence.
* **[WEAK] Security Weakness**: Suboptimal design or pattern that diminishes defense-in-depth.
* **[CTRL] Missing Control**: Absence of a required standard security safeguard.
* **[RISK] Potential Risk Requiring Verification**: Behavior dependent on external hosting or operational factors.
* **[RECM] Recommendation**: Best-practice architectural improvement.

---

## Evaluation Summary Matrix

| # | Security Domain | Status | Key Finding / Classification |
| :-: | :--- | :---: | :--- |
| **01** | **Authentication** | ❌ **Non-Compliant** | [CTRL] No customer or administrator authentication exists in the application. |
| **02** | **Authorization & RBAC** | ❌ **Non-Compliant** | [VULN] Payment approval is verified and simulated purely on the client side. |
| **03** | **Session & Token Security** | ⚠️ **Partial** | [WEAK] Client relies on unencrypted `localStorage` rather than authenticated sessions. |
| **04** | **Input Validation** | ⚠️ **Partial** | [WEAK] Validation is purely client-side; easily bypassed via direct API calls. |
| **05** | **Injection** | ✅ **Compliant** | [WEAK] HTML escaping implemented for Telegram; SQL/Command injection N/A. |
| **06** | **XSS & CSRF** | ✅ **Compliant** | [CTRL] React auto-escapes JSX; no `dangerouslySetInnerHTML`. CSRF N/A (no cookies). |
| **07** | **API Security** | ❌ **Non-Compliant** | [VULN] Direct unauthenticated client-to-Telegram API execution with admin token. |
| **08** | **Rate Limiting & Abuse** | ❌ **Non-Compliant** | [VULN] Polling loop causes Telegram HTTP 429; no rate limits on order submission. |
| **09** | **File Uploads** | ✅ **Not Applicable** | Zero file upload functionality in codebase. |
| **10** | **Database Security** | ✅ **Not Applicable** | No database attached to the application. |
| **11** | **Secrets Management** | ❌ **Non-Compliant** | [VULN] Telegram Bot Token exposed in `.env.example`, Git history, and client JS. |
| **12** | **Encryption** | ⚠️ **Partial** | [WEAK] HTTPS enforced via HSTS, but customer PII stored unencrypted at rest in browser. |
| **13** | **CORS** | ⚠️ **Partial** | [RISK] Telegram API allows wildcard CORS (`*`), enabling direct browser execution. |
| **14** | **Dependency Security** | ⚠️ **Partial** | [WEAK] Build-time vulnerabilities in `braces`, `esbuild`, `postcss-selector-parser`. |
| **15** | **Logging & Monitoring** | ⚠️ **Partial** | [WEAK] Errors and payloads logged to browser DevTools; no central audit trail. |
| **16** | **Admin Security** | ❌ **Non-Compliant** | [VULN] Admin identity can be hijacked via `autoDetectAdminChatId`. |
| **17** | **Deployment & Infrastructure**| ⚠️ **Partial** | [CTRL] Good Vercel headers, but missing Content-Security-Policy (CSP). |
| **18** | **Data Privacy (GDPR/Compliance)**| ❌ **Non-Compliant** | [VULN] `getUpdates` endpoint leaks customer data to any polling visitor. |
| **19** | **Error Handling** | ⚠️ **Partial** | [WEAK] API responses logged to console; no user-facing sensitive data exposure. |
| **20** | **Backup & Recovery** | ❌ **Non-Compliant** | [CTRL] No persistent database backup or order recovery mechanism exists. |

---

## Detailed Domain Analysis & Findings

---

### 1. Authentication
* **Status**: **Missing Control** [CTRL]
* **Project Reality**: There is no user registration, login, session token, or administrative portal. Orders are submitted anonymously.
* **Finding 1.1**:
  * **Classification**: Missing Control
  * **Severity**: Medium
  * **Evidence**: [`src/components/OrderSection.jsx`](file:///c:/Users/irfan/Desktop/SSolutions/src/components/OrderSection.jsx#L147-L183) processes orders directly on submit without verifying user identity.
  * **Risk**: Allows automated scripts and unauthenticated actors to flood order pipelines with fictitious orders.
  * **Affected Location**: `src/components/OrderSection.jsx`
  * **Why It Matters**: Lack of account verification complicates transaction dispute resolution and order tracking.
  * **Recommended Fix**: Implement lightweight OTP (One-Time Password) verification over email or WhatsApp before dispatching orders.

---

### 2. Authorization & RBAC
* **Status**: **Confirmed Vulnerability** [VULN]
* **Project Reality**: Order confirmation is evaluated entirely within the client's React state.
* **Finding 2.1**:
  * **Classification**: Confirmed Vulnerability
  * **Severity**: High
  * **Evidence**: [`src/components/payment/PaymentGatewayPage.jsx`](file:///c:/Users/irfan/Desktop/SSolutions/src/components/payment/PaymentGatewayPage.jsx#L218-L226):
    ```javascript
    if (res && (res.status === 'CONFIRMED' || res.status === 'INVALID')) {
      setVerificationStatus(res.status);
    ```
    And lines 890–935 render the "Payment Verified" screen purely based on `verificationStatus === 'CONFIRMED'`.
  * **Risk**: Any user can open their browser console and trigger `setVerificationStatus('CONFIRMED')` or mock the response from `checkOrderStatusFromTelegram` to force the UI into the verified state.
  * **Affected Location**: `src/components/payment/PaymentGatewayPage.jsx` lines 218–226
  * **Why It Matters**: Users could claim software licenses or take screenshots of "Order Confirmed" screens without the administrator actually confirming the payment.
  * **Recommended Fix**: Separate order verification from the client. Delivery of license keys must be triggered exclusively by the administrator on the server or manually via email, rather than relying on client UI state.

---

### 3. Session & Token Security
* **Status**: **Security Weakness** [WEAK]
* **Project Reality**: No JWTs, cookies, or session tokens exist. The client stores order draft data in `localStorage`.
* **Finding 3.1**:
  * **Classification**: Security Weakness
  * **Severity**: Medium
  * **Evidence**: [`src/context/LanguageContext.jsx`](file:///c:/Users/irfan/Desktop/SSolutions/src/context/LanguageContext.jsx#L66) and [`PaymentGatewayPage.jsx`](file:///c:/Users/irfan/Desktop/SSolutions/src/components/payment/PaymentGatewayPage.jsx#L179):
    ```javascript
    localStorage.setItem('softwaresolutions_last_submission', JSON.stringify(customerPayload));
    ```
  * **Risk**: Plaintext customer PII (Name, Email, Phone Number, TrxID, Gateway) remains stored on the client machine indefinitely.
  * **Affected Location**: `localStorage` keys `softwaresolutions_active_order` and `softwaresolutions_last_submission`.
  * **Why It Matters**: On shared devices or internet cafes, subsequent users of the device can read previous customer orders from storage.
  * **Recommended Fix**: Clear `localStorage` immediately upon order completion or navigation, or utilize ephemeral in-memory state (`sessionStorage` or React state).

---

### 4. Input Validation
* **Status**: **Security Weakness** [WEAK]
* **Project Reality**: Validation is implemented using client-side JavaScript regex and length limits.
* **Finding 4.1**:
  * **Classification**: Security Weakness
  * **Severity**: Medium
  * **Evidence**: [`src/components/OrderSection.jsx`](file:///c:/Users/irfan/Desktop/SSolutions/src/components/OrderSection.jsx#L155-L158):
    ```javascript
    const cleanName = fullName.trim().replace(/[<>]/g, '').slice(0, 80);
    const cleanEmail = email.trim().replace(/[<>]/g, '').slice(0, 100);
    const cleanPhone = phone.trim().replace(/[^0-9+\s-]/g, '').slice(0, 25);
    ```
  * **Risk**: Stripping `<>` prevents basic tag insertion, but because there is no backend server, any user can bypass these regex filters and invoke the Telegram Bot API with arbitrary payloads.
  * **Affected Location**: `src/components/OrderSection.jsx`, `src/components/payment/PaymentGatewayPage.jsx`
  * **Why It Matters**: Client-side validation is a UX feature, not a security boundary.
  * **Recommended Fix**: Validate and sanitize all inputs on a dedicated serverless function before accepting orders.

---

### 5. Injection
* **Status**: **Compliant** (Low Risk)
* **Project Reality**: No SQL, NoSQL, LDAP, or OS command interfaces exist.
* **Finding 5.1**:
  * **Classification**: Recommendation [RECM]
  * **Severity**: Low
  * **Evidence**: [`src/services/telegramService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/telegramService.js#L49-L56) implements `escapeHtml`:
    ```javascript
    export const escapeHtml = (text) => {
      if (text === null || text === undefined) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
    ```
  * **Risk**: HTML tags are escaped before insertion into Telegram HTML templates, preventing Telegram parse errors or message formatting disruption.
  * **Affected Location**: `src/services/telegramService.js`
  * **Why It Matters**: Malformed HTML strings in Telegram templates cause Telegram's API to return HTTP 400 Bad Request, dropping notifications.
  * **Recommended Fix**: Maintain `escapeHtml()` and consider using Telegram MarkdownV2 with strict character escaping if HTML mode is ever changed.

---

### 6. XSS & CSRF
* **Status**: **Compliant**
* **Project Reality**: React automatically escapes values in JSX. No `dangerouslySetInnerHTML` is used in the application. CSRF is not applicable as the project issues no session cookies.
* **Finding 6.1**:
  * **Classification**: Recommendation [RECM]
  * **Severity**: Low
  * **Evidence**: Entire `src/` tree contains 0 occurrences of `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, or `eval()`.
  * **Risk**: Minimal risk of DOM-based XSS from project code.
  * **Affected Location**: Global `src/` codebase.
  * **Why It Matters**: Standard React sanitization provides baseline protection against script injection into the DOM.
  * **Recommended Fix**: Maintain current coding practices and avoid introducing raw HTML injection sinks.

---

### 7. API Security
* **Status**: **Confirmed Vulnerability** [VULN]
* **Project Reality**: Direct unauthenticated client-to-Telegram API calls using the bot's secret token.
* **Finding 7.1**:
  * **Classification**: Confirmed Vulnerability
  * **Severity**: Critical
  * **Evidence**: [`src/services/telegramService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/telegramService.js#L141):
    ```javascript
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { ... });
    ```
  * **Risk**: The Telegram Bot API requires no further authentication beyond the token itself. Anyone can send arbitrary messages, change bot descriptions, view updates, or delete webhooks.
  * **Affected Location**: `src/services/telegramService.js` lines 23, 141, 189, 224, 252
  * **Why It Matters**: Exposes administrative credentials directly to public network traffic.
  * **Recommended Fix**: Remove the bot token from all client-side files. Introduce a server-side endpoint (`/api/send-order`) that holds the secret token and handles Telegram dispatch.

---

### 8. Rate Limiting & Abuse Prevention
* **Status**: **Confirmed Vulnerability** [VULN]
* **Project Reality**: The application has no rate-limiting or anti-abuse controls.
* **Finding 8.1**:
  * **Classification**: Confirmed Vulnerability
  * **Severity**: High
  * **Evidence**: [`src/components/payment/PaymentGatewayPage.jsx`](file:///c:/Users/irfan/Desktop/SSolutions/src/components/payment/PaymentGatewayPage.jsx#L239):
    ```javascript
    const interval = setInterval(performStatusCheck, 2500);
    ```
    Every user on Step 3 triggers a request to `https://api.telegram.org/bot<TOKEN>/getUpdates` every 2.5 seconds.
  * **Risk**: Telegram enforces global rate limits of roughly 1 request/sec on `getUpdates`. If multiple users are on the payment gateway at once, Telegram triggers `HTTP 429 Too Many Requests`, breaking live verification for all users.
  * **Affected Location**: `src/components/payment/PaymentGatewayPage.jsx` lines 238–244
  * **Why It Matters**: Causes self-inflicted Denial of Service (DoS) during normal traffic spikes.
  * **Recommended Fix**: Replace client polling with a serverless webhook architecture where Telegram pushes callbacks to your server, which then notifies clients via Server-Sent Events (SSE) or WebSockets.

* **Finding 8.2**:
  * **Classification**: Missing Control [CTRL]
  * **Severity**: Medium
  * **Evidence**: [`src/components/OrderSection.jsx`](file:///c:/Users/irfan/Desktop/SSolutions/src/components/OrderSection.jsx#L147) allows unlimited order submissions with no CAPTCHA or throttling.
  * **Risk**: Automated bots can flood the notification bot with thousands of spam orders.
  * **Affected Location**: `src/components/OrderSection.jsx`
  * **Why It Matters**: Overwhelms administrative communication channels and degrades bot responsiveness.
  * **Recommended Fix**: Implement Cloudflare Turnstile or Google reCAPTCHA v3 on order submission.

---

### 9. File Uploads
* **Status**: **Not Applicable**
* **Project Reality**: No file upload interfaces or storage integrations exist in the application.

---

### 10. Database Security
* **Status**: **Not Applicable**
* **Project Reality**: No database is used.

---

### 11. Secrets Management
* **Status**: **Confirmed Vulnerability** [VULN]
* **Project Reality**: Secrets are stored in `.env.example`, hardcoded in fallbacks, and inlined into static JS bundles.
* **Finding 11.1**:
  * **Classification**: Confirmed Vulnerability
  * **Severity**: Critical
  * **Evidence**: [`.env.example`](file:///c:/Users/irfan/Desktop/SSolutions/.env.example#L3-L6):
    ```
    VITE_TELEGRAM_BOT_TOKEN=[REDACTED_ACTIVE_TOKEN]
    VITE_TELEGRAM_CHAT_ID=[REDACTED_ACTIVE_CHAT_ID]
    ```
  * **Risk**: `.env.example` is tracked in Git. Anyone with repository read access receives active production credentials.
  * **Affected Location**: `.env.example` lines 3 and 6
  * **Why It Matters**: Violates core secrets management hygiene; leads to credential leakage upon git push.
  * **Recommended Fix**: Immediately sanitize `.env.example` with non-functional placeholders and rotate the token via `@BotFather`.

* **Finding 11.2**:
  * **Classification**: Confirmed Vulnerability
  * **Severity**: Critical
  * **Evidence**: Built bundle [`dist/assets/index-eba7ZkNy.js`](file:///c:/Users/irfan/Desktop/SSolutions/dist/assets/index-eba7ZkNy.js):
    Contains `const br="[REDACTED_TOKEN]"`.
  * **Risk**: The production token is published to all visitors of the website.
  * **Affected Location**: `dist/assets/*.js`, generated from `src/services/telegramService.js`
  * **Why It Matters**: Client-side secrets cannot be protected once bundled.
  * **Recommended Fix**: Shift secret consumption to a backend execution environment.

---

### 12. Encryption
* **Status**: **Security Weakness** [WEAK]
* **Project Reality**: HTTPS is enforced in transit, but customer data is unencrypted at rest in the client browser.
* **Finding 12.1**:
  * **Classification**: Security Weakness
  * **Severity**: Medium
  * **Evidence**: `vercel.json` line 30 enforces `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (In-transit encryption is strong). However, `localStorage` stores unencrypted PII at rest.
  * **Risk**: Any local device access exposes customer order history and contact info.
  * **Affected Location**: Browser `localStorage`
  * **Why It Matters**: Privacy risk for customers ordering from shared computers.
  * **Recommended Fix**: Avoid long-term persistence of PII in browser `localStorage`.

---

### 13. CORS
* **Status**: **Potential Risk Requiring Verification** [RISK]
* **Project Reality**: Static hosting provides standard CORS behavior; third-party Telegram API allows wildcard CORS.
* **Finding 13.1**:
  * **Classification**: Security Weakness
  * **Severity**: Medium
  * **Evidence**: The client executes requests directly against `api.telegram.org` because Telegram enables `Access-Control-Allow-Origin: *`.
  * **Risk**: While CORS allows the frontend to function without a backend, it enables unauthorized origins to make API requests using the exposed bot token.
  * **Affected Location**: `src/services/telegramService.js`
  * **Why It Matters**: Demonstrates reliance on third-party permissive CORS policies rather than a controlled internal API origin.
  * **Recommended Fix**: Restrict application network traffic to a first-party API domain.

---

### 14. Dependency Security
* **Status**: **Security Weakness** [WEAK]
* **Project Reality**: Runtime dependencies are lean; development build toolchain has 9 audit warnings.
* **Finding 14.1**:
  * **Classification**: Security Weakness
  * **Severity**: Medium
  * **Evidence**: Running `npm audit` reveals 9 vulnerabilities (3 moderate, 6 high):
    * `braces` (High) via `chokidar` / `tailwindcss` (GHSA-vfj7-8cjw-p6xm)
    * `esbuild` <=0.24.2 (Moderate) via `vite` (GHSA-67mh-4wv8-2f99)
    * `postcss-selector-parser` <7.1.6 (Moderate) via `postcss-nested` (GHSA-rj75-hqrm-r3gf)
  * **Risk**: While these dependencies operate at build-time rather than in the production browser runtime, `esbuild` can expose the local development server to unauthorized cross-origin requests.
  * **Affected Location**: `package.json`, `package-lock.json`
  * **Why It Matters**: Unpatched build dependencies pose risks to developer environments and build pipelines.
  * **Recommended Fix**: Update devDependencies in a controlled testing cycle (e.g. upgrading Vite and Tailwind dependencies when compatible).

---

### 15. Logging & Monitoring
* **Status**: **Security Weakness** [WEAK]
* **Project Reality**: Errors are logged to the browser console; no centralized monitoring exists.
* **Finding 15.1**:
  * **Classification**: Security Weakness
  * **Severity**: Low
  * **Evidence**: [`src/services/telegramService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/telegramService.js#L163) and [`src/services/pixelService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/pixelService.js#L48):
    ```javascript
    console.warn("Telegram sendMessage error:", result);
    console.log(`%c[Tracking Event Fired] %c${eventName}`, ..., params);
    ```
  * **Risk**: Dumps internal error responses and user interaction parameters into the browser console.
  * **Affected Location**: `src/services/telegramService.js`, `src/services/pixelService.js`
  * **Why It Matters**: Detailed logs in production facilitate reverse-engineering by attackers.
  * **Recommended Fix**: Wrap development console statements in `if (import.meta.env.DEV)` guards to silence logs in production builds.

---

### 16. Admin Security
* **Status**: **Confirmed Vulnerability** [VULN]
* **Project Reality**: Admin control flow relies on auto-detection and unauthenticated Telegram polling.
* **Finding 16.1**:
  * **Classification**: Confirmed Vulnerability
  * **Severity**: High
  * **Evidence**: [`src/services/telegramService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/telegramService.js#L20-L44):
    ```javascript
    export const autoDetectAdminChatId = async () => {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
      const data = await res.json();
      for (let i = data.result.length - 1; i >= 0; i--) {
        const item = data.result[i];
        const chat = item.message?.chat || ...;
        if (chat && chat.id) {
          setAdminChatId(chat.id.toString());
    ```
  * **Risk**: If the stored chat ID is unset or cleared, the code automatically assigns `targetChatId` to the sender of the most recent message to the bot. An attacker who messages the bot can hijack all subsequent customer order notifications.
  * **Affected Location**: `src/services/telegramService.js` lines 20–44
  * **Why It Matters**: Flawed dynamic configuration logic allows untrusted external users to reroute administrative traffic.
  * **Recommended Fix**: Delete `autoDetectAdminChatId()` completely. The destination Chat ID should be a hard-coded, server-only secret configuration.

---

### 17. Deployment & Infrastructure
* **Status**: **Missing Control** [CTRL]
* **Project Reality**: Vercel configuration provides standard security headers, but lacks Content Security Policy.
* **Finding 17.1**:
  * **Classification**: Missing Control
  * **Severity**: Medium
  * **Evidence**: [`vercel.json`](file:///c:/Users/irfan/Desktop/SSolutions/vercel.json#L4-L33) configures HSTS, X-Frame-Options, X-Content-Type-Options, but contains **no Content-Security-Policy (CSP)** entry.
  * **Risk**: Without a CSP header, the browser does not restrict where scripts can be loaded from or what external domains the page can make fetch/XHR connections to.
  * **Affected Location**: `vercel.json`
  * **Why It Matters**: CSP is a critical mitigation against cross-site scripting (XSS) and unauthorized data exfiltration.
  * **Recommended Fix**: Define a strict `Content-Security-Policy` header in `vercel.json`:
    ```json
    {
      "key": "Content-Security-Policy",
      "value": "default-src 'self'; script-src 'self' https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.telegram.org https://connect.facebook.net; img-src 'self' data: https:;"
    }
    ```

---

### 18. Data Privacy (GDPR & Customer PII)
* **Status**: **Confirmed Vulnerability** [VULN]
* **Project Reality**: Customer order details are exposed to all clients via the Telegram updates feed.
* **Finding 18.1**:
  * **Classification**: Confirmed Vulnerability
  * **Severity**: High
  * **Evidence**: [`src/services/telegramService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/telegramService.js#L252) executes `getUpdates` from every client browser on Step 3. The raw JSON returned by Telegram includes previous customer messages and callback data (`confirm_SOFT-ATD-*`, sender chat IDs, user names).
  * **Risk**: Any visitor observing network responses in browser DevTools can inspect other customers' orders and administrative interactions.
  * **Affected Location**: `src/services/telegramService.js` line 252
  * **Why It Matters**: Substantial breach of customer privacy and confidentiality.
  * **Recommended Fix**: Cease calling `getUpdates` from the client. Order status verification must be queried against a private backend API.

---

### 19. Error Handling
* **Status**: **Security Weakness** [WEAK]
* **Project Reality**: Error messages in the UI are sanitized, but raw network errors are logged to the console.
* **Finding 19.1**:
  * **Classification**: Recommendation [RECM]
  * **Severity**: Low
  * **Evidence**: [`PaymentGatewayPage.jsx`](file:///c:/Users/irfan/Desktop/SSolutions/src/components/payment/PaymentGatewayPage.jsx#L229):
    User-facing error messages are generic (`"ভুল TrxID"`, `"Please enter a valid TrxID"`), but `console.error` logs complete error objects.
  * **Risk**: Low direct impact, but provides diagnostic data to attackers analyzing API behaviors.
  * **Affected Location**: `src/components/payment/PaymentGatewayPage.jsx`
  * **Why It Matters**: Clean error hygiene prevents unintended information leakage.
  * **Recommended Fix**: Suppress console error logging in production builds.

---

### 20. Backup & Recovery
* **Status**: **Missing Control** [CTRL]
* **Project Reality**: No database exists; transactions exist only in ephemeral client storage and Telegram chat logs.
* **Finding 20.1**:
  * **Classification**: Missing Control
  * **Severity**: Medium
  * **Evidence**: Zero persistence logic exists outside the Telegram message thread and browser `localStorage`.
  * **Risk**: If the Telegram chat is cleared, the bot is blocked, or the administrator loses access to their Telegram account, all customer order history, transaction records, and fulfillments are irrevocably lost.
  * **Affected Location**: Entire project architecture
  * **Why It Matters**: Fundamental operational risk for business continuity and customer fulfillment disputes.
  * **Recommended Fix**: Integrate a persistent transactional database (e.g., Supabase, PostgreSQL, or MongoDB) with automated daily backups.

---

## Prioritized Remediation Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PHASE 1: IMMEDIATE ACTIONS                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Revoke the Telegram Bot Token via @BotFather.                       │
│ 2. Remove real credentials from .env.example (use placeholder strings).│
│ 3. Purge historical secrets from git history using git-filter-repo.   │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PHASE 2: ARCHITECTURE UPGRADE                     │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Build a secure serverless backend route (/api/orders).              │
│ 5. Move all Telegram Bot API calls to server-side code only.           │
│ 6. Delete client-side getUpdates polling loop.                         │
│ 7. Store admin Chat ID strictly in server environment variables.       │
│ 8. Remove autoDetectAdminChatId dynamic assignment logic.              │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASE 3: DEFENSE-IN-DEPTH HARDENING                  │
├────────────────────────────────────────────────────────────────────────┤
│ 9. Add Content-Security-Policy (CSP) header to vercel.json.            │
│ 10. Implement CAPTCHA (Cloudflare Turnstile) on order submission.      │
│ 11. Connect a persistent, backed-up database for order records.        │
│ 12. Suppress console logging in production builds.                     │
└────────────────────────────────────────────────────────────────────────┘
```

