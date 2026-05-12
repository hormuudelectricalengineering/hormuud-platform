-- ENUM types
CREATE TYPE public.user_role AS ENUM ('customer', 'engineer', 'admin');
CREATE TYPE public.job_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('ebirr', 'cbe', 'bank', 'cash');
CREATE TYPE public.payment_status AS ENUM ('pending', 'held', 'completed', 'refunded');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role public.user_role NOT NULL DEFAULT 'customer',
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engineers table
CREATE TABLE public.engineers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    license_number VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) NOT NULL,
    engineer_id UUID REFERENCES public.engineers(id),
    service_category VARCHAR(100) NOT NULL,
    status public.job_status DEFAULT 'pending',
    address TEXT NOT NULL,
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    estimated_price DECIMAL(10,2),
    final_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method public.payment_method NOT NULL,
    status public.payment_status DEFAULT 'pending',
    transaction_ref VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings table
CREATE TABLE public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE UNIQUE,
    engineer_id UUID REFERENCES public.engineers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    stars INTEGER CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Security Policies

-- PROFILES: Users can only read and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ENGINEERS: Public can view verified engineers (for maps/dispatch). Engineers can update their own data (location/status).
CREATE POLICY "Anyone can view verified engineers" ON public.engineers FOR SELECT USING (is_verified = true);
CREATE POLICY "Engineers can update own location/status" ON public.engineers FOR UPDATE USING (
    user_id = auth.uid()
);

-- JOBS: Customers can see their own jobs. Engineers can see jobs assigned to them, or pending jobs (if we allow queue viewing).
-- For this MVP, Engineers can only see jobs where they are assigned. Customers only their own.
CREATE POLICY "Customers view own jobs" ON public.jobs FOR SELECT USING (
    customer_id = auth.uid()
);
CREATE POLICY "Engineers view assigned jobs" ON public.jobs FOR SELECT USING (
    engineer_id IN (SELECT id FROM public.engineers WHERE user_id = auth.uid())
);
CREATE POLICY "Customers can create jobs" ON public.jobs FOR INSERT WITH CHECK (
    customer_id = auth.uid()
);
CREATE POLICY "Customers and Assigned Engineers can update jobs" ON public.jobs FOR UPDATE USING (
    customer_id = auth.uid() OR engineer_id IN (SELECT id FROM public.engineers WHERE user_id = auth.uid())
);

-- PAYMENTS: Customers and Assigned Engineers can view payments related to their jobs
CREATE POLICY "Users view relevant payments" ON public.payments FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs 
        WHERE customer_id = auth.uid() OR engineer_id IN (SELECT id FROM public.engineers WHERE user_id = auth.uid())
    )
);

-- Setup Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.engineers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
