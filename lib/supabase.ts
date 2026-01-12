import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) || 
  ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL as string) ||
  (process.env.VITE_SUPABASE_URL as string) || 
  (process.env.NEXT_PUBLIC_SUPABASE_URL as string) || 
  '';

const supabaseAnonKey = 
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || 
  ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string) ||
  (process.env.VITE_SUPABASE_ANON_KEY as string) || 
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string) ||
  '';

// Prevent crash if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing. Please check your .env file.");
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { 
      auth: { 
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => {},
        signUp: async () => ({ data: { user: null }, error: new Error("Supabase not configured. Check your .env.local file.") }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error("Supabase not configured. Check your .env.local file.") }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error("Supabase not configured") }),
            order: () => ({ data: [], error: new Error("Supabase not configured") })
          }),
          order: async () => ({ data: [], error: new Error("Supabase not configured") })
        }),
        insert: () => ({
          select: async () => ({ data: [], error: new Error("Supabase not configured") })
        }),
        update: () => ({
          eq: async () => ({ error: new Error("Supabase not configured") })
        }),
        delete: () => ({
          eq: async () => ({ error: new Error("Supabase not configured") })
        })
      })
    } as any;
