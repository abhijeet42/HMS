-- Alter hostel_settings table to add upi_id
ALTER TABLE public.hostel_settings ADD COLUMN IF NOT EXISTS upi_id TEXT;
