import { createClient } from '@supabase/supabase-js';

// Read config safely from client env
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Strictly check if Supabase keys are provided and are not standard placeholders
export const isSupabaseConfigured = 
  supabaseUrl.trim() !== '' && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  supabaseAnonKey.trim() !== '' && 
  supabaseAnonKey !== 'your-supabase-anon-key';

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

console.log(
  isSupabaseConfigured 
    ? '📶 Supabase client loaded successfully. Real database in action!'
    : '📴 Supabase not configured in details. Activating High-Fidelity LocalStorage Fallback database engine.'
);
