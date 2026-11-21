# Finora — Testing & Setup Guide

## Overview

Finora is a React + Vite web app. All data currently runs **fully in-browser via `localStorage`** — no backend is required to run and test the app. Supabase integration is optional and documented in Part C below.

---

## Part A — Local Development Setup

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Git | Any | `git --version` |

---

### Step 1 — Clone / Open the Project

The project is already on your Desktop. Open a terminal and navigate to it:

```powershell
cd "C:\Users\Akasintech\Desktop\bootcamp\Finora"
```

---

### Step 2 — Install Dependencies

```powershell
npm install
```

> This installs React 19, Vite 8, Tailwind CSS 4, React Router 7, and Lucide icons.

---

### Step 3 — Start the Dev Server

```powershell
npm run dev
```

Expected output:
```
  VITE v8.1.5  ready in 1.2s

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Open **http://localhost:5173** in your browser.

---

## Part B — Demo Accounts & Test Scripts

The app is pre-seeded with four accounts. **No signup required** — just use the demo login buttons on the Login page.

### Demo Credentials

| Name | Email | Password | Role |
|------|-------|----------|------|
| Finora Admin | `finoraonlineglobalvest@gmail.com` | `any` | Admin |
| Alex Johnson | `alex@finora.app` | `any` | User |
| Sarah Jenkins | `sarah@finora.app` | `any` | User |
| Michael Chen | `michael@finora.app` | `any` | User |

> **Note**: The current auth system accepts any password — it matches by email only. This is by design for the prototype.

---

### Test Script 1 — Admin Flow

1. Go to `http://localhost:5173/login`
2. Click **"Login as Admin"** or enter `finoraonlineglobalvest@gmail.com` → click Login
3. You land on `/admin` — the **System Dashboard**

**Test: Mint Virtual Currency (Fund a User)**
- Click **"Mint Virtual Currency"** button
- Select **Alex Johnson** from the dropdown
- Enter amount: `$5,000`
- Add note: `"Test funding"`
- Click **Mint** — you'll see a success toast
- Open a new tab, log in as Alex → his dashboard balance shows `+$5,000` with a green glow animation

**Test: Adjust Loan & Savings Rates**
- Click **"Policy & Rates Settings"** (top right of Dashboard)
- Change **Savings APY** to `7.5%`
- Change **Min Loan** to `$1,000`, **Max Loan** to `$25,000`
- Click **Save Changes**
- Log in as any user → go to `/loans` — the slider and preview now reflect the new limits

**Test: View All Users**
- Go to `/admin/users`
- You see all 4 accounts with their balances and statuses
- Click **Suspend** on Sarah → her status changes to Suspended
- Try logging in as Sarah → you get an error: "This account has been suspended"

**Test: Simulate a Transaction Failure**
- Go to `/admin/transactions`
- Find transaction `tx_1001` (Alex → Sarah, $500)
- Click **⚡ Fail** in the Toggle column
- The status changes to **Failed** with a generated reason
- Now log in as Alex or Sarah → go to `/statements` → click `tx_1001` → both see the same **Failed** badge and reason text

---

### Test Script 2 — User Send Money Flow

1. Log in as **Alex Johnson** (`alex@finora.app`)
2. Click **Send Money** in the sidebar
3. **Step 1 — Recipient Lookup**: type `sarah@finora.app` or `ACC-392019` or `sarah.jenkins` → Sarah's name and avatar appears
4. **Step 2 — Amount**: enter `$300`, add note `"Lunch split"` → click Continue
5. **Step 3 — Review**: confirm amount, fee ($0.00), and recipient
6. **Step 4 — Success**: Transaction ID `tx_...` is shown (copyable)
7. Go to `/statements` — new transaction appears at the top
8. Log in as Sarah → her balance increased by $300

---

### Test Script 3 — Receive Money & Request Flow

1. Log in as **Sarah Jenkins**
2. Click **Receive Money** in the sidebar
3. The **Finora ID card** shows her account number, username, email and QR graphic
4. Click the **copy icon** next to `ACC-392019` — address is copied to clipboard
5. Scroll down to **Request Money** — enter `$150` and send to `alex@finora.app`
6. Log in as Alex → a notification appears in `/notifications` about Sarah's payment request

---

### Test Script 4 — Loans

1. Log in as **Sarah Jenkins** (she has no active loan)
2. Click **Loans** in the sidebar
3. Click **"Apply for Loan"**
4. Drag the amount slider to `$3,000`
5. Select **12 month** term
6. Add reason: `"New laptop"`
7. The **Repayment Preview** shows monthly payment, total interest, and total repayable
8. Click **Apply Now** — loan is approved instantly (under $10,000 auto-approval limit)
9. The Loans page now shows an active loan card with a progress bar and repayment schedule
10. Click **Repay** → enter an amount → the remaining balance decreases

---

### Test Script 5 — Savings

1. Log in as **Michael Chen** (he has $45,000 in savings)
2. Click **Savings** in the sidebar
3. The hero card shows balance with estimated monthly and yearly interest at the admin-set APY
4. Click **Deposit** tab → enter `$2,000` → click **Deposit to Savings** — balance updates
5. Click **Withdraw** tab → enter `$500` → balance decreases
6. Click **Simulate Interest Credit (Demo)** → an interest payment is credited

---

### Test Script 6 — Messaging (Support Chat)

**Admin sends a message to Alex:**
1. Log in as Admin → go to `/admin/inbox`
2. Click on **Alex Johnson** in the left conversation list
3. Type: `"Hi Alex, how can we help you today?"`
4. Click the **paperclip icon** → attach a test image or PDF
5. Hit Send — the message appears as a lime-tinted bubble on the right side

**User replies:**
1. Open a new browser tab, log in as **Alex**
2. Click **Support** in the sidebar — a 🔴 badge shows 1 unread
3. See the admin's message as a lime-tinted bubble
4. Type a reply and send — the admin inbox badge updates

**Contact Support from a failed transaction:**
1. As Alex, go to `/statements`
2. Find the failed transaction `tx_1001` (if you toggled it in Script 1)
3. Click the transaction to open the detail modal
4. Click **"Contact Support About This"** (red button)
5. You're taken to `/support` with the TX ID pre-filled: `Re: Transaction tx_1001 —`

---

### Test Script 7 — Full Admin ↔ User Fund from Chat

1. Log in as Admin → go to `/admin/inbox` → open Alex's thread
2. In the **right-side reference panel**, click **Fund Account**
3. Enter `$1,500` and note `"Bonus credit via chat"`
4. Click **Send Funds**
5. A confirmation message automatically appears in the chat thread
6. Switch to Alex's tab → the `/dashboard` balance shows +$1,500 with a glow highlight
7. Alex's notifications show a new "Funds Received!" alert

---

## Part C — Supabase Setup (Optional Backend)

The app currently uses `localStorage` for all data. Supabase is not connected yet — the `VITE_SUPABASE_URL` in `.env` is your project URL for when you're ready to integrate it.

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Name it: `finora`
4. Choose a region closest to you
5. Set a strong database password (save it!)
6. Click **Create New Project** — wait ~2 minutes for provisioning

---

### Step 2 — Get Your API Keys

1. In your Supabase project, go to **Settings → API**
2. Copy:
   - **Project URL** → looks like `https://xxxx.supabase.co`
   - **anon public key** → a long JWT string

---

### Step 3 — Update Your `.env` File

Open `C:\Users\Akasintech\Desktop\bootcamp\Finora\.env` and replace the values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> **Your current `.env` already has a valid Supabase project URL and anon key filled in.** If you want to use a fresh project, replace both values.

---

### Step 4 — Run the Schema & Seed SQL

1. In your Supabase dashboard, go to **SQL Editor → New Query**
2. Open the file [`dataset.sql`](file:///c:/Users/Akasintech/Desktop/bootcamp/Finora/dataset.sql) in any text editor
3. Copy the **entire contents** and paste into the SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. You should see: `Success. No rows returned.`

Verify it worked by running in a new SQL query:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see: `accounts`, `conversations`, `loan_installments`, `loans`, `messages`, `notifications`, `savings_meta`, `system_settings`, `transactions`, `users`.

---

### Step 5 — Install Supabase JS Client

```powershell
npm install @supabase/supabase-js
```

---

### Step 6 — Create Supabase Client

Create the file `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### Step 7 — Verify Connection

Add this temporary check to `src/App.jsx` or run in the browser console:

```js
import { supabase } from './lib/supabase';
const { data, error } = await supabase.from('users').select('*');
console.log(data, error);
```

You should see all 4 seeded users logged to the console.

---

## Part D — Reset & Troubleshooting

### Reset all localStorage data (start fresh)

Open browser DevTools (`F12`) → Console → paste:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('finora_'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

This restores all accounts, balances, and transactions to their original seed state.

---

### Common Issues

| Issue | Fix |
|-------|-----|
| Blank white page | Check terminal for build errors; run `npm install` again |
| "Cannot find module" | Run `npm install` to restore node_modules |
| Fonts not loading | Check internet connection (Google Fonts CDN required) |
| Balance not updating after admin mint | Hard refresh the user tab (`Ctrl+Shift+R`) |
| Supabase 401 error | Check that anon key in `.env` matches your Supabase project |
| Supabase 42501 (RLS denied) | Re-run the `CREATE POLICY` section of `dataset.sql` |
| Port 5173 already in use | Run `npm run dev -- --port 3000` |

---

## Part E — Full Route Map

| Route | Who | Description |
|-------|-----|-------------|
| `/` | Public | Homepage |
| `/about` | Public | About Finora |
| `/security` | Public | Security info page |
| `/login` | Public | Login with demo buttons |
| `/signup` | Public | Create new user account |
| `/dashboard` | User | Balance hero + quick actions |
| `/transfers` | User | Send money 4-step flow |
| `/receive` | User | Finora ID card + request money |
| `/loans` | User | Apply, view, repay loans |
| `/savings` | User | Deposit/withdraw savings |
| `/statements` | User | Full transaction history |
| `/notifications` | User | Alert center |
| `/support` | User | Chat with Finora Support |
| `/profile` | User | Account settings & password |
| `/admin` | Admin | Dashboard + analytics + mint |
| `/admin/users` | Admin | User management |
| `/admin/transactions` | Admin | Audit ledger + failure toggle |
| `/admin/inbox` | Admin | Support inbox + chat |


