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

async function verifyUser(email: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log(`--- Searching for profile related to: ${email} ---`);
  // Since we can't search auth.users, we'll look for the latest profile
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching profile:', error.message);
  } else if (data && data.length > 0) {
    console.log('Latest profile found:');
    console.table(data);
  } else {
    console.log('No profiles found in the table.');
  }
}

const testEmail = process.argv[2] || 'robust_test_final_v3@gmail.com';
verifyUser(testEmail);
