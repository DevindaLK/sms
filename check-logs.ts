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

async function diagnose() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    return;
  }
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

  console.log('--- Checking Profiles & Roles ---');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) {
    console.error('Error fetching profiles:', pError.message);
  } else {
    console.table(profiles.map(p => ({ id: p.id, name: p.full_name, role: p.role })));
  }

  console.log('\n--- Checking Inventory Logs ---');
  const { data: logs, error } = await supabase
    .from('inventory_logs')
    .select('*, item:inventory_items(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error.message);
  } else {
    console.log(`Found ${logs?.length || 0} logs.`);
    if (logs && logs.length > 0) {
      console.table(logs.map(l => ({
        timestamp: l.created_at,
        item: l.item?.name,
        type: l.type,
        quantity: l.quantity,
        reason: l.reason
      })));
    }
  }

  // Check if we can see ANY logs. If anon can't see, we might need to check if they even exist.
}

diagnose();
