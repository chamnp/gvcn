import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgyoekaaefzpymfxfggf.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneW9la2FhZWZ6cHltZnhmZ2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTIzNzMsImV4cCI6MjEwMzMyODM3M30.u4vjLaSoFLoEMCHldS5y_D8meB4TqTwtI8M-E3DHtcI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('placeholder'));
}
