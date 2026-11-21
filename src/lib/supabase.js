import { createClient } from '@supabase/supabase-js';

// Supabase environment variables — set these in your .env file for Finora's project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-finora-bank.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-finora-2026';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const IS_MOCK_ENV = !import.meta.env.VITE_SUPABASE_URL;
