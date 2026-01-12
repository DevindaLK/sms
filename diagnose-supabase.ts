import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value;
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

async function diagnose() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('--- Checking Profiles Table ---');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (profileError) {
    console.error('Error fetching profiles:', profileError.message);
  } else {
    console.log('Latest profiles:');
    console.table(profiles);
  }

  console.log('\n--- Checking Auth Users (Metadata) ---');
  // Note: We can't easily check auth.users with anon key, 
  // but we can check the current session if we were logged in.
  // For now, let's just check if the profiles table is empty.
  
  if (profiles && profiles.length === 0) {
    console.log('WARNING: Profiles table is empty. This suggests the trigger might not be working or applied.');
  }
}

diagnose();
