
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

async function verify() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    return;
  }
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

  console.log('--- Verifying POS Stock Reduction ---');

  // 1. Get a test item
  const { data: items, error: fetchError } = await supabase
    .from('inventory_items')
    .select('*')
    .limit(1);

  if (fetchError || !items || items.length === 0) {
    console.error('Error fetching test item:', fetchError);
    return;
  }

  const testItem = items[0];
  console.log(`Test Item: ${testItem.name} (ID: ${testItem.id})`);
  console.log(`Initial Stock: ${testItem.current_stock}`);

  // 2. Simulate a sale
  console.log('Simulating sale of 1 unit...');
  
  // Create a sale
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert([{
      total_amount: testItem.sell_price,
      payment_method: 'cash',
      received_amount: testItem.sell_price,
      balance_amount: 0
    }])
    .select()
    .single();

  if (saleError) {
    console.error('Error creating sale:', saleError);
    return;
  }

  // Create a sale item
  const { error: itemError } = await supabase
    .from('sale_items')
    .insert([{
      sale_id: sale.id,
      item_id: testItem.id,
      quantity: 1,
      unit_price: testItem.sell_price,
      total_price: testItem.sell_price
    }]);

  if (itemError) {
    console.error('Error creating sale item:', itemError);
    return;
  }

  // 3. Wait for trigger to fire
  console.log('Waiting for trigger...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Verify stock and debug logs
  const { data: debugLogs, error: debugError } = await supabase
    .from('debug_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (debugError) {
    console.error('Error fetching debug logs:', debugError);
  } else {
    console.log('Latest Debug Logs:');
    console.table(debugLogs.map(l => ({ msg: l.message, at: l.created_at })));
  }

  const { data: updatedItem, error: updateError } = await supabase
    .from('inventory_items')
    .select('current_stock')
    .eq('id', testItem.id)
    .single();

  if (updateError) {
    console.error('Error fetching updated stock:', updateError);
    return;
  }

  const expectedStock = testItem.current_stock - 1;
  const actualStock = updatedItem.current_stock;

  console.log(`Final Stock: ${actualStock}`);
  console.log(`Expected Stock: ${expectedStock}`);

  if (actualStock === expectedStock) {
    console.log('✅ Stock reduction is correct (reduced by 1).');
  } else if (actualStock === testItem.current_stock - 2) {
    console.log('❌ Stock reduction is INCORRECT (reduced by 2!).');
  } else {
    console.log(`⚠️ Stock reduction is unexpected (reduced by ${testItem.current_stock - actualStock}).`);
  }

  // Cleanup
  console.log('Cleaning up...');
  await supabase.from('sale_items').delete().eq('sale_id', sale.id);
  await supabase.from('sales').delete().eq('id', sale.id);
  // Restore stock
  await supabase.from('inventory_items').update({ current_stock: testItem.current_stock }).eq('id', testItem.id);
}

verify();
