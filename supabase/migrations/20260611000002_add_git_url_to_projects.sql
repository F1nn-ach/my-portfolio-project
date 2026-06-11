-- Add git_url column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS git_url TEXT;
