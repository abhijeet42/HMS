-- ============================================================
-- GL HMS — Feature Additions & Schema Updates
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- 1. Modify public.monthly_bills to support detailed breakdown and standard total_amount
ALTER TABLE public.monthly_bills DROP COLUMN IF EXISTS total_amount;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS laundry NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS maintenance NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS previous_due NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 2. Add admin_notes to public.students (not visible to students in UI)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Add email to public.hostel_settings
ALTER TABLE public.hostel_settings ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. Add notification_settings to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email": true, "rent_reminder": true, "complaints": true}'::jsonb;
