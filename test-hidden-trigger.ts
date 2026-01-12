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

async function testHiddenTrigger() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    return;
  }
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

  console.log('--- Testing Hidden Trigger on inventory_logs ---');
  
  // 1. Get current stock
  const { data: items } = await supabase.from('inventory_items').select('*').limit(1);
  if (!items || items.length === 0) return;
  const item = items[0];
  const initialStock = item.current_stock;
  console.log(`Item: ${item.name}, Initial Stock: ${initialStock}`);

  // 2. Insert into inventory_logs ONLY
  console.log('Inserting log entry (type: out, quantity: 1)...');
  const { error: logError } = await supabase.from('inventory_logs').insert([{
    item_id: item.id,
    type: 'out',
    quantity: 1,
    reason: 'Hidden trigger test'
  }]);

  if (logError) {
    console.error('Error inserting log:', logError.message);
    return;
  }

  // 3. Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Check stock again
  const { data: updatedItem } = await supabase.from('inventory_items').select('current_stock').eq('id', item.id).single();
  const finalStock = updatedItem?.current_stock;
  console.log(`Final Stock: ${finalStock}`);

  if (finalStock === initialStock - 1) {
    console.log('✅ PROOF: Inserting into inventory_logs AUTO-UPDATES inventory_items stock!');
  } else {
    console.log('❌ No hidden trigger detected. Stock remained same or changed unexpectedly.');
  }

  // Cleanup: Restore stock (if trigger didn't work) or just reverse
  // Note: if trigger worked, it already reduced by 1.
  console.log('Cleaning up (reversing the log test)...');
  await supabase.from('inventory_items').update({ current_stock: initialStock }).eq('id', item.id);
}

testHiddenTrigger();
