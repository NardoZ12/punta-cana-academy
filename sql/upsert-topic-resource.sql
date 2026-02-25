-- ============================================================
-- FUNCIÓN UPSERT PARA TOPIC_RESOURCES (v3 - a prueba de balas)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PASO 0: Agregar columnas faltantes UNA POR UNA (sin DO block)
-- Si alguna ya existe, PostgreSQL la ignora con IF NOT EXISTS
-- ============================================================

ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS video_provider TEXT;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS pdf_title TEXT;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS slides_url TEXT;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS slides_provider TEXT;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS introduction TEXT DEFAULT ' ';
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS introduction_format TEXT DEFAULT 'markdown';
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS additional_resources JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS course_id UUID;

-- ============================================================
-- PASO 0b: CHECK constraints (borrar y recrear)
-- ============================================================
ALTER TABLE public.topic_resources DROP CONSTRAINT IF EXISTS topic_resources_slides_provider_check;
ALTER TABLE public.topic_resources 
  ADD CONSTRAINT topic_resources_slides_provider_check 
  CHECK (slides_provider IS NULL OR slides_provider IN ('google_slides', 'canva', 'pdf', 'custom'));

ALTER TABLE public.topic_resources DROP CONSTRAINT IF EXISTS topic_resources_video_provider_check;
ALTER TABLE public.topic_resources 
  ADD CONSTRAINT topic_resources_video_provider_check 
  CHECK (video_provider IS NULL OR video_provider IN ('youtube', 'vimeo', 'cloudflare', 'bunny', 'custom'));

ALTER TABLE public.topic_resources DROP CONSTRAINT IF EXISTS topic_resources_introduction_format_check;
ALTER TABLE public.topic_resources 
  ADD CONSTRAINT topic_resources_introduction_format_check 
  CHECK (introduction_format IS NULL OR introduction_format IN ('markdown', 'html', 'plain'));

-- UNIQUE constraint
DO $$ BEGIN
  ALTER TABLE public.topic_resources ADD CONSTRAINT one_resource_per_topic UNIQUE (topic_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PASO 1: Borrar TODA función vieja con ese nombre y recrear
-- ============================================================
DROP FUNCTION IF EXISTS public.upsert_topic_resource(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB);

CREATE OR REPLACE FUNCTION public.upsert_topic_resource(
  p_topic_id UUID,
  p_unit_id UUID,
  p_course_id UUID,
  p_introduction TEXT DEFAULT ' ',
  p_introduction_format TEXT DEFAULT 'markdown',
  p_video_url TEXT DEFAULT NULL,
  p_video_provider TEXT DEFAULT NULL,
  p_video_duration_seconds INTEGER DEFAULT NULL,
  p_pdf_url TEXT DEFAULT NULL,
  p_pdf_title TEXT DEFAULT NULL,
  p_slides_url TEXT DEFAULT NULL,
  p_slides_provider TEXT DEFAULT NULL,
  p_is_published BOOLEAN DEFAULT false,
  p_additional_resources JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  result JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF NOT EXISTS (
    SELECT 1 FROM courses WHERE id = p_course_id AND instructor_id = v_user_id
  ) THEN
    UPDATE courses SET instructor_id = v_user_id 
    WHERE id = p_course_id AND instructor_id IS NULL;
    
    IF NOT EXISTS (
      SELECT 1 FROM courses WHERE id = p_course_id AND instructor_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'No autorizado: no eres el instructor de este curso (user=%, course=%)', v_user_id, p_course_id;
    END IF;
  END IF;

  INSERT INTO topic_resources (
    topic_id, unit_id, course_id,
    introduction, introduction_format,
    video_url, video_provider, video_duration_seconds,
    pdf_url, pdf_title,
    slides_url, slides_provider,
    is_published, additional_resources,
    updated_at
  ) VALUES (
    p_topic_id, p_unit_id, p_course_id,
    p_introduction, p_introduction_format,
    p_video_url, p_video_provider, p_video_duration_seconds,
    p_pdf_url, p_pdf_title,
    p_slides_url, p_slides_provider,
    p_is_published, p_additional_resources,
    NOW()
  )
  ON CONFLICT (topic_id) DO UPDATE SET
    introduction = EXCLUDED.introduction,
    introduction_format = EXCLUDED.introduction_format,
    video_url = EXCLUDED.video_url,
    video_provider = EXCLUDED.video_provider,
    video_duration_seconds = EXCLUDED.video_duration_seconds,
    pdf_url = EXCLUDED.pdf_url,
    pdf_title = EXCLUDED.pdf_title,
    slides_url = EXCLUDED.slides_url,
    slides_provider = EXCLUDED.slides_provider,
    is_published = EXCLUDED.is_published,
    additional_resources = EXCLUDED.additional_resources,
    updated_at = NOW()
  RETURNING to_jsonb(topic_resources.*) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_topic_resource TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_topic_resource TO anon;

-- ============================================================
-- PASO 2: RLS policies
-- ============================================================
ALTER TABLE public.topic_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View resources" ON public.topic_resources;
CREATE POLICY "View resources" ON public.topic_resources FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = topic_resources.course_id AND instructor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = topic_resources.course_id AND student_id = auth.uid())
);

DROP POLICY IF EXISTS "Manage resources" ON public.topic_resources;
CREATE POLICY "Manage resources" ON public.topic_resources FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = topic_resources.course_id AND instructor_id = auth.uid())
);

-- ============================================================
-- VERIFICACIÓN: Debe mostrar slides_url y slides_provider
-- ============================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'topic_resources' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================
-- TEST: Verificar que la función existe
-- ============================================================
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'upsert_topic_resource' AND routine_schema = 'public';
