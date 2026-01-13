
import { supabase } from './lib/supabase';

async function diagnoseChat() {
  console.log('--- Chat System Diagnosis ---');

  // 1. Check profiles
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('No user authenticated');
    return;
  }
  console.log('Authenticated User:', user.email, 'ID:', user.id);

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  console.log('User Role:', profile?.role);

  // 2. Check chat_messages table structure (via a dummy query)
  const { data: cols, error: colError } = await supabase.from('chat_messages').select('*').limit(1);
  if (colError) {
    console.error('Error fetching chat_messages:', colError);
  } else {
    console.log('Columns in chat_messages:', Object.keys(cols[0] || {}));
    if (cols[0] && 'is_read' in cols[0]) {
      console.log('is_read column exists');
    } else {
      console.log('is_read column MISSING or not returned');
    }
  }

  // 3. Check unread count logic
  let query = supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', user.id);

  if (profile?.role !== 'admin') {
     // Filter by threads I'm part of
     const { data: threads } = await supabase
        .from('chat_threads')
        .select('id')
        .or(`customer_id.eq.${user.id},stylist_id.eq.${user.id}`);
     
     const threadIds = threads?.map(t => t.id) || [];
     console.log('User is participant in threads:', threadIds);
     query = query.in('thread_id', threadIds);
  } else {
    console.log('User is Admin, checking ALL unread messages');
  }

  const { count, error } = await query;
  if (error) {
    console.error('Error in unread count query:', error);
  } else {
    console.log('Unread count returned:', count);
  }

  // 4. List some unread messages
  const { data: unreadMsgs } = await supabase.from('chat_messages').select('*').eq('is_read', false).limit(5);
  console.log('Recent 5 unread messages (any sender):', unreadMsgs?.length);
  unreadMsgs?.forEach(m => {
    console.log(`- From: ${m.sender_id}, Content: ${m.content}, Thread: ${m.thread_id}`);
  });
}

diagnoseChat();
