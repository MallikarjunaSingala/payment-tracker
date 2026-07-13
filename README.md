# Payment Tracker

A contractor payment tracking dashboard backed by Google Sheets. Drill down from
**Contractors → Projects → Invoices/Payments**, all pulled live from a Google Sheet
via the Sheets API (v4).

Built with Next.js 14 (App Router), React, and Tailwind CSS. Ready to deploy to Vercel.

---

## 1. How the data maps to the app

Your spreadsheet has three tabs. Here's exactly how each one is used:

### `Customers` tab (one row = one **project**)

| Column | Used as |
|---|---|
| `CustomerName` | Project name (this is the "customer" in your sheet, but functionally it's a project/job) |
| `Client` | **Contractor** name — this is what the dashboard groups by |
| `TotalAmount` | Project total amount |
| `TotalPayment` | Project total paid |
| `DueAmount` | Project balance |
| `Active` | `TRUE`/`FALSE` — shown as an Active/Closed badge |
| `Contact` | Phone number shown for the project and rolled up to the contractor |
| `Employee` | Shown as "Handled by" on the project card |
| `Last Reminded`, `BalanceRange`, `Notes` | Captured but only `Notes` is currently displayed (as a callout on the project page) |

The **Contractors** list on the dashboard is derived by grouping all `Customers` rows
by their `Client` value and summing `TotalAmount` / `TotalPayment` / `DueAmount`.

### `Invoices` tab (one row = one **invoice**)

Linked to a project via `CustomerName`. Columns used: `InvoiceNumber`, `InvoiceDate`,
`InvoiceAmount`, `PaidAmount`, `BalanceAmount`, `PaymentStatus`.

### `CustomerPayments` tab (one row = one **payment transaction**)

⚠️ Note the tab name has **no space** — it's `CustomerPayments`, not `Customer Payments`.
Linked to a project via `CustomerName`. Columns used: `PaymentDate`, `ReceiptNo`, `Amount`,
`Balance`, `PaymentType`, `Remarks`.

If you rename any of these tabs or columns, update `lib/sheets.js` to match — the column
names are read literally from row 1 of each tab.

---

## 2. Google Sheets API Setup Guide (Service Account)

You need a Google Cloud service account with read access to your sheet. This takes
about 5 minutes.

1. **Create/select a Google Cloud project**
   Go to https://console.cloud.google.com/ and create a new project (or pick an existing one).

2. **Enable the Google Sheets API**
   In the left menu: *APIs & Services → Library* → search "Google Sheets API" → **Enable**.

3. **Create a Service Account**
   *APIs & Services → Credentials → Create Credentials → Service account.*
   Give it any name (e.g. `payment-tracker-reader`). You don't need to grant it any
   project-level IAM roles — click through to "Done".

4. **Create a JSON key**
   Open the service account you just created → **Keys** tab → **Add Key → Create new key**
   → choose **JSON** → it downloads a `.json` file. Keep this file private; it's a credential.

5. **Copy the two values you need out of the JSON file**
   Open the downloaded file. You need:
   - `client_email` → this is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → this is your `GOOGLE_PRIVATE_KEY` (a long string starting with
     `-----BEGIN PRIVATE KEY-----`)

6. **Share your Google Sheet with the service account**
   Open your spreadsheet → **Share** → paste the `client_email` address → give it
   **Viewer** access → Send. (It doesn't need Editor access since the app only reads data.)

7. **Get your Sheet ID**
   From the sheet URL:
   `https://docs.google.com/spreadsheets/d/`**`13lRWQt38tS_PvU1974g3C5ig144Ss2Q_liB-zgYcrwY`**`/edit`
   The bolded part is your `GOOGLE_SHEET_ID`.

That's everything you need for the three environment variables below.

---

## 3. Environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Then fill in:

```
GOOGLE_SHEET_ID=13lRWQt38tS_PvU1974g3C5ig144Ss2Q_liB-zgYcrwY
GOOGLE_SERVICE_ACCOUNT_EMAIL=payment-tracker-reader@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
SHEETS_CACHE_TTL_MS=30000
```

**Important about `GOOGLE_PRIVATE_KEY`:** keep it wrapped in double quotes and keep the
`\n` sequences literally as text (don't turn them into real line breaks) — the app
converts `\n` to real newlines at runtime.

---

## 4. Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — you should see your contractors list. If you see an error
banner instead, it will tell you exactly what's wrong (missing env vars, sheet not shared,
wrong tab name, etc.).

```bash
npm run build   # production build check
npm start        # run the production build locally
```

---

## 5. Deploy to Vercel (free tier)

1. **Push this project to a GitHub repository** (Vercel deploys from Git).
   ```bash
   git init
   git add .
   git commit -m "Initial payment tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/payment-tracker.git
   git push -u origin main
   ```

2. **Import into Vercel**
   Go to https://vercel.com/new, sign in (GitHub login is easiest), and import the repo.
   Vercel auto-detects Next.js — leave the build settings as default.

3. **Add environment variables**
   In the import screen (or later under *Project → Settings → Environment Variables*),
   add the same three/four variables from `.env.local`:
   `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SHEETS_CACHE_TTL_MS`.
   Apply them to **Production**, **Preview**, and **Development** environments.

   For `GOOGLE_PRIVATE_KEY`, paste the value including the `\n` sequences and surrounding
   quotes exactly as in `.env.example`.

4. **Deploy**
   Click **Deploy**. Vercel builds and gives you a URL like `payment-tracker.vercel.app`.
   Every time you push to `main`, Vercel redeploys automatically.

5. **Verify**
   Open the deployed URL. You should see the contractor list with live data from your sheet.

---

## 6. Point payments.plyvo.in at Vercel (GoDaddy subdomain setup)

You'll add the subdomain in **both** places: Vercel (so it knows to serve your app there)
and GoDaddy (so DNS routes traffic to Vercel).

### In Vercel
1. Open your project → **Settings → Domains**.
2. Type `payments.plyvo.in` and click **Add**.
3. Vercel will show you a DNS record to create — for a subdomain it's almost always a
   **CNAME** record pointing to `cname.vercel-dns.com`. Leave this tab open; you'll need
   the exact value it shows you.

### In GoDaddy
1. Log in to https://dcc.godaddy.com/ and go to **My Products → Domains → plyvo.in → DNS**
   (or *Manage DNS*).
2. Click **Add** a new DNS record:
   - **Type:** `CNAME`
   - **Name:** `payments`
   - **Value:** `cname.vercel-dns.com` (use exactly what Vercel showed you in the previous step)
   - **TTL:** leave default (1 hour is fine)
3. Save the record.

### Back in Vercel
- Return to the Domains screen and click **Refresh/Verify**. DNS propagation is usually
  quick (minutes) but can take up to a few hours. Once verified, Vercel automatically
  issues an SSL certificate for `payments.plyvo.in` — no extra steps needed.

Once it's verified, `https://payments.plyvo.in` will serve the app.

---

## 7. Production notes

- **Data freshness:** pages are server-rendered on every request (`export const dynamic
  = "force-dynamic"`), and sheet data is cached in memory for `SHEETS_CACHE_TTL_MS`
  (default 30 seconds) to avoid hammering the Sheets API. Lower this value for fresher
  data at the cost of more API calls; raise it if you hit Google's rate limits.
- **Error handling:** every page wraps its data fetch in a try/catch and renders a clear
  error panel (missing credentials, sheet not shared, wrong tab name, network issues)
  instead of crashing. There's also a global `error.js` boundary and a custom 404 page.
- **Security — please read:** as currently configured, your Google Sheet is viewable by
  anyone with the link (that's how this app was able to inspect its structure while
  building it). Since it contains customer names, phone numbers, and financial balances,
  consider switching link sharing to **"Restricted"** in the sheet's Share settings once
  you've shared it with the service account email — the app doesn't need public access,
  only the service account does.
- **Bundle size:** the app uses `google-auth-library` plus a direct `fetch` call to the
  Sheets REST API rather than the full `googleapis` package, which is much lighter and
  faster to cold-start on Vercel's serverless functions.
- **No secrets in git:** `.env.local` is git-ignored. Never commit your service account
  JSON key or paste it directly into code — only the two extracted values
  (`client_email`, `private_key`) go into environment variables.

---

## 8. Project structure

```
payment-tracker/
├── app/
│   ├── page.js                     # Dashboard — all contractors
│   ├── contractor/[name]/page.js   # Contractor's projects
│   ├── project/[name]/page.js      # Project statement (invoices + payments)
│   ├── layout.js, loading.js, error.js, not-found.js
│   └── globals.css
├── components/                     # UI building blocks (cards, tables, states)
├── lib/
│   ├── sheets.js                   # Google Sheets auth + data fetching/aggregation
│   └── format.js                   # Currency/date/phone formatting helpers
├── .env.example
└── package.json
```

## 9. Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Missing Google Sheets credentials" error | Env vars not set — check `.env.local` (dev) or Vercel project settings (prod) |
| "Access denied reading..." | Sheet isn't shared with the service account email, or shared as something other than Viewer |
| "Sheet or tab not found" | `GOOGLE_SHEET_ID` is wrong, or a tab was renamed — check exact tab names match `Customers`, `Invoices`, `CustomerPayments` |
| Contractor/project totals look off | Check `TotalAmount`/`TotalPayment`/`DueAmount` in `Customers` are formatted as currency text (e.g. `₹1,234.00`) — the parser strips everything except digits, `.` and `-` |
