-- GYM OS — Multi-Tenant PostgreSQL & Supabase Schema Blueprint
-- Enforces strict tenant isolation via gym_id and Row Level Security (RLS).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Gyms (Tenants)
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  account_status TEXT NOT NULL DEFAULT 'trial' CHECK (account_status IN ('active', 'suspended', 'trial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Application Users (Maps to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'GYM_OWNER', 'RECEPTIONIST', 'GYM_MEMBER')),
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Gym Staff
CREATE TABLE IF NOT EXISTS public.gym_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  staff_role TEXT NOT NULL CHECK (staff_role IN ('GYM_OWNER', 'RECEPTIONIST')),
  shift_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gym_id, user_id)
);

-- 4. Members
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  member_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  address TEXT,
  emergency_contact TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gym_id, member_code)
);

-- 5. Membership Plans
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'Custom')),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Memberships (Subscriptions per member)
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
  plan_name_snapshot TEXT NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  total_fee NUMERIC(12, 2) NOT NULL CHECK (total_fee >= 0),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Payments (Append-Only Ledger; never overwrite prior installments)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE RESTRICT,
  receipt_number TEXT NOT NULL,
  amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid > 0),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi_manual', 'card_manual', 'other_manual', 'verified_gateway')),
  verification_source TEXT NOT NULL DEFAULT 'manual_entry' CHECK (verification_source IN ('manual_entry', 'verified_payment_gateway')),
  recorded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  transaction_status TEXT NOT NULL DEFAULT 'completed' CHECK (transaction_status IN ('completed', 'voided')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gym_id, receipt_number)
);

-- 8. Attendance (Supports Front Desk & future QR check-in)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT NOT NULL DEFAULT 'front_desk' CHECK (method IN ('front_desk', 'qr_scan')),
  recorded_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Expenses (Owner-only operational expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Notifications & Renewal Requests
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expiry_alert', 'payment_due', 'renewal_request', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  requested_plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  action_status TEXT CHECK (action_status IN ('pending', 'approved', 'dismissed')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Gym SaaS Subscriptions (Managed by Super Admin)
CREATE TABLE IF NOT EXISTS public.gym_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('Starter', 'Pro', 'Enterprise')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'suspended')),
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for multi-tenant query performance
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON public.members(gym_id);
CREATE INDEX IF NOT EXISTS idx_memberships_gym_member ON public.memberships(gym_id, member_id);
CREATE INDEX IF NOT EXISTS idx_payments_gym_date ON public.payments(gym_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_gym_checkin ON public.attendance(gym_id, check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_gym_unread ON public.notifications(gym_id, is_read);

-- Enable Row Level Security across all tenant tables
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper function: current user's gym_id & role
CREATE OR REPLACE FUNCTION public.current_user_gym_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT gym_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Tenant Isolation Policies
CREATE POLICY "Tenant isolation for members" ON public.members
  FOR ALL USING (
    gym_id = public.current_user_gym_id()
    AND (
      public.current_user_role() IN ('GYM_OWNER', 'RECEPTIONIST')
      OR (public.current_user_role() = 'GYM_MEMBER' AND user_id = auth.uid())
    )
  );

CREATE POLICY "Tenant isolation for payments" ON public.payments
  FOR SELECT USING (
    gym_id = public.current_user_gym_id()
    AND (
      public.current_user_role() IN ('GYM_OWNER', 'RECEPTIONIST')
      OR (
        public.current_user_role() = 'GYM_MEMBER'
        AND member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Staff and owners insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    gym_id = public.current_user_gym_id()
    AND public.current_user_role() IN ('GYM_OWNER', 'RECEPTIONIST')
  );

CREATE POLICY "Owner only expenses" ON public.expenses
  FOR ALL USING (
    gym_id = public.current_user_gym_id()
    AND public.current_user_role() = 'GYM_OWNER'
  );

CREATE POLICY "Super Admin manages gym subscriptions" ON public.gym_subscriptions
  FOR ALL USING (public.current_user_role() = 'SUPER_ADMIN');
