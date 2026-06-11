-- Alter profiles table to add avatar_url
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- Create profile_documents
CREATE TABLE IF NOT EXISTS public.profile_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profile_gallery
CREATE TABLE IF NOT EXISTS public.profile_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    tags TEXT[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create project_documents
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) on new tables
ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- Policies for profile_documents
CREATE POLICY "Allow public read access to profile_documents" ON public.profile_documents
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access to profile_documents" ON public.profile_documents
    FOR ALL USING (auth.role() = 'authenticated');

-- Policies for profile_gallery
CREATE POLICY "Allow public read access to profile_gallery" ON public.profile_gallery
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access to profile_gallery" ON public.profile_gallery
    FOR ALL USING (auth.role() = 'authenticated');

-- Policies for project_documents
CREATE POLICY "Allow public read access to project_documents" ON public.project_documents
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access to project_documents" ON public.project_documents
    FOR ALL USING (auth.role() = 'authenticated');

-- Migrate existing resumes into profile_documents table if they exist
INSERT INTO public.profile_documents (profile_id, name, url)
SELECT id, 'Resume (General)', resume_url FROM public.profiles WHERE resume_url IS NOT NULL AND resume_url <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_documents (profile_id, name, url)
SELECT id, 'Resume (Thai)', resume_th_url FROM public.profiles WHERE resume_th_url IS NOT NULL AND resume_th_url <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_documents (profile_id, name, url)
SELECT id, 'Resume (English)', resume_en_url FROM public.profiles WHERE resume_en_url IS NOT NULL AND resume_en_url <> ''
ON CONFLICT DO NOTHING;

-- Drop old columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS resume_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS resume_th_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS resume_en_url;
