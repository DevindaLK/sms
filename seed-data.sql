-- 1. Seed Categories
INSERT INTO inventory_categories (name, description) VALUES 
('Hair Care', 'Shampoos, conditioners, and treatments'),
('Skin Care', 'Facial oils, cleansers, and masks'),
('Tools', 'Scissors, clippers, and brushes'),
('Retail', 'Products for customer purchase')
ON CONFLICT DO NOTHING;

-- 2. Ensure an admin user exists (Update this with a real user ID if needed)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@glowup.com';
