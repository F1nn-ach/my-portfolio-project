-- Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    skills TEXT[] DEFAULT '{}' NOT NULL,
    resume_url TEXT,
    resume_th_url TEXT,
    resume_en_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) on Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access to profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Create Trigger for auto-updating updated_at
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Seed Default Profile
INSERT INTO public.profiles (id, name, bio, skills, resume_url, resume_th_url, resume_en_url)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'F1nn-ach', 
    'I build high-performance backend systems with Go and design pixel-perfect, responsive web interfaces using Next.js.', 
    ARRAY['Go (Golang)', 'React / Next.js', 'Docker & Compose', 'PostgreSQL', 'TypeScript', 'Tailwind CSS'], 
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;
