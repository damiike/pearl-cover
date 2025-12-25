-- Calendar Categories
CREATE TABLE IF NOT EXISTS public.calendar_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6', -- blue-500 default
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS for calendar_categories
ALTER TABLE public.calendar_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view calendar categories"
    ON public.calendar_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage calendar categories"
    ON public.calendar_categories FOR ALL
    TO authenticated
    USING (true);


-- Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    location TEXT,
    category_id UUID REFERENCES public.calendar_categories(id),
    source TEXT DEFAULT 'local' CHECK (source IN ('local', 'google', 'outlook')),
    external_id TEXT, -- ID from Google/Outlook
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS for calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view calendar events"
    ON public.calendar_events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage calendar events"
    ON public.calendar_events FOR ALL
    TO authenticated
    USING (true);

-- Event Tags
CREATE TABLE IF NOT EXISTS public.event_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for event_tags
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view event tags"
    ON public.event_tags FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage event tags"
    ON public.event_tags FOR ALL
    TO authenticated
    USING (true);

-- Default Categories (Seed)
INSERT INTO public.calendar_categories (name, color, sort_order) VALUES
    ('Work', '#3b82f6', 1),     -- Blue
    ('Personal', '#10b981', 2), -- Green
    ('Appointment', '#f59e0b', 3), -- Amber
    ('Booking', '#8b5cf6', 4)   -- Violet
ON CONFLICT DO NOTHING;
