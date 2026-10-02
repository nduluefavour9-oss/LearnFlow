ALTER TABLE public.courses
  ADD COLUMN details JSONB NOT NULL DEFAULT '{}'::jsonb;
