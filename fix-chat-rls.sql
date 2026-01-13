
-- Run this in your Supabase SQL Editor to allow marking messages as read
CREATE POLICY "Users can update thread messages" ON chat_messages 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_threads 
      WHERE id = chat_messages.thread_id AND (
        customer_id = auth.uid() OR 
        stylist_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );
