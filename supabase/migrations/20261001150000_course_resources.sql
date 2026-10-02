CREATE TABLE public.course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (
    resource_type IN ('video', 'lecture_notes', 'exam', 'assignment', 'problem_set', 'other')
  ),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  description TEXT NOT NULL DEFAULT '',
  url TEXT,
  storage_path TEXT,
  content_type TEXT,
  position INTEGER NOT NULL CHECK (position > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((url IS NOT NULL) <> (storage_path IS NOT NULL)),
  UNIQUE(course_id, position)
);

CREATE INDEX course_resources_course_position_idx
  ON public.course_resources (course_id, position);

ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-materials',
  'course-materials',
  TRUE,
  104857600,
  ARRAY[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/markdown',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public can read course materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-materials');

CREATE POLICY "Administrators can upload course materials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-materials'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin' AND is_active = TRUE
    )
  );

CREATE POLICY "Administrators can update course materials"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-materials'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin' AND is_active = TRUE
    )
  )
  WITH CHECK (
    bucket_id = 'course-materials'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin' AND is_active = TRUE
    )
  );

CREATE POLICY "Administrators can delete course materials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-materials'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin' AND is_active = TRUE
    )
  );
