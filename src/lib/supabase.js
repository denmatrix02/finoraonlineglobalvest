import { createClient } from '@supabase/supabase-js';

// Supabase environment variables — set these in your .env or Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-finora-bank.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'mock-anon-key-finora-2026';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const IS_MOCK_ENV = !import.meta.env.VITE_SUPABASE_URL && !import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
