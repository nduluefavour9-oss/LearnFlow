CREATE TABLE IF NOT EXISTS public.course_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS course_submissions_status_created_idx
  ON public.course_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS course_submissions_submitter_idx
  ON public.course_submissions (submitted_by, created_at DESC);

ALTER TABLE public.course_submissions ENABLE ROW LEVEL SECURITY;
