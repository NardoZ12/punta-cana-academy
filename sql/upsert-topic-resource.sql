-- ============================================================
-- FUNCIÓN UPSERT PARA TOPIC_RESOURCES
-- Usa SECURITY DEFINER para bypassear RLS (que bloquea PATCH/POST directo)
-- Pero verifica internamente que el usuario sea instructor del curso.
-- ============================================================

-- Ejecutar en Supabase SQL Editor

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
