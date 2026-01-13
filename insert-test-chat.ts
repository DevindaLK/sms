
import { supabase } from './lib/supabase';

async function insertTestMessage() {
  console.log('--- Inserting Test Message ---');

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('No user authenticated. Cannot determine sender.');
    return;
  }
  console.log('Authenticated User:', user.email, 'ID:', user.id);

  // 2. Get any thread
  const { data: threads, error: threadError } = await supabase.from('chat_threads').select('*').limit(1);
  if (threadError || !threads || threads.length === 0) {
    console.log('No threads found to insert message into.');
    return;
  }
  const threadId = threads[0].id;
  console.log('Inserting into thread:', threadId);

  // 3. Find another user to be the sender (if we want to see it as unread for the current user)
  // Or just use the current user as sender and see it from another account.
  // The user wants to see unread count, so it must be from DIFFERENT sender.
  
  const { data: otherProfiles } = await supabase.from('profiles').select('id').neq('id', user.id).limit(1);
  const senderId = otherProfiles?.[0]?.id || user.id; // Fallback to self if no others
  
  if (senderId === user.id) {
    console.warn('WARNING: Inserting message with current user as sender. It will NOT show up in unread count for this user.');
  } else {
    console.log('Using other user as sender:', senderId);
  }

  // 4. Insert message
  const { data, error } = await supabase.from('chat_messages').insert({
    thread_id: threadId,
    sender_id: senderId,
    content: "Neural echo for testing purposes " + new Date().toISOString(),
    is_read: false
  }).select().single();

  if (error) {
    console.error('Error inserting message:', error);
  } else {
    console.log('Message inserted successfully:', data.id);
  }
}

insertTestMessage();
