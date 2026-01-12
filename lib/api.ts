
import { supabase } from './supabase';
import { UserRole } from '../types';

export const api = {
  // --- Profiles / Artisans ---
  async getArtisans() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'stylist');
    if (error) throw error;
    return data;
  },

  async getCustomers(page = 1, pageSize = 20) {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'customer')
      .order('full_name', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return { data, count };
  },

  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createProfile(profile: any) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, updates: any) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteProfile(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- Services ---
  async getServices(page = 1, pageSize = 20) {
    const { data, error, count } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return { data, count };
  },

  async createService(service: any) {
    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select();
    if (error) throw error;
    return data[0];
  },

  async updateService(id: string, updates: any) {
    const { error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteService(id: string) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- Appointments ---
  async getAppointments(filters?: any, page = 1, pageSize = 20) {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        customer:profiles!appointments_customer_id_fkey(full_name, email, avatar_url),
        artisan:profiles!appointments_stylist_id_fkey(full_name, avatar_url),
        service:services(name, duration_minutes, image_url, price)
      `, { count: 'exact' })
      .order('start_time', { ascending: false });

    if (filters?.stylist_id) query = query.eq('stylist_id', filters.stylist_id);
    if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
    if (filters?.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      query = query.gte('start_time', start.toISOString()).lte('start_time', end.toISOString());
    }

    const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return { data, count };
  },

  async createAppointment(appointment: any) {
    const payload = { ...appointment };
    if (payload.price_at_booking) {
      payload.total_price = payload.price_at_booking;
      delete payload.price_at_booking;
    }

    // Redemption Logic: Strict enforcement
    if (payload.is_redeemed) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('glow_points')
        .eq('id', payload.customer_id)
        .single();
      
      const currentPoints = profile?.glow_points || 0;
      if (currentPoints >= 100) {
        // Deduct points
        await supabase
          .from('profiles')
          .update({ glow_points: currentPoints - 100 })
          .eq('id', payload.customer_id);
      } else {
        // FAILSAFE: If points are insufficient, strip the discount and is_redeemed flag
        payload.is_redeemed = false;
        // Search for the original service price to revert
        const { data: service } = await supabase
          .from('services')
          .select('price')
          .eq('id', payload.service_id)
          .single();
        if (service) {
          payload.total_price = service.price;
        }
        console.warn("Redemption rejected: Insufficient points.");
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([payload])
      .select();
    if (error) throw error;
    return data[0];
  },

  async updateAppointmentStatus(id: string, status: string) {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('customer_id, status, points_earned')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;

    // Loyalty Logic: Award points on completion (Phase 16 Robustness)
    // We check if points_earned is falsy (0 or null) and status is completed
    if (status === 'completed' && appointment && appointment.status !== 'completed' && !appointment.points_earned) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('glow_points')
        .eq('id', appointment.customer_id)
        .single();
      
      const currentProfilePoints = profile?.glow_points || 0;
      const newPoints = currentProfilePoints + 5;
      
      await Promise.all([
        supabase
          .from('profiles')
          .update({ glow_points: newPoints })
          .eq('id', appointment.customer_id),
        supabase
          .from('appointments')
          .update({ points_earned: 5 })
          .eq('id', id)
      ]);
      console.log(`Awarded 5 points to customer ${appointment.customer_id}`);
    }
  },

  async updateAppointment(id: string, appointment: any) {
    const payload = { ...appointment };
    // Maintain status as pending for any updates that require admin re-approval
    payload.status = 'pending';
    
    if (payload.price_at_booking) {
      payload.total_price = payload.price_at_booking;
      delete payload.price_at_booking;
    }
    // Remove joined data before update
    delete payload.customer;
    delete payload.artisan;
    delete payload.service;

    const { data, error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async deleteAppointment(id: string) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getCustomerStats(customerId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('total_price, status')
      .eq('customer_id', customerId);
    
    if (error) throw error;

    const stats = (data || []).reduce((acc: any, curr: any) => {
      if (curr.status === 'confirmed' || curr.status === 'completed') {
        acc.perfectedCount += 1;
        acc.totalSpend += Number(curr.total_price || 0);
      }
      return acc;
    }, { perfectedCount: 0, totalSpend: 0 });

    return stats;
  },

  // --- Inventory ---
  async getInventory(page = 1, pageSize = 20) {
    const { data, error, count } = await supabase
      .from('inventory_items')
      .select('*, category:inventory_categories(name)', { count: 'exact' })
      .order('name', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return { data, count };
  },

  async getInventoryCategories() {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async updateInventoryItem(id: string, updates: any) {
    const { error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async createInventoryItem(item: any) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select();
    if (error) throw error;
    return data[0];
  },

  async deleteInventoryItem(id: string) {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async uploadInventoryImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('inventory')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('inventory')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async logInventoryMovement(log: any) {
    const { error } = await supabase
      .from('inventory_logs')
      .insert([log]);
    if (error) throw error;
  },

  async getInventoryLogs(itemId?: string) {
    let query = supabase
      .from('inventory_logs')
      .select('*, item:inventory_items(name), user:profiles(full_name)')
      .order('created_at', { ascending: false });
    
    if (itemId) query = query.eq('item_id', itemId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // --- POS & Sales ---
  async createSale(sale: any, items: any[]) {
    // 1. Create the sale record
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([sale])
      .select()
      .single();
    
    if (saleError) throw saleError;

    // 2. Create the sale items
    const saleItems = items.map(item => ({
      sale_id: saleData.id,
      item_id: item.id,
      quantity: item.quantity,
      unit_price: item.sell_price,
      total_price: item.sell_price * item.quantity
    }));

    console.log('API: createSale called with', items.length, 'items');
    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);
    
    if (itemsError) throw itemsError;

    console.log('API: createSale completed');
    return saleData;
  },

  async getSales(page = 1, pageSize = 20) {
    const { data, error, count } = await supabase
      .from('sales')
      .select('*, customer:profiles(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return { data, count };
  },

  async getSalesReport() {
    // Fetch both Product Sales and Service Rituals
    const [salesRes, appointmentsRes] = await Promise.all([
      supabase
        .from('sales')
        .select('*, items:sale_items(*, product:inventory_items(*))'),
      supabase
        .from('appointments')
        .select('*, customer:profiles!appointments_customer_id_fkey(full_name), service:services(name)')
        .in('status', ['confirmed', 'completed'])
    ]);
    
    if (salesRes.error) throw salesRes.error;
    if (appointmentsRes.error) throw appointmentsRes.error;

    const sales = salesRes.data || [];
    const appointments = appointmentsRes.data || [];

    const report = {
      totalRevenue: 0,
      totalProfit: 0,
      performance: [] as { name: string, productRevenue: number, serviceRevenue: number, bookings: number }[],
      itemSales: {} as Record<string, { name: string, quantity: number, revenue: number, profit: number }>,
      allSales: sales,
      allAppointments: appointments
    };

    // Calculate 7-day performance
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        name: days[d.getDay()],
        productRevenue: 0,
        serviceRevenue: 0,
        bookings: 0
      };
    });

    // Process Product Sales
    sales.forEach((sale: any) => {
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
      const perfDay = last7Days.find(d => d.dateStr === saleDate);
      
      const saleAmount = Number(sale.total_amount);
      report.totalRevenue += saleAmount;
      if (perfDay) {
        perfDay.productRevenue += saleAmount;
      }

      sale.items.forEach((item: any) => {
        const profit = (item.unit_price - (item.product?.buy_price || 0)) * item.quantity;
        report.totalProfit += profit;

        if (!report.itemSales[item.item_id]) {
          report.itemSales[item.item_id] = { 
            name: item.product?.name || 'Unknown', 
            quantity: 0, 
            revenue: 0, 
            profit: 0 
          };
        }
        report.itemSales[item.item_id].quantity += item.quantity;
        report.itemSales[item.item_id].revenue += item.total_price;
        report.itemSales[item.item_id].profit += profit;
      });
    });

    // Process Service Rituals
    appointments.forEach((apt: any) => {
      const aptDate = new Date(apt.start_time).toISOString().split('T')[0];
      const perfDay = last7Days.find(d => d.dateStr === aptDate);
      
      const aptAmount = Number(apt.total_price || 0);
      report.totalRevenue += aptAmount;
      report.totalProfit += aptAmount; // Assuming 100% profit for services for now

      if (perfDay) {
        perfDay.serviceRevenue += aptAmount;
        perfDay.bookings += 1;
      }
    });

    report.performance = last7Days.map(({ name, productRevenue, serviceRevenue, bookings }) => ({ 
      name, 
      productRevenue, 
      serviceRevenue, 
      bookings 
    }));

    return report;
  },

  // Gallery & Visuals
  async getGallery(page = 1, pageSize = 20) {
    const { data, error, count } = await supabase
      .from('gallery')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return { data, count };
  },

  async addToGallery(item: any) {
    const { data, error } = await supabase
      .from('gallery')
      .insert([item])
      .select();
    if (error) throw error;
    return data[0];
  },

  async deleteFromGallery(id: string) {
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Blog & SEO Chronicles
  async getBlogPosts(includeDrafts = false, page = 1, pageSize = 20) {
    let query = supabase.from('blog_posts').select('*, author:profiles(*)', { count: 'exact' });
    if (!includeDrafts) {
      query = query.eq('status', 'published');
    }
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return { data, count };
  },

  async getBlogPostBySlug(slug: string) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, author:profiles(*)')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  },

  async createBlogPost(post: any) {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([post])
      .select();
    if (error) throw error;
    return data[0];
  },

  async updateBlogPost(id: string, updates: any) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async deleteBlogPost(id: string) {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Profile Management
  async updateProfilePhoto(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    let { error: uploadError } = await supabase.storage
      .from('inventory') // Reusing the same public bucket
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('inventory')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;
    return publicUrl;
  },

  async updateUserPassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    if (error) throw error;
  },

  // Chat System
  async getChatThreads() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('chat_threads')
      .select(`
        *,
        customer:profiles!chat_threads_customer_id_fkey(full_name, avatar_url),
        stylist:profiles!chat_threads_stylist_id_fkey(full_name, avatar_url)
      `);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    
    if (profile?.role === 'customer') {
      query = query.eq('customer_id', user.id);
    } else if (profile?.role === 'stylist') {
      query = query.eq('stylist_id', user.id);
    }
    // Admins see all

    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getChatMessages(threadId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async sendChatMessage(threadId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        content
      })
      .select()
      .single();

    if (error) throw error;

    // Update thread timestamp
    await supabase.from('chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);

    return data;
  },

  async createChatThread(partnerId: string | null, type: 'admin' | 'stylist') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('chat_threads')
      .upsert({
        customer_id: user.id,
        stylist_id: partnerId,
        type
      }, { onConflict: 'customer_id, stylist_id, type' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUnreadMessageCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', user.id)
      .filter('thread_id', 'in', 
        supabase
          .from('chat_threads')
          .select('id')
          .or(`customer_id.eq.${user.id},stylist_id.eq.${user.id}`)
      );

    if (error) {
      // Fallback: More robust query if subquery fails in RLS
      const { data: threads } = await supabase
        .from('chat_threads')
        .select('id')
        .or(`customer_id.eq.${user.id},stylist_id.eq.${user.id}`);
      
      if (!threads || threads.length === 0) return 0;
      
      const { count: altCount, error: altError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .in('thread_id', threads.map(t => t.id));
        
      if (altError) return 0;
      return altCount || 0;
    }

    return count || 0;
  },

  async markMessagesAsRead(threadId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('thread_id', threadId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
  }
};
