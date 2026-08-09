import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lhfxiueygatmzvchcmyc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZnhpdWV5Z2F0bXp2Y2hjbXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODc4ODQsImV4cCI6MjA4OTA2Mzg4NH0.61c72UdGrTy81epas9neuHgLTjZUSauD3rlJNNFWHrk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface RemoteConfigItem {
  key: string;
  value: any;
  description: string;
  updated_at?: string;
  updated_by?: string;
}

export interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  granted_by: string;
  created_at: string;
}
