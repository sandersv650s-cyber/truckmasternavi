import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url!, key!, { auth: {
  storage: { getItem: (name) => SecureStore.getItemAsync(name), setItem: (name, value) => SecureStore.setItemAsync(name, value), removeItem: (name) => SecureStore.deleteItemAsync(name) },
  autoRefreshToken: true, persistSession: true, detectSessionInUrl: false,
} }) : null;
export function requireClient() { if (!supabase) throw new Error('Configureer eerst Supabase in .env.'); return supabase; }
