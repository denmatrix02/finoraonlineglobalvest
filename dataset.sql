-- ============================================================
--  FINORA BANK — Supabase Database Schema & Seed Data
--  Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── EXTENSIONS ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
--  TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id           TEXT PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  username     TEXT UNIQUE NOT NULL,
  phone        TEXT DEFAULT '',
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar       TEXT DEFAULT '',
  joined       DATE DEFAULT CURRENT_DATE,
  status       TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
  account_no   TEXT UNIQUE NOT NULL,
  password     TEXT DEFAULT '',
  external_bank JSONB DEFAULT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE: accounts  (one row per user, tracks balances)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounts (
  user_id      TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  checking     NUMERIC(15,2) DEFAULT 0.00,
  savings      NUMERIC(15,2) DEFAULT 0.00,
  loan         NUMERIC(15,2) DEFAULT 0.00,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE: transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id                TEXT PRIMARY KEY,
  timestamp         TIMESTAMPTZ DEFAULT now(),
  type              TEXT NOT NULL CHECK (type IN ('transfer','deposit','withdraw','loan_disbursement','loan_repayment')),
  category          TEXT NOT NULL,
  sender_id         TEXT REFERENCES public.users(id),
  sender_name       TEXT,
  sender_account    TEXT,
  recipient_id      TEXT REFERENCES public.users(id),
  recipient_name    TEXT,
  recipient_account TEXT,
  amount            NUMERIC(15,2) NOT NULL,
  status            TEXT DEFAULT 'Completed' CHECK (status IN ('Completed','Pending','Failed')),
  note              TEXT DEFAULT '',
  failure_reason    TEXT DEFAULT NULL
);

-- ============================================================
--  TABLE: loans
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loans (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount             NUMERIC(15,2) NOT NULL,
  remaining_amount   NUMERIC(15,2) NOT NULL,
  interest_rate      NUMERIC(5,2) NOT NULL,
  term_months        INTEGER NOT NULL,
  monthly_payment    NUMERIC(15,2) NOT NULL,
  status             TEXT DEFAULT 'Active' CHECK (status IN ('Active','Paid','Defaulted')),
  reason             TEXT DEFAULT '',
  disbursed_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE: loan_installments  (repayment schedule)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loan_installments (
  id              TEXT PRIMARY KEY,
  loan_id         TEXT NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  due_date        DATE NOT NULL,
  amount          NUMERIC(15,2) NOT NULL,
  status          TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Paid'))
);

-- ============================================================
--  TABLE: savings_meta  (accrued interest tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.savings_meta (
  user_id            TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  accrued_interest   NUMERIC(15,2) DEFAULT 0.00,
  last_credited_at   DATE DEFAULT CURRENT_DATE
);

-- ============================================================
--  TABLE: system_settings  (admin-controlled rates & limits)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id                          TEXT PRIMARY KEY DEFAULT 'global',
  savings_apy                 NUMERIC(5,2) DEFAULT 5.20,
  loan_base_rate              NUMERIC(5,2) DEFAULT 4.50,
  auto_approval_loan_limit    NUMERIC(15,2) DEFAULT 10000.00,
  min_loan_amount             NUMERIC(15,2) DEFAULT 500.00,
  max_loan_amount             NUMERIC(15,2) DEFAULT 50000.00,
  savings_payout_frequency    TEXT DEFAULT 'Monthly',
  transparent_symmetric_audits BOOLEAN DEFAULT true,
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN DEFAULT false,
  timestamp   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE: conversations  (support messaging threads)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  admin_unread     INTEGER DEFAULT 0,
  user_unread      INTEGER DEFAULT 0,
  last_timestamp   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE: messages  (individual chat messages)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id               TEXT PRIMARY KEY,
  conversation_id  TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id        TEXT NOT NULL REFERENCES public.users(id),
  sender_role      TEXT NOT NULL CHECK (sender_role IN ('admin','user')),
  content          TEXT NOT NULL DEFAULT '',
  tx_context       TEXT DEFAULT NULL,
  attachments      JSONB DEFAULT '[]'::jsonb,
  timestamp        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_meta   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow anon + authenticated to read/write for prototype purposes
-- (Tighten these per-table policies before production deployment)
CREATE POLICY "allow_all_anon"      ON public.users             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon"      ON public.accounts          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon"      ON public.transactions      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon"      ON public.loans             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon"      ON public.loan_installments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon"      ON public.savings_meta      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon"      ON public.notifications     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon"      ON public.conversations     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon"      ON public.messages          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon"      ON public.system_settings   FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
--  SEED DATA — Users
-- ============================================================
INSERT INTO public.users (id, email, password, name, username, phone, role, avatar, joined, status, account_no) VALUES
  ('usr_admin',   'finoraonlineglobalvest@gmail.com', 'Finorabank@2026', 'Finora Admin', 'finora.admin', '+1 (555) 000-0001', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',   '2025-01-10', 'Active', 'ADM-0019283'),
  ('usr_alex',    'alex@finora.app', 'password123', 'Alex Johnson',  'alex.johnson',  '+1 (555) 849-2040', 'user',  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',  '2025-02-14', 'Active', 'ACC-849204'),
  ('usr_sarah',   'sarah@finora.app', 'password123', 'Sarah Jenkins', 'sarah.jenkins', '+1 (555) 392-0190', 'user',  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '2025-03-01', 'Active', 'ACC-392019'),
  ('usr_michael', 'michael@finora.app', 'password123', 'Michael Chen',  'michael.chen',  '+1 (555) 582-9100', 'user',  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',  '2025-03-12', 'Active', 'ACC-582910')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  SEED DATA — Accounts (balances)
-- ============================================================
INSERT INTO public.accounts (user_id, checking, savings, loan) VALUES
  ('usr_admin',    1000000.00, 0.00,      0.00),
  ('usr_alex',     24500.00,   12000.00,  5000.00),
  ('usr_sarah',    8750.00,    3200.00,   0.00),
  ('usr_michael',  15300.00,   45000.00,  10000.00)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
--  SEED DATA — System Settings
-- ============================================================
INSERT INTO public.system_settings (id, savings_apy, loan_base_rate, auto_approval_loan_limit, min_loan_amount, max_loan_amount, savings_payout_frequency) VALUES
  ('global', 5.20, 4.50, 10000.00, 500.00, 50000.00, 'Monthly')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  SEED DATA — Transactions
-- ============================================================
INSERT INTO public.transactions (id, timestamp, type, category, sender_id, sender_name, sender_account, recipient_id, recipient_name, recipient_account, amount, status, note) VALUES
  ('tx_1001', '2026-07-22 14:20:00+00', 'transfer',          'Transfer Out',          'usr_alex',    'Alex Johnson',           'ACC-849204', 'usr_sarah',   'Sarah Jenkins',          'ACC-392019', 500.00,   'Completed', 'Dinner & Drinks Split'),
  ('tx_1000', '2026-07-21 09:15:00+00', 'deposit',           'Admin Credit',       'usr_admin',   'Finora Admin (System)', 'ADM-0019283','usr_alex',   'Alex Johnson',           'ACC-849204', 10000.00, 'Completed', 'Initial Account Funding'),
  ('tx_0999', '2026-07-20 18:45:00+00', 'loan_disbursement', 'Loan Disbursement',     'usr_admin',   'FINORA BANK Vault',     'ADM-0019283','usr_michael','Michael Chen',           'ACC-582910', 10000.00, 'Completed', 'Approved Business Expansion Loan'),
  ('tx_0998', '2026-07-19 11:30:00+00', 'transfer',          'Transfer Out',          'usr_sarah',   'Sarah Jenkins',          'ACC-392019', 'usr_alex',   'Alex Johnson',           'ACC-849204', 250.00,   'Completed', 'Netflix & Spotify Split'),
  ('tx_0997', '2026-07-18 16:05:00+00', 'deposit',           'Admin Credit',       'usr_admin',   'Finora Admin (System)', 'ADM-0019283','usr_sarah',  'Sarah Jenkins',          'ACC-392019', 5000.00,  'Completed', 'Welcome bonus funding'),
  ('tx_0996', '2026-07-17 08:20:00+00', 'loan_repayment',    'Loan Repayment',        'usr_alex',    'Alex Johnson',           'ACC-849204', 'usr_admin',  'FINORA BANK Vault',     'ADM-0019283',416.67, 'Completed', 'Monthly installment #1')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  SEED DATA — Loans
-- ============================================================
INSERT INTO public.loans (id, user_id, amount, remaining_amount, interest_rate, term_months, monthly_payment, status, reason) VALUES
  ('loan_alex_001',    'usr_alex',    5000.00,  4583.33, 4.50, 12, 416.67,  'Active', 'Home office equipment'),
  ('loan_michael_001', 'usr_michael', 10000.00, 9500.00, 4.50, 24, 437.63, 'Active', 'Business expansion')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  SEED DATA — Loan Installments (first 3 for each loan)
-- ============================================================
INSERT INTO public.loan_installments (id, loan_id, due_date, amount, status) VALUES
  ('inst_alex_001_1', 'loan_alex_001', '2026-08-01', 416.67, 'Pending'),
  ('inst_alex_001_2', 'loan_alex_001', '2026-09-01', 416.67, 'Pending'),
  ('inst_alex_001_3', 'loan_alex_001', '2026-10-01', 416.67, 'Pending'),
  ('inst_mich_001_1', 'loan_michael_001', '2026-08-01', 437.63, 'Pending'),
  ('inst_mich_001_2', 'loan_michael_001', '2026-09-01', 437.63, 'Pending'),
  ('inst_mich_001_3', 'loan_michael_001', '2026-10-01', 437.63, 'Pending')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  SEED DATA — Savings Meta
-- ============================================================
INSERT INTO public.savings_meta (user_id, accrued_interest, last_credited_at) VALUES
  ('usr_alex',    52.00,  '2026-07-01'),
  ('usr_sarah',   13.87,  '2026-07-01'),
  ('usr_michael', 195.00, '2026-07-01')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
--  SEED DATA — Notifications
-- ============================================================
INSERT INTO public.notifications (id, user_id, type, title, message, read) VALUES
  ('notif_001', 'usr_alex',    'admin_funded',      'Funds Received!',           '$10,000.00 has been added to your checking account by Finora Admin.',  false),
  ('notif_002', 'usr_alex',    'transfer_sent',     'Transfer Sent',             'You sent $500.00 to Sarah Jenkins.',                                    true),
  ('notif_003', 'usr_sarah',   'transfer_received', 'Money Received!',           'You received $500.00 from Alex Johnson.',                               false),
  ('notif_004', 'usr_sarah',   'admin_funded',      'Funds Received!',           '$5,000.00 has been added to your account as a welcome bonus.',          true),
  ('notif_005', 'usr_michael', 'loan_approved',     'Loan Approved & Disbursed!','Your loan of $10,000.00 at 4.5% APR has been disbursed to your account.',false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  SEED DATA — Conversations & Messages
-- ============================================================
INSERT INTO public.conversations (id, user_id, admin_unread, user_unread, last_timestamp) VALUES
  ('conv_alex',    'usr_alex',    1, 0, '2026-07-22 14:35:00+00'),
  ('conv_sarah',   'usr_sarah',   0, 1, '2026-07-21 09:20:00+00'),
  ('conv_michael', 'usr_michael', 0, 0, '2026-07-20 18:55:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (id, conversation_id, sender_id, sender_role, content, tx_context, timestamp) VALUES
  ('msg_001', 'conv_alex',    'usr_alex',  'user',  'Hi, I noticed my transfer to Sarah failed. Transaction ID: tx_1001. Can you help me understand what happened?', 'tx_1001', '2026-07-22 14:30:00+00'),
  ('msg_002', 'conv_alex',    'usr_admin', 'admin', 'Hello Alex! I can see the transaction tx_1001 — it was flagged by our security system. I''ve reviewed it and will restore it shortly. Sorry for the inconvenience!', NULL, '2026-07-22 14:35:00+00'),
  ('msg_003', 'conv_sarah',   'usr_admin', 'admin', 'Hi Sarah! Your account has been funded with $500. Let us know if you have any questions.', NULL, '2026-07-21 09:20:00+00'),
  ('msg_004', 'conv_michael', 'usr_michael','user', 'Thanks for approving my loan application! When will the funds be available?', NULL, '2026-07-20 18:50:00+00'),
  ('msg_005', 'conv_michael', 'usr_admin', 'admin', 'Hi Michael! Your loan of $10,000 has already been disbursed to your checking account. Check your dashboard balance.', NULL, '2026-07-20 18:55:00+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  VERIFICATION QUERIES  (run these to confirm setup worked)
-- ============================================================
-- SELECT * FROM public.users;
-- SELECT * FROM public.accounts;
-- SELECT * FROM public.transactions ORDER BY timestamp DESC;
-- SELECT * FROM public.system_settings;
-- SELECT * FROM public.notifications;
-- SELECT * FROM public.messages ORDER BY timestamp;


CREATE TABLE IF NOT EXISTS public.money_requests (
    id character varying(255) PRIMARY KEY,
    requester_id character varying(255),
    requester_name character varying(255),
    requester_account character varying(255),
    from_user_id character varying(255),
    amount numeric NOT NULL,
    note text,
    status character varying(50),
    timestamp character varying(50)
);

-- ============================================================
--  TABLE: transaction_otps (Hashed OTP storage & expiry)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transaction_otps (
  id              TEXT PRIMARY KEY,
  transaction_id  TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  otp_hash        TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  attempts_count  INTEGER DEFAULT 0,
  last_resent_at  TIMESTAMPTZ DEFAULT now(),
  is_used         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE: otp_audit_logs (Security auditing for all OTP events)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.otp_audit_logs (
  id              TEXT PRIMARY KEY,
  transaction_id  TEXT REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id         TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN ('GENERATED','RESENT','VERIFICATION_SUCCESS','VERIFICATION_FAILED','MAX_ATTEMPTS_EXCEEDED','EXPIRED')),
  ip_address      TEXT DEFAULT '127.0.0.1',
  details         TEXT DEFAULT '',
  timestamp       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE: external_transfers (External bank wire & crypto details)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.external_transfers (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name       TEXT,
  transfer_type   TEXT NOT NULL,
  amount          NUMERIC(15,2) NOT NULL,
  bank_name       TEXT,
  account_number  TEXT,
  routing_number  TEXT,
  account_holder  TEXT,
  swift_code      TEXT,
  bank_address    TEXT,
  wallet_address  TEXT,
  network         TEXT,
  note            TEXT DEFAULT '',
  status          TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Completed','Failed')),
  failure_reason  TEXT DEFAULT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transaction_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_audit_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_anon" ON public.transaction_otps     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon" ON public.otp_audit_logs       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon" ON public.external_transfers   FOR ALL USING (true) WITH CHECK (true);



