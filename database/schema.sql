-- ====================================================================
-- DATABASE SCHEMA REFERENCE
-- This file serves as a documentation of the schema setup in Supabase.
-- ====================================================================

-- 1. Projects Table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    tech TEXT[] DEFAULT '{}' NOT NULL,
    video_url TEXT,
    demo_url TEXT,
    status TEXT DEFAULT 'Active' NOT NULL, -- e.g. 'Active', 'Archived'
    deploys_count INTEGER DEFAULT 0 NOT NULL,
    is_visible BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS Configuration for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users full access to projects" ON public.projects FOR ALL USING (auth.role() = 'authenticated');


-- 2. Deployments Table
CREATE TABLE public.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'Pending' NOT NULL, -- e.g. 'Pending', 'Building', 'Success', 'Failed'
    logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS Configuration for Deployments
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to deployments" ON public.deployments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users full access to deployments" ON public.deployments FOR ALL USING (auth.role() = 'authenticated');


-- 3. Utility Triggers for Auto-Updating updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_modtime
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_deployments_modtime
    BEFORE UPDATE ON public.deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- 4. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    skills TEXT[] DEFAULT '{}' NOT NULL,
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS Configuration for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users full access to profiles" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- 5. Profile Documents Table
CREATE TABLE public.profile_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to profile_documents" ON public.profile_documents FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users full access to profile_documents" ON public.profile_documents FOR ALL USING (auth.role() = 'authenticated');


-- 6. Profile Gallery Table
CREATE TABLE public.profile_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    tags TEXT[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profile_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to profile_gallery" ON public.profile_gallery FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users full access to profile_gallery" ON public.profile_gallery FOR ALL USING (auth.role() = 'authenticated');


-- 7. Project Documents Table
CREATE TABLE public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to project_documents" ON public.project_documents FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users full access to project_documents" ON public.project_documents FOR ALL USING (auth.role() = 'authenticated');