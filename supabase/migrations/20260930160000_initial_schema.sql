CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'Student',
  role TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  requested_name TEXT;
BEGIN
  requested_name := left(
    coalesce(nullif(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''), 'Student'),
    100
  );

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, requested_name);
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_auth_user();

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  subject TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  provider TEXT NOT NULL,
  source_url TEXT NOT NULL,
  license_name TEXT NOT NULL,
  license_url TEXT NOT NULL,
  attribution TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  quiz_question TEXT,
  quiz_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiz_answer_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, position),
  CHECK (
    (quiz_question IS NULL AND quiz_answer_index IS NULL AND quiz_options = '[]'::jsonb)
    OR (
      quiz_question IS NOT NULL
      AND quiz_answer_index IS NOT NULL
      AND quiz_answer_index >= 0
      AND CASE
        WHEN jsonb_typeof(quiz_options) = 'array'
          THEN jsonb_array_length(quiz_options) BETWEEN 2 AND 8
            AND quiz_answer_index < jsonb_array_length(quiz_options)
        ELSE FALSE
      END
    )
  )
);

CREATE TABLE public.lesson_progress (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX courses_published_updated_idx ON public.courses (is_published, updated_at DESC);
CREATE INDEX lessons_course_position_idx ON public.lessons (course_id, position);
CREATE INDEX lesson_progress_user_idx ON public.lesson_progress (user_id, completed_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
