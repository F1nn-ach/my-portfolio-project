-- Create Trigger Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    tech TEXT[] DEFAULT '{}' NOT NULL,
    video_url TEXT,
    demo_url TEXT,
    status TEXT DEFAULT 'Active' NOT NULL,
    deploys_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) on Projects Table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policies for Projects
CREATE POLICY "Allow public read access to projects" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access to projects" ON public.projects
    FOR ALL USING (auth.role() = 'authenticated');

-- Create Deployments Table
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'Pending' NOT NULL,
    logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) on Deployments Table
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- Policies for Deployments
CREATE POLICY "Allow public read access to deployments" ON public.deployments
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access to deployments" ON public.deployments
    FOR ALL USING (auth.role() = 'authenticated');

-- Create Triggers for auto-updating updated_at
CREATE TRIGGER update_projects_modtime
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_deployments_modtime
    BEFORE UPDATE ON public.deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
