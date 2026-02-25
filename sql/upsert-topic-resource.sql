-- ============================================================
-- FUNCIÓN UPSERT PARA TOPIC_RESOURCES
-- Usa SECURITY DEFINER para bypassear RLS (que bloquea PATCH/POST directo)
-- Pero verifica internamente que el usuario sea instructor del curso.
-- ============================================================

-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- PASO 0: Asegurar que existen TODAS las columnas necesarias
-- (CREATE TABLE IF NOT EXISTS NO agrega columnas nuevas a tablas existentes)
-- ============================================================
DO $$ BEGIN
  -- Columnas de video
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS video_url TEXT;
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS video_provider TEXT;
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER;
  
  -- Columnas de PDF
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS pdf_url TEXT;
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS pdf_title TEXT;
  
  -- Columnas de SLIDES (probablemente las que faltan)
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS slides_url TEXT;
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS slides_provider TEXT;
  
  -- Otras columnas necesarias
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS introduction TEXT DEFAULT ' ';
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS introduction_format TEXT DEFAULT 'markdown';
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS additional_resources JSONB DEFAULT '{}'::jsonb;
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
  ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  
  RAISE NOTICE 'Columnas verificadas/agregadas exitosamente';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error al verificar columnas: %', SQLERRM;
END $$;

-- Asegurar CHECK constraint en slides_provider (si la columna existía sin constraint)
DO $$ BEGIN
  ALTER TABLE public.topic_resources DROP CONSTRAINT IF EXISTS topic_resources_slides_provider_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.topic_resources 
    ADD CONSTRAINT topic_resources_slides_provider_check 
    CHECK (slides_provider IS NULL OR slides_provider IN ('google_slides', 'canva', 'pdf', 'custom'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CHECK constraint ya existe o no se pudo crear: %', SQLERRM;
END $$;

-- Asegurar UNIQUE constraint en topic_id
DO $$ BEGIN
  ALTER TABLE public.topic_resources DROP CONSTRAINT IF EXISTS one_resource_per_topic;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN  
  ALTER TABLE public.topic_resources 
    ADD CONSTRAINT one_resource_per_topic UNIQUE (topic_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'UNIQUE constraint ya existe: %', SQLERRM;
END $$;

-- ============================================================
-- PASO 1: Crear la función RPC
-- ============================================================

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
  
  -- Verificar que el usuario es instructor del curso
  IF NOT EXISTS (
    SELECT 1 FROM courses WHERE id = p_course_id AND instructor_id = v_user_id
  ) THEN
    -- Auto-asignar instructor_id si es NULL
    UPDATE courses SET instructor_id = v_user_id 
    WHERE id = p_course_id AND instructor_id IS NULL;
    
    -- Re-verificar
    IF NOT EXISTS (
      SELECT 1 FROM courses WHERE id = p_course_id AND instructor_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'No autorizado: no eres el instructor de este curso';
    END IF;
  END IF;

  -- UPSERT: INSERT o UPDATE en una sola operación atómica
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

-- Permitir que usuarios autenticados llamen esta función
GRANT EXECUTE ON FUNCTION public.upsert_topic_resource TO authenticated;

-- ============================================================
-- PASO 2: Asegurar RLS policies para que estudiantes vean recursos
-- ============================================================
ALTER TABLE public.topic_resources ENABLE ROW LEVEL SECURITY;

-- Los estudiantes inscritos y el instructor pueden VER recursos
DROP POLICY IF EXISTS "View resources" ON public.topic_resources;
CREATE POLICY "View resources" ON public.topic_resources FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = topic_resources.course_id AND instructor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = topic_resources.course_id AND student_id = auth.uid())
);

-- El instructor puede gestionar recursos (INSERT/UPDATE/DELETE) 
-- Nota: usamos SECURITY DEFINER function para bypasear esto, pero lo dejamos por si acaso
DROP POLICY IF EXISTS "Manage resources" ON public.topic_resources;
CREATE POLICY "Manage resources" ON public.topic_resources FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = topic_resources.course_id AND instructor_id = auth.uid())
);

-- ============================================================
-- VERIFICACIÓN: Mostrar las columnas actuales de topic_resources
-- ============================================================
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'topic_resources' AND table_schema = 'public'
ORDER BY ordinal_position;
