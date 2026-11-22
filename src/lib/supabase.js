import { createClient } from '@supabase/supabase-js';

// Finora Supabase Production Credentials
const FINORA_SUPABASE_URL = 'https://vuyzogadonfwvvljcmri.supabase.co';
const FINORA_SUPABASE_ANON_KEY = 'sb_publishable_RNo2flWQrBCLNDh_-wpcVA_-pp67z6g';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || FINORA_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || FINORA_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Live production database is active and connected
export const IS_MOCK_ENV = false;
