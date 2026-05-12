-- Messages table
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their jobs" ON public.messages FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs 
        WHERE customer_id = auth.uid() OR engineer_id IN (SELECT id FROM public.engineers WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Saved Locations table
CREATE TABLE public.saved_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Home', 'Office'
    address TEXT NOT NULL,
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own locations" ON public.saved_locations FOR ALL USING (
    customer_id = auth.uid()
);

-- Favorite Engineers table
CREATE TABLE public.favorite_engineers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    engineer_id UUID REFERENCES public.engineers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, engineer_id)
);

ALTER TABLE public.favorite_engineers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own favorites" ON public.favorite_engineers FOR ALL USING (
    customer_id = auth.uid()
);
