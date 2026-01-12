-- 1. Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='specialization') THEN
        ALTER TABLE profiles ADD COLUMN specialization TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='experience_years') THEN
        ALTER TABLE profiles ADD COLUMN experience_years INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='rating') THEN
        ALTER TABLE profiles ADD COLUMN rating DECIMAL DEFAULT 5.0;
    END IF;
END $$;

-- 2. Insert sample stylist data
-- Note: These IDs are placeholders. In a real scenario, these would reference actual auth.users.id
-- However, for the sake of the Master Artisans section, we can insert profiles directly.

INSERT INTO profiles (id, full_name, email, phone, role, bio, specialization, experience_years, avatar_url, working_hours, days_off)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Elena Rodriguez', 'elena@glowup.com', '+1 (555) 123-4567', 'stylist', 'Master of architectural cuts and avant-garde coloring. Elena brings 12 years of Parisian experience to GlowUp.', '{"Precision Cutting", "Balayage", "Vivid Colors"}', 12, 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=200', '{"start": "09:00", "end": "18:00"}', '{0, 1}'),

('00000000-0000-0000-0000-000000000002', 'Marcus Chen', 'marcus@glowup.com', '+1 (555) 234-5678', 'stylist', 'Specialist in classic barbering and modern texture. Marcus is known for his meticulous attention to detail and grooming rituals.', '{"Classic Tapers", "Beard Sculpting", "Skin Fades"}', 8, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', '{"start": "10:00", "end": "20:00"}', '{2, 3}'),

('00000000-0000-0000-0000-000000000003', 'Sasha Volkov', 'sasha@glowup.com', '+1 (555) 345-6789', 'stylist', 'Expert in bridal styling and luxury hair treatments. Sasha creates ethereal looks that enhance natural beauty.', '{"Bridal Styling", "Red Carpet Updos", "Keratin Treatments"}', 15, 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=200', '{"start": "08:00", "end": "16:00"}', '{5, 6}')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    specialization = EXCLUDED.specialization,
    experience_years = EXCLUDED.experience_years,
    avatar_url = EXCLUDED.avatar_url,
    working_hours = EXCLUDED.working_hours,
    days_off = EXCLUDED.days_off;
