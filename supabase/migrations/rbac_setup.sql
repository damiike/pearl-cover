-- ============================================================
-- RBAC Migration: Role-Based Access Control
-- ============================================================

-- Drop existing constraint on profiles.role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Create user_role enum type
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'owner', 'support', 'read_only', 'supplier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table to use new role enum
ALTER TABLE public.profiles 
    ALTER COLUMN role TYPE TEXT;

ALTER TABLE public.profiles 
    ALTER COLUMN role SET DEFAULT 'owner';

-- Pages registry table
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Page permissions table
CREATE TABLE IF NOT EXISTS public.role_page_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL,
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, page_id)
);

-- User-specific permission overrides table
CREATE TABLE IF NOT EXISTS public.user_page_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    can_view BOOLEAN,
    can_create BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, page_id)
);

-- Seed default pages
INSERT INTO public.pages (slug, name, description, is_system) VALUES
    ('dashboard', 'Dashboard', 'Overview and quick actions', true),
    ('aged-care', 'Aged Care', 'Aged care expenses and funding', true),
    ('workcover', 'WorkCover', 'WorkCover claims and expenses', true),
    ('payments', 'Payments', 'Payment transactions', true),
    ('notes', 'Notes', 'Notes and documentation', true),
    ('calendar', 'Calendar', 'Calendar and events', true),
    ('suppliers', 'Suppliers', 'Supplier directory', true),
    ('reports', 'Reports', 'Financial reports', true),
    ('search', 'Search', 'Global search', true),
    ('audit-log', 'Audit Log', 'System audit trail', true),
    ('settings', 'Settings', 'User settings', true),
    ('admin', 'Admin', 'Admin panel', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed default role permissions
-- Admin: Full access to everything
INSERT INTO public.role_page_permissions (role, page_id, can_view, can_create, can_update, can_delete)
SELECT 'admin', id, true, true, true, true FROM public.pages
ON CONFLICT (role, page_id) DO NOTHING;

-- Owner: Full access except admin panel
INSERT INTO public.role_page_permissions (role, page_id, can_view, can_create, can_update, can_delete)
SELECT 'owner', id, true, true, true, true FROM public.pages WHERE slug != 'admin'
ON CONFLICT (role, page_id) DO NOTHING;

-- Support: View most, create/update limited
INSERT INTO public.role_page_permissions (role, page_id, can_view, can_create, can_update, can_delete)
SELECT 
    'support', 
    id, 
    true,
    slug IN ('notes', 'calendar'),
    slug IN ('notes', 'calendar', 'aged-care', 'workcover'),
    false
FROM public.pages WHERE slug != 'admin'
ON CONFLICT (role, page_id) DO NOTHING;

-- Read-only: View only
INSERT INTO public.role_page_permissions (role, page_id, can_view, can_create, can_update, can_delete)
SELECT 'read_only', id, true, false, false, false FROM public.pages WHERE slug != 'admin'
ON CONFLICT (role, page_id) DO NOTHING;

-- Supplier: Limited view and update own info
INSERT INTO public.role_page_permissions (role, page_id, can_view, can_create, can_update, can_delete)
SELECT 
    'supplier', 
    id, 
    slug IN ('dashboard', 'suppliers', 'settings'),
    false,
    slug = 'suppliers',
    false
FROM public.pages WHERE slug != 'admin'
ON CONFLICT (role, page_id) DO NOTHING;

-- Add RLS policies for new tables
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_page_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_page_permissions ENABLE ROW LEVEL SECURITY;

-- Pages: Admins can manage, everyone can view
CREATE POLICY "Admins can manage pages" ON public.pages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Everyone can view pages" ON public.pages
    FOR SELECT USING (true);

-- Role permissions: Admins can manage, everyone can view their own
CREATE POLICY "Admins can manage role permissions" ON public.role_page_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view role permissions" ON public.role_page_permissions
    FOR SELECT USING (true);

-- User permissions: Admins can manage, users can view their own
CREATE POLICY "Admins can manage user permissions" ON public.user_page_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own permissions" ON public.user_page_permissions
    FOR SELECT USING (user_id = auth.uid());
