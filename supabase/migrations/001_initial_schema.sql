-- ============================================================
-- GL HMS — Complete Database Migration
-- Run this entire script in your Supabase SQL Editor
-- Project: GL Hostel Management System
-- ============================================================

-- Enable UUID extension (usually already enabled on Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- Extends Supabase auth.users with role and display info
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLE: rooms
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT UNIQUE NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
  occupied_beds INTEGER NOT NULL DEFAULT 0 CHECK (occupied_beds >= 0),
  monthly_rent NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (monthly_rent >= 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'full', 'maintenance')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT occupied_not_exceed_capacity CHECK (occupied_beds <= capacity)
);

-- ============================================================
-- TABLE: students
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL UNIQUE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  parent_phone TEXT,
  college TEXT,
  course TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checkout_date DATE,
  emergency_contact TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'checked_out')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLE: monthly_bills
-- One bill per student per month — contains all charge components
-- total_amount is auto-calculated
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monthly_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  -- Billing components
  base_rent NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (base_rent >= 0),
  electricity NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (electricity >= 0),
  water NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (water >= 0),
  internet NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (internet >= 0),
  food NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (food >= 0),
  cleaning NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cleaning >= 0),
  other_charges NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (other_charges >= 0),
  late_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (late_fee >= 0),
  other_label TEXT,          -- Custom label for other_charges
  -- Payment tracking
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- One bill per student per month
  UNIQUE(student_id, month, year)
);

-- Add computed total_amount column
ALTER TABLE public.monthly_bills
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2)
    GENERATED ALWAYS AS (base_rent + electricity + water + internet + food + cleaning + other_charges + late_fee)
    STORED;

-- ============================================================
-- TABLE: payment_transactions
-- Individual payment events recorded against a monthly bill
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.monthly_bills(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_mode TEXT NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'other')),
  transaction_ref TEXT,
  collected_by TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLE: expenses
-- Admin tracks hostel operating expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('electricity', 'water', 'internet', 'cleaning', 'maintenance', 'food', 'furniture', 'other')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLE: notices
-- Admin publishes notices visible to all students
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLE: complaints
-- Students submit; admin updates status
-- ============================================================
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fan', 'light', 'water', 'internet', 'cleaning', 'furniture', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLE: hostel_settings
-- Single row for hostel configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hostel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_name TEXT NOT NULL DEFAULT 'GL Hostel',
  address TEXT,
  contact_number TEXT,
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default settings row
INSERT INTO public.hostel_settings (hostel_name)
VALUES ('GL Hostel')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FUNCTIONS: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['rooms','students','monthly_bills','expenses','complaints','hostel_settings'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- FUNCTION: auto-create profile on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: update room occupied_beds on student room change
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement old room
  IF OLD.room_id IS NOT NULL AND OLD.room_id != NEW.room_id THEN
    UPDATE public.rooms
    SET occupied_beds = GREATEST(0, occupied_beds - 1),
        status = CASE WHEN occupied_beds - 1 < capacity THEN 'available' ELSE status END
    WHERE id = OLD.room_id;
  END IF;

  -- Increment new room
  IF NEW.room_id IS NOT NULL AND (OLD.room_id IS NULL OR OLD.room_id != NEW.room_id) THEN
    UPDATE public.rooms
    SET occupied_beds = occupied_beds + 1,
        status = CASE WHEN occupied_beds + 1 >= capacity THEN 'full' ELSE 'available' END
    WHERE id = NEW.room_id;
  END IF;

  -- Handle checkout
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' AND OLD.room_id IS NOT NULL THEN
    UPDATE public.rooms
    SET occupied_beds = GREATEST(0, occupied_beds - 1),
        status = 'available'
    WHERE id = OLD.room_id;
    NEW.room_id := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_student_room_change ON public.students;
CREATE TRIGGER on_student_room_change
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_room_occupancy();

-- Trigger for new student insert (room assignment on creation)
CREATE OR REPLACE FUNCTION public.increment_room_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.room_id IS NOT NULL THEN
    UPDATE public.rooms
    SET occupied_beds = occupied_beds + 1,
        status = CASE WHEN occupied_beds + 1 >= capacity THEN 'full' ELSE 'available' END
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_student_insert ON public.students;
CREATE TRIGGER on_student_insert
  AFTER INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.increment_room_on_insert();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get student id for current user
CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS UUID AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- profiles ----
CREATE POLICY "Admin: full access on profiles"
  ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Student: view own profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Student: update own profile"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

-- ---- rooms ----
CREATE POLICY "Admin: full access on rooms"
  ON public.rooms FOR ALL USING (public.is_admin());
CREATE POLICY "Student: read rooms"
  ON public.rooms FOR SELECT USING (auth.uid() IS NOT NULL);

-- ---- students ----
CREATE POLICY "Admin: full access on students"
  ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Student: view own student record"
  ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Student: update own student record"
  ON public.students FOR UPDATE USING (user_id = auth.uid());

-- ---- monthly_bills ----
CREATE POLICY "Admin: full access on monthly_bills"
  ON public.monthly_bills FOR ALL USING (public.is_admin());
CREATE POLICY "Student: view own bills"
  ON public.monthly_bills FOR SELECT USING (student_id = public.get_my_student_id());

-- ---- payment_transactions ----
CREATE POLICY "Admin: full access on payment_transactions"
  ON public.payment_transactions FOR ALL USING (public.is_admin());
CREATE POLICY "Student: view own transactions"
  ON public.payment_transactions FOR SELECT USING (student_id = public.get_my_student_id());

-- ---- expenses ----
CREATE POLICY "Admin: full access on expenses"
  ON public.expenses FOR ALL USING (public.is_admin());
-- Students have NO access to expenses

-- ---- notices ----
CREATE POLICY "Admin: full access on notices"
  ON public.notices FOR ALL USING (public.is_admin());
CREATE POLICY "Student: view active notices"
  ON public.notices FOR SELECT USING (is_active = TRUE AND auth.uid() IS NOT NULL);

-- ---- complaints ----
CREATE POLICY "Admin: full access on complaints"
  ON public.complaints FOR ALL USING (public.is_admin());
CREATE POLICY "Student: view own complaints"
  ON public.complaints FOR SELECT USING (student_id = public.get_my_student_id());
CREATE POLICY "Student: insert own complaint"
  ON public.complaints FOR INSERT WITH CHECK (student_id = public.get_my_student_id());
CREATE POLICY "Student: update own complaint (limited)"
  ON public.complaints FOR UPDATE USING (student_id = public.get_my_student_id());

-- ---- hostel_settings ----
CREATE POLICY "Admin: full access on hostel_settings"
  ON public.hostel_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Authenticated: read hostel_settings"
  ON public.hostel_settings FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_room_id ON public.students(room_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_monthly_bills_student_id ON public.monthly_bills(student_id);
CREATE INDEX IF NOT EXISTS idx_monthly_bills_month_year ON public.monthly_bills(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_bills_status ON public.monthly_bills(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bill_id ON public.payment_transactions(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_student_id ON public.payment_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON public.complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_notices_active ON public.notices(is_active);

-- ============================================================
-- DONE! Next steps:
-- 1. Go to Supabase Auth > Settings > Email Templates (optional: customize)
-- 2. Go to Supabase Auth > Providers > Email: enable "Confirm email" = OFF
--    (so admin-created accounts work immediately without email verification)
-- 3. Create your admin account in Supabase Auth dashboard:
--    Authentication > Users > Add User
--    Then run: UPDATE public.profiles SET role = 'admin' WHERE id = '<your-user-id>';
-- ============================================================
