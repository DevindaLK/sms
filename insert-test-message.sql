
-- 1. Find a thread
-- 2. Find a user who is NOT you (or just any user)
-- 3. Insert a message with is_read = false

DO $$
DECLARE
    v_thread_id UUID;
    v_sender_id UUID;
BEGIN
    -- Get first thread
    SELECT id INTO v_thread_id FROM chat_threads LIMIT 1;
    
    -- Get some user (ideally not the one viewing, but for admins all unread count)
    SELECT id INTO v_sender_id FROM profiles LIMIT 1;

    IF v_thread_id IS NOT NULL THEN
        INSERT INTO chat_messages (thread_id, sender_id, content, is_read)
        VALUES (v_thread_id, v_sender_id, 'Neural verification message: ' || NOW(), false);
        
        RAISE NOTICE 'Inserted test message into thread %', v_thread_id;
    ELSE
        RAISE NOTICE 'No threads found. Please start a chat first.';
    END IF;
END $$;
