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

  console.log('--- Deep Database Diagnosis ---');

  // 4. Check triggers via RPC
  const { data: triggers, error: triggerError } = await supabase.rpc('get_triggers_diag');
  if (triggerError) {
    console.error('Error fetching triggers:', triggerError.message);
  } else {
    console.log('\nActive Triggers:');
    if (triggers && triggers.length > 0) {
      // Map back to readable names if needed or just display
      console.table(triggers);
    } else {
      console.log('No triggers found.');
    }
  }

  // 2. Sample Sales and Sale Items
  console.log('\nRecent Sales:');
  const { data: sales, error: salesError } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(3);
  if (salesError) {
    console.error('Error fetching sales:', salesError.message);
  } else {
    sales.forEach(s => console.log(`Sale ${s.id} | Total: ${s.total_amount} | Customer: ${s.customer_id}`));
    
    if (sales.length > 0) {
      console.log('\nSale Items for latest sale:');
      const { data: sitems, error: sitemsError } = await supabase.from('sale_items').select('*').eq('sale_id', sales[0].id);
      if (sitemsError) {
        console.error('Error fetching sale items:', sitemsError.message);
      } else {
        sitems.forEach(si => console.log(`  - Item: ${si.item_id} | Qty: ${si.quantity}`));
      }
    }
  }

  // 3. Check Inventory Items
  console.log('\nInventory Items:');
  const { data: items, error: itemsError } = await supabase.from('inventory_items').select('id, name, current_stock');
  if (itemsError) {
    console.error('Error fetching items:', itemsError.message);
  } else {
    items.forEach(i => console.log(`${i.name} (${i.id}) | Stock: ${i.current_stock}`));
  }

  // 4. Check for 'POS Sale' reason in logs
  console.log('\nLogs with reason "POS Sale":');
  const { data: posLogs, error: posError } = await supabase.from('inventory_logs').select('*').eq('reason', 'POS Sale');
  if (posError) {
    console.error('Error fetching POS logs:', posError.message);
  } else {
    console.log(`Found ${posLogs.length} POS logs.`);
    posLogs.forEach(l => console.log(`${l.created_at} | Item: ${l.item_id} | Qty: ${l.quantity}`));
  }
}

diagnose();
