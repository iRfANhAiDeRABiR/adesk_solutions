# Meta Conversions API & Security Audit Report
**Software Solutions BD — Autodesk Subscriptions**
**Audit Date:** October 21, 2026
**Lead Security Auditor:** Senior Application Security Engineer

---

## 1. Executive Summary

This report documents the security audit and architectural hardening of the **Meta Conversions API (CAPI)** and **Meta Pixel** integration for **Software Solutions BD**.

A critical security objective was addressing the previous exposure of a Meta Conversions API access token, isolating privileged credentials from client bundles, implementing authoritative server-side Purchase event generation tied to genuine administrative verification, and enforcing exact event deduplication between browser and server.

---

## 2. Investigation of Compromised & Exposed Credentials

### 2.1 Compromised Meta CAPI Access Token
- **Finding:** A previously generated Meta Conversions API token starting with `EAANoux...` had been exposed.
- **Remediation:**
  - The token string was completely purged from local files and `.env`.
  - Automated tests (`tests/security/metaCapi.test.js`) enforce that `EAANoux...` and `META_CAPI_ACCESS_TOKEN` never appear in `src/`, `dist/`, or `.env.example`.
  - The repository owner must generate a fresh System User Access Token in Meta Events Manager and set it exclusively in Vercel project environment variables.

### 2.2 Telegram Bot Credentials Investigation
- **Finding:** Telegram bot token (`8879982228:AAEVh...`) was previously referenced in client-side polling files.
- **Remediation Completed:**
  - Client-side Telegram polling was replaced with backend endpoint `/api/order/verify`.
  - All bot tokens are quarantined to serverless functions (`api/order/submit.js`, `api/order/verify.js`, `api/telegram/webhook.js`).
  - Automated credential scanner (`tests/security/secrets.test.js`) scans every `.js`, `.jsx`, and `.html` file in `src/` and `dist/` on every build to guarantee 0 exposed bot tokens.

### 2.3 Verification of Git Inclusions (.gitignore)
- **Status:** Verified.
- `.env`, `.env*`, `.env.local`, `.env.*.local`, `*.env` are strictly excluded from git tracking in `.gitignore`.
- `.env.example` contains only safe placeholder values:
  - `META_PIXEL_ID=YOUR_META_DATASET_ID`
  - `META_CAPI_ACCESS_TOKEN=SET_PRIVATELY_IN_VERCEL`
  - `VITE_FB_PIXEL_ID=YOUR_META_DATASET_ID`

---

## 3. Customer Data Normalization & SHA-256 Hashing Verification

In strict compliance with Meta's Customer Information Parameters specifications:

1. **Email (`em`):**
   - Whitespace trimmed, converted to lowercase, hashed using SHA-256.
   - Idempotency guard: Already-hashed 64-character lowercase hex strings are never rehashed.
2. **Phone Number (`ph`):**
   - Strips spaces, dashes, parentheses.
   - Normalizes Bangladeshi numbers:
     - `017XXXXXXXX` (11 digits) → `88017XXXXXXXX` (13 digits).
     - `+88017XXXXXXXX` → `88017XXXXXXXX`.
   - Hashed using SHA-256.
3. **Unhashed Technical Identifiers:**
   - `client_ip_address`: Genuine customer IP extracted from `x-forwarded-for` header at submission time.
   - `client_user_agent`: Customer browser User-Agent header.
   - `fbp`: First-party cookie `_fbp`.
   - `fbc`: First-party cookie `_fbc` or click-derived parameter.
4. **No Null Arrays:**
   - Unavailable optional fields are cleanly omitted from `user_data`.
   - Verified that `null` or empty strings are never transmitted inside array structures.

---

## 4. Payment Confirmation Rules & Anti-Fraud Verification

Under no circumstances can an arbitrary client request or user trigger a server-side `Purchase` event.

### State Transition Safeguards:
1. **Pending Status:** Order starts strictly in `PENDING` status upon submission.
2. **Authoritative Price Recalculation:** The server rejects all client-supplied prices and recalculates the total from trusted immutable definitions (`AUTHORITATIVE_PLANS`).
3. **Admin Verification Barrier:**
   - The status can only transition to `CONFIRMED` when an authorized administrator whose Telegram user ID matches `ALLOWED_ADMIN_IDS` clicks `[✅ Confirm]`.
   - The incoming webhook request is authenticated using `TELEGRAM_WEBHOOK_SECRET` (`x-telegram-bot-api-secret-token`).
4. **Idempotent Purchase Generation:**
   - The backend checks `order.capiDispatched`.
   - If an admin clicks the button twice or a webhook callback is replayed, `isFirstConfirmation` is `false`, completely preventing duplicate CAPI purchase dispatches.
5. **Shared Event ID Deduplication:**
   - Both browser Pixel and server CAPI share the deterministic Event ID: `purchase_${order.refId}`.
   - Meta automatically deduplicates the events, preventing double-counting in ad campaign attribution.

---

## 5. Automated Test Suite Results

All **40 tests across 11 test suites** passed with 0 failures:

| Test Suite | Tests | Result |
| :--- | :--- | :--- |
| **Meta CAPI Normalization & Hashing** | 5 | ✅ PASS |
| **Meta CAPI Payload & Deduplication** | 2 | ✅ PASS |
| **Meta CAPI Payment Confirmation & Idempotency** | 4 | ✅ PASS |
| **Meta CAPI Security & Credential Scanning** | 4 | ✅ PASS |
| **Meta Graph API Network & Mock Dispatch** | 4 | ✅ PASS |
| **Order Lifecycle & Payment Integrity** | 5 | ✅ PASS |
| **Pricing & Discount Integrity** | 3 | ✅ PASS |
| **Rate Limiting & Privacy Security** | 2 | ✅ PASS |
| **Exposed Secret & Credential Scanning** | 3 | ✅ PASS |
| **Telegram Integration & Callback Security** | 4 | ✅ PASS |
| **Input Validation & Sanitization** | 4 | ✅ PASS |
| **Total** | **40** | **100% Passed (0 Failures)** |

---

## 6. Security Checklist for Production

- [x] All access tokens and bot secrets removed from client bundles
- [x] Automated test verifying no secrets in `dist/assets/*.js`
- [x] Safe `.env.example` with non-working placeholders
- [x] `.env` and local files ignored by `.gitignore`
- [x] Duplicate `AddPaymentInfo` event call eliminated
- [x] SHA-256 hashing and normalization active for email & BD phone numbers
- [x] Customer browser metadata (`_fbp`, `_fbc`, IP, UA) captured at customer interaction time
- [x] Server-side CAPI Purchase dispatched only after authorized admin confirmation
- [x] Shared `purchaseEventId` matching browser Pixel and server CAPI
- [x] Server-side idempotency preventing replay purchase creation
- [x] Marketing consent respected across Pixel and CAPI
