-- Alter projects table to add is_visible column
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true NOT NULL;
