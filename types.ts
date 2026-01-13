
export enum UserRole {
  ADMIN = 'admin',
  STYLIST = 'stylist',
  CUSTOMER = 'customer'
}

export interface WorkingHours {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string;
  bio?: string;
  specialization?: string[];
  experience_years?: number;
  rating?: number;
  glow_points?: number;
  working_hours?: WorkingHours;
  days_off?: number[]; // 0 for Sunday, 1 for Monday, etc.
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
  description: string;
  image_url?: string;
}

export interface Appointment {
  id: string;
  customer_id: string;
  stylist_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_price: number;
  is_redeemed?: boolean;
  points_earned?: number;
  customer?: { full_name: string; email: string; avatar_url?: string };
  artisan?: { full_name: string; avatar_url?: string };
  service?: { name: string; duration_minutes: number; image_url?: string; price: number };
}

export interface Product {
  id: string;
  name: string;
  categoryId?: string;
  sku?: string;
  unit?: string;
  minStockLevel: number;
  currentStock: number;
  buyPrice: number;
  sellPrice: number;
  imageUrl?: string;
  createdAt: string;
}
export interface Hairstyle {
  id: string;
  name: string;
  description: string;
  reasoning: string;
  imagePrompt: string;
}

export interface AnalysisResult {
  faceDetected: boolean;
  gender?: 'male' | 'female' | 'other';
  faceShape: string;
  skinTone: string;
  features: string[];
  recommendations: Hairstyle[];
}
