# GlowUp Backend Schema Documentation

This document outlines the database schema for the GlowUp AI-Powered Unisex Salon Management system. All tables are hosted on Supabase.

## Core Tables

### `profiles`
Stores extended user information for all roles (Admin, Stylist, Customer).
- `id` (UUID, PK): References `auth.users.id`.
- `full_name` (TEXT): User's legal or preferred name.
- `email` (TEXT): User's email address.
- `phone` (TEXT): User's contact number.
- `avatar_url` (TEXT): URL to profile image.
- `role` (TEXT): One of `'admin'`, `'stylist'`, `'customer'`.
- `working_hours` (JSONB): Stylist's working hours (e.g., `{"start": "09:00", "end": "17:00"}`).
- `days_off` (INT[]): Array of days (0-6) the stylist is off.
- `created_at` (TIMESTAMPTZ): Record creation timestamp.

## Inventory System

### `inventory_categories`
Groups inventory items (e.g., Hair Care, Skin Care, Tools).
- `id` (UUID, PK): Unique identifier.
- `name` (TEXT): Category name.
- `description` (TEXT): Optional description.
- `created_at` (TIMESTAMPTZ).

### `inventory_items`
Individual products or tools in stock.
- `id` (UUID, PK): Unique identifier.
- `category_id` (UUID, FK): References `inventory_categories.id`.
- `name` (TEXT): Item name.
- `description` (TEXT): Item details.
- `sku` (TEXT): Stock Keeping Unit (unique identifier).
- `unit` (TEXT): Measurement unit (e.g., 'ml', 'pcs', 'bottle').
- `min_stock_level` (INT): Threshold for low stock alerts.
- `current_stock` (INT): Current quantity on hand.
- `buy_price` (DECIMAL): Cost price (what the salon pays).
- `sell_price` (DECIMAL): Retail price (what the customer pays).
- `image_url` (TEXT): Product image URL (stored in Supabase Storage).
- `created_at` (TIMESTAMPTZ).

### `inventory_logs`
Tracks every stock movement (In, Out, Adjustment).
- `id` (UUID, PK): Unique identifier.
- `item_id` (UUID, FK): References `inventory_items.id`.
- `user_id` (UUID, FK): References `profiles.id` (who performed the action).
- `type` (TEXT): One of `'in'`, `'out'`, `'adjustment'`.
- `quantity` (INT): Amount moved.
- `reason` (TEXT): Explanation (e.g., 'New shipment', 'Used in service', 'Damaged').
- `created_at` (TIMESTAMPTZ).

## Booking & Services

### `services`
Salon services offered to customers.
- `id` (UUID, PK): Unique identifier.
- `name` (TEXT): Service name (e.g., 'Haircut', 'Facial').
- `description` (TEXT): Service details.
- `duration` (INT): Duration in minutes.
- `price` (DECIMAL): Service cost.
- `category` (TEXT): Service category.
- `image_url` (TEXT): Service preview image.
- `created_at` (TIMESTAMPTZ).

### `appointments`
Customer bookings.
- `id` (UUID, PK): Unique identifier.
- `customer_id` (UUID, FK): References `profiles.id`.
- `stylist_id` (UUID, FK): References `profiles.id`.
- `service_id` (UUID, FK): References `services.id`.
- `start_time` (TIMESTAMPTZ): Scheduled start.
- `end_time` (TIMESTAMPTZ): Scheduled end.
- `status` (TEXT): One of `'pending'`, `'confirmed'`, `'completed'`, `'cancelled'`.
- `notes` (TEXT): Customer or stylist notes.
- `total_price` (DECIMAL): Final price.
- `created_at` (TIMESTAMPTZ).

## AI & Personalization

### `user_style_preferences`
Stores AI-generated insights and user preferences.
- `id` (UUID, PK): Unique identifier.
- `user_id` (UUID, FK): References `profiles.id`.
- `face_shape` (TEXT): AI-detected face shape.
- `preferred_styles` (TEXT[]): List of preferred hairstyle types.
- `skin_tone` (TEXT): AI-detected skin tone.
- `last_tryon_image` (TEXT): URL to the last virtual try-on result.
- `updated_at` (TIMESTAMPTZ).
