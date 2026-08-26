import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgyoekaaefzpymfxfggf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_onQMozx8AHJ4CiOK1esVBw_bO8M2Cu3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('placeholder'));
}
