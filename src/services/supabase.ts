/**
 * Supabase Client — initialized with anon key + AsyncStorage session persistence.
 * Sessions are automatically refreshed; no manual token management needed.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const hasPlaceholderValue = (value: string | undefined) =>
    !value || value.includes('YOUR_') || value.includes('YOUR_PROJECT');

if (hasPlaceholderValue(SUPABASE_URL) || hasPlaceholderValue(SUPABASE_KEY)) {
    throw new Error(
        'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY) in .env, then restart Expo.',
    );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
