-- Create Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'stylist', 'customer')) DEFAULT 'customer',
  specialization TEXT[] DEFAULT '{}',
  bio TEXT,
  experience_years INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
  days_off INT[] DEFAULT '{}',
  glow_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLEANUP: Remove old foreign key if it exists to allow detached profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Inventory System
CREATE TABLE inventory_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  unit TEXT DEFAULT 'pcs',
  min_stock_level INT DEFAULT 5,
  current_stock INT DEFAULT 0,
  buy_price DECIMAL(10,2) DEFAULT 0.00,
  sell_price DECIMAL(10,2) DEFAULT 0.00,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INT NOT NULL,
  remaining_quantity INT, -- For FIFO tracking on 'in' types
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services & Appointments
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL, -- in minutes
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stylist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  total_price DECIMAL(10,2),
  is_redeemed BOOLEAN DEFAULT FALSE,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POS System
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  sscl DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  payment_method TEXT,
  received_amount DECIMAL(10,2),
  balance_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debugging table
CREATE TABLE IF NOT EXISTS public.debug_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOGIC: Update Inventory Stock based on Logs
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS trigger AS $$
BEGIN
  -- Log the event for visibility
  INSERT INTO public.debug_logs (message) 
  VALUES ('Trigger: update_inventory_stock for ' || NEW.item_id || ' type: ' || NEW.type || ' qty: ' || NEW.quantity);

  IF NEW.type = 'in' THEN
    -- For 'in' logs, also initialize remaining_quantity for FIFO if not set
    IF NEW.remaining_quantity IS NULL THEN
      NEW.remaining_quantity := NEW.quantity;
    END IF;
    
    UPDATE public.inventory_items
    SET current_stock = COALESCE(current_stock, 0) + NEW.quantity
    WHERE id = NEW.item_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE public.inventory_items
    SET current_stock = COALESCE(current_stock, 0) - NEW.quantity
    WHERE id = NEW.item_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE public.inventory_items
    SET current_stock = COALESCE(current_stock, 0) + NEW.quantity
    WHERE id = NEW.item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_inventory_log_inserted
  BEFORE INSERT ON public.inventory_logs -- BEFORE to allow setting remaining_quantity
  FOR EACH ROW EXECUTE FUNCTION public.update_inventory_stock();

-- LOGIC: Decrease inventory stock on sale (via Log Entry)
CREATE OR REPLACE FUNCTION public.handle_sale_stock_reduction()
RETURNS trigger AS $$
DECLARE
  qty_to_reduce INT := NEW.quantity;
  log_record RECORD;
  reduce_amount INT;
BEGIN
  -- 1. Debug log
  INSERT INTO public.debug_logs (message) 
  VALUES ('handle_sale_stock_reduction called for sale_item: ' || NEW.id || ' quantity: ' || NEW.quantity);

  -- 2. FIFO Logic: Consume stock from oldest 'in' logs
  FOR log_record IN 
    SELECT id, remaining_quantity 
    FROM public.inventory_logs 
    WHERE item_id = NEW.item_id AND type = 'in' AND remaining_quantity > 0
    ORDER BY created_at ASC
  LOOP
    IF qty_to_reduce <= 0 THEN
      EXIT;
    END IF;

    reduce_amount := LEAST(qty_to_reduce, log_record.remaining_quantity);
    
    UPDATE public.inventory_logs
    SET remaining_quantity = remaining_quantity - reduce_amount
    WHERE id = log_record.id;
    
    qty_to_reduce := qty_to_reduce - reduce_amount;
  END LOOP;

  -- 3. Log the sale movement
  -- This will trigger on_inventory_log_inserted which updates inventory_items.current_stock
  INSERT INTO public.inventory_logs (item_id, user_id, type, quantity, reason)
  VALUES (
    NEW.item_id,
    (SELECT customer_id FROM public.sales WHERE id = NEW.sale_id),
    'out',
    NEW.quantity,
    'POS Sale'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_sale_item_created
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_sale_stock_reduction();

-- LOGIC: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    new.raw_user_meta_data->>'phone', 
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DIAGNOSTIC: List triggers
CREATE OR REPLACE FUNCTION public.get_triggers_diag()
RETURNS TABLE (
  t_table_name TEXT,
  t_trigger_name TEXT,
  t_function_name TEXT,
  t_action_timing TEXT,
  t_event_manipulation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.event_object_table::TEXT, 
    tr.trigger_name::TEXT, 
    tr.action_statement::TEXT,
    tr.action_timing::TEXT,
    tr.event_manipulation::TEXT
  FROM information_schema.triggers tr
  WHERE tr.event_object_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DIAGNOSTIC: List constraints
CREATE OR REPLACE FUNCTION public.get_table_constraints(t_name TEXT)
RETURNS TABLE (
  constraint_name TEXT,
  table_name TEXT,
  constraint_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.constraint_name::TEXT, 
    tc.table_name::TEXT, 
    tc.constraint_type::TEXT
  FROM information_schema.table_constraints AS tc
  WHERE tc.table_schema = 'public' AND tc.table_name = t_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Inventory Policies
CREATE POLICY "Anyone can view categories" ON inventory_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON inventory_categories ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view items" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage items" ON inventory_items ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins and Stylists can view logs" ON inventory_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'stylist')));
CREATE POLICY "Admins and Stylists can insert logs" ON inventory_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'stylist')));

-- Services: Public view
CREATE POLICY "Anyone can view services" ON services FOR SELECT USING (true);
CREATE POLICY "Admins can manage services" ON services ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Appointments: Customer/Stylist view their own, Admin views all
CREATE POLICY "Users can view relevant appointments" ON appointments FOR SELECT USING (
  auth.uid() = customer_id OR 
  auth.uid() = stylist_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can book appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Staff can manage appointments" ON appointments ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'stylist')));

-- Sales Policies
CREATE POLICY "Staff can manage sales" ON sales ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'stylist')));
CREATE POLICY "Staff can manage sale items" ON sale_items ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'stylist')));

-- STORAGE SETUP
-- Create the inventory bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory', 'inventory', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
-- Allow public access to read images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'inventory');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'inventory' AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update/delete images
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'inventory' AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'inventory' AND auth.role() = 'authenticated'
);

-- Gallery & Visuals
CREATE TABLE gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'Ritual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog & SEO Chronicles
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Gallery
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Admins can manage gallery" ON gallery 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for Blog
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published posts" ON blog_posts 
  FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can view all posts" ON blog_posts 
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage posts" ON blog_posts 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for update_at on blog_posts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Chat System
CREATE TABLE chat_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stylist_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Null for 'admin' type threads
  type TEXT CHECK (type IN ('admin', 'stylist')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, stylist_id, type)
);

CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- RLS for Chat
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Threads Policies
CREATE POLICY "Users can view relevant threads" ON chat_threads 
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = stylist_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Customers can create threads" ON chat_threads 
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Messages Policies
CREATE POLICY "Users can view thread messages" ON chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_threads 
      WHERE id = chat_messages.thread_id AND (
        customer_id = auth.uid() OR 
        stylist_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Users can send messages" ON chat_messages 
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_threads 
      WHERE id = chat_messages.thread_id AND (
        customer_id = auth.uid() OR 
        stylist_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Realtime: Enable for messages (This usually happens via Supabase UI, but we record the intent here)
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_threads;
