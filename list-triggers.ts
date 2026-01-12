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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

async function listTriggers() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    return;
  }
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

  console.log('--- Listing Database Triggers ---');
  
  // Try to use rpc to list triggers (if a diagnostic function exists)
  // Or just query the information_schema via a trick if possible.
  // Actually, usually anon key can't query information_schema.
  // But let's try a simple select from a table we know has policies.
  
  const { data, error } = await supabase.rpc('get_triggers_diag'); 
  // Probably won't work, but worth a shot.

  if (error) {
    console.log('RPC check failed (expected). Trying manual deduction...');
  } else {
    console.table(data);
  }

  // Fallback: Check if we can see any suspicious behavior in debug_logs
  console.log('\n--- Checking debug_logs for trigger execution traces ---');
  const { data: logs, error: logError } = await supabase
    .from('debug_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (logError) {
    console.error('Error fetching debug logs:', logError.message);
  } else {
    console.table(logs);
  }
}

listTriggers();
