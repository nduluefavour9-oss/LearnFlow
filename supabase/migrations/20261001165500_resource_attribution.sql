ALTER TABLE public.course_resources
  ADD COLUMN license_name TEXT NOT NULL DEFAULT 'Review resource terms before reuse',
  ADD COLUMN attribution TEXT NOT NULL DEFAULT '';
