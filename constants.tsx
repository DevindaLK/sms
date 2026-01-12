
import { Service, User, UserRole, Product } from './types';

export const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Classic Fade', category: 'Hair', price: 35, duration: 45, gender: 'Male', description: 'Precision fade with style.' },
  { id: '2', name: 'Long Bob Cut', category: 'Hair', price: 65, duration: 60, gender: 'Female', description: 'Modern sleek bob cut.' },
  { id: '3', name: 'Luxury Beard Trim', category: 'Beard', price: 25, duration: 30, gender: 'Male', description: 'Hot towel and precision trim.' },
  { id: '4', name: 'Hydrating Facial', category: 'Facial', price: 80, duration: 75, gender: 'Unisex', description: 'Deep cleaning and hydration.' },
  { id: '5', name: 'Full Color Treatment', category: 'Hair', price: 120, duration: 150, gender: 'Unisex', description: 'Premium dye and protection.' },
];

export const MOCK_STYLISTS: User[] = [
  { 
    id: 's1', 
    name: 'Alex Rivera', 
    email: 'alex@glowup.com', 
    role: UserRole.STYLIST, 
    avatar: 'https://picsum.photos/seed/s1/200',
    workingHours: { start: '09:00', end: '17:00' },
    daysOff: [0, 1] // Sun, Mon off
  },
  { 
    id: 's2', 
    name: 'Sarah Chen', 
    email: 'sarah@glowup.com', 
    role: UserRole.STYLIST, 
    avatar: 'https://picsum.photos/seed/s2/200',
    workingHours: { start: '10:00', end: '20:00' },
    daysOff: [0, 2] // Sun, Tue off
  },
  { 
    id: 's3', 
    name: 'Marcus Bell', 
    email: 'marcus@glowup.com', 
    role: UserRole.STYLIST, 
    avatar: 'https://picsum.photos/seed/s3/200',
    workingHours: { start: '08:00', end: '16:00' },
    daysOff: [0, 6] // Sun, Sat off
  },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Hair Pomade (Matte)', stock: 45, threshold: 10, price: 18 },
  { id: 'p2', name: 'Beard Oil (Sandalwood)', stock: 8, threshold: 15, price: 22 },
  { id: 'p3', name: 'Facial Cleanser', stock: 25, threshold: 5, price: 30 },
];
