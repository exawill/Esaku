# Esaku — QRIS Payment Gateway

Modern QRIS payment gateway for Indonesia. Flat 0.7% fee per transaction, fast
withdrawals to bank or e-wallet, and a clean dashboard.

## Stack

- Node.js + Express (server)
- MySQL (Hostinger) via `mysql2/promise`
- HTML5 + Tailwind CSS + vanilla JavaScript (frontend)
- Minimal TypeScript for shared type definitions
- Hostinger OAuth + email/password authentication
- JWT (httpOnly cookie) sessions

## Project layout

```
server/            Express server, routes, db, middleware
  index.js         Entry point + clean URL routing
  db.js            MySQL connection pool, schema bootstrap, settings helpers
  middleware/      Auth middleware (JWT cookies)
  routes/          auth, qris, withdrawal, transactions, profile, dashboard, admin
  types.ts         Shared TypeScript type definitions
public/            Static frontend (clean URL friendly)
  index.html       Landing page (Home, Product, Pricing, Features)
  auth.html        Sign-in / sign-up
  dashboard.html   User dashboard with 7/30/90 day bar chart
  generate-qris.html
  withdrawal.html
  transactions.html
  profile.html
  admin.html       Admin CMS
  js/              i18n, theme, common, shell
  css/app.css      Prebuilt frontend CSS
  assets/          Logo, banner, favicon
scripts/init-db.js One-shot DB initializer
```

## URLs

Clean URLs only:

- `/` landing
- `/demo` interactive desktop demo (no sign-up required)
- `/sign-in` · `/sign-up`
- `/dashboard`
- `/generate-qris`
- `/withdrawal`
- `/transactions`
- `/profile`
- `/admin` (admin only)

Any `*.html` URL is permanently redirected to its clean form
(`/index.html` → `/`, `/auth.html` → `/sign-in`, everything else
strips the extension).

## Setup

1. Create a Hostinger MySQL database, then copy `.env.example` to `.env` and fill in:

   ```env
   DB_HOST=...
   DB_USER=...
   DB_PASSWORD=...
   DB_NAME=esaku

   JWT_SECRET=long-random-string
   APP_URL=https://esaku.xyz

   HOSTINGER_CLIENT_ID=...
   HOSTINGER_CLIENT_SECRET=...
   HOSTINGER_REDIRECT_URI=https://esaku.xyz/auth/hostinger/callback
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   The frontend CSS is already built and served from `public/css/app.css`. If you want to re-run the demo build path, use:

   ```bash
   npm run build:css
   ```

3. Initialize the database (creates tables, default settings, and the default admin):

   ```bash
   npm run db:init
   ```

   The default admin (`Admin@esaku.xyz`) is created with a random password printed
   to stdout exactly once — save it. You can change it from `/profile` after
   logging in.

4. Start:

   ```bash
   npm start
   # or
   npm run dev
   ```

## Pricing model (configurable via Admin CMS)

- QRIS: flat 0.7% per paid transaction (deducted from inflow)
- Withdrawal: minimum **IDR 50,000**
- Bank transfer fee: **IDR 6,500** (default — example: IDR 50,000 + 6,500 = IDR 56,500 debit)
- E-wallet fee: **IDR 2,500** (default — example: IDR 50,000 + 2,500 = IDR 52,500 debit)
- QRIS expiry: **15 minutes** by default; admin can change in CMS.

## Admin CMS

`/admin` exposes:

- **QRIS Provider API** — pick which upstream API generates QRIS payloads
  (internal / Midtrans / Xendit / iPaymu / custom), with merchant ID, base URL,
  API key, and expiry-minutes.
- **Fees** — QRIS percent, withdrawal min, bank/e-wallet flat fees.
- **Branding** — site name, logo URL, banner URL.
- **Withdrawals queue** — complete or fail (refunds balance) pending
  withdrawals.
- **Users** — view all users, balances, roles, sign-up dates.

## Notes

- The bundled "internal" QRIS generator is a placeholder payload string suitable
  for development. Switch to a real provider in the Admin CMS before going live.
- **Real-time Confirmation**: The QRIS page polls the backend status and automatically updates to a success state with a checkmark and audible notification upon payment.
- **Test Role**: A `test` role is available for accounts that need to use developer tools (like `mock-pay`) without full administrative access.
- **System Reset**: Administrators can perform a full platform reset (clearing all transactions and zeroing balances) through the "Danger Zone" in the CMS.
- **Advanced Analytics**: The Admin CMS includes unified time-series charts for revenue and platform-wide activity tracking.
- Mock-pay endpoint (`POST /api/qris/:id/mock-pay`) is restricted to **admin** and **test** roles only.
