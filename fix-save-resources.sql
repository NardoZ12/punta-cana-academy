-- =============================================
-- FIX: Save Topic Resources via RPC
-- Run this in Supabase SQL Editor
-- =============================================
-- Creates a SECURITY DEFINER function that bypasses RLS
-- to save topic resources reliably
-- =============================================

CREATE OR REPLACE FUNCTION save_topic_resources(
  p_topic_id UUID,
  p_unit_id UUID,
  p_course_id UUID,
  p_introduction TEXT DEFAULT '',
  p_introduction_format TEXT DEFAULT 'markdown',
  p_video_url TEXT DEFAULT NULL,
  p_video_provider TEXT DEFAULT NULL,
  p_video_duration_seconds INTEGER DEFAULT NULL,
  p_pdf_url TEXT DEFAULT NULL,
  p_pdf_title TEXT DEFAULT NULL,
  p_slides_url TEXT DEFAULT NULL,
  p_slides_provider TEXT DEFAULT NULL,
  p_is_published BOOLEAN DEFAULT false,
  p_additional_resources JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
  v_existing_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Verify user is instructor of this course
  IF NOT EXISTS (
    SELECT 1 FROM courses 
    WHERE id = p_course_id 
    AND instructor_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para editar este curso';
  END IF;

  -- Check if resource already exists for this topic
  SELECT id INTO v_existing_id
  FROM topic_resources
  WHERE topic_id = p_topic_id;

  IF v_existing_id IS NOT NULL THEN
    -- UPDATE existing
    UPDATE topic_resources SET
      introduction = COALESCE(NULLIF(p_introduction, ''), ' '),
      introduction_format = p_introduction_format,
      video_url = p_video_url,
      video_provider = p_video_provider,
      video_duration_seconds = p_video_duration_seconds,
      pdf_url = p_pdf_url,
      pdf_title = p_pdf_title,
      slides_url = p_slides_url,
      slides_provider = p_slides_provider,
      is_published = p_is_published,
      additional_resources = p_additional_resources,
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING * INTO v_result;
  ELSE
    -- INSERT new
    INSERT INTO topic_resources (
      topic_id, unit_id, course_id,
      introduction, introduction_format,
      video_url, video_provider, video_duration_seconds,
      pdf_url, pdf_title,
      slides_url, slides_provider,
      is_published, additional_resources
    ) VALUES (
      p_topic_id, p_unit_id, p_course_id,
      COALESCE(NULLIF(p_introduction, ''), ' '), p_introduction_format,
      p_video_url, p_video_provider, p_video_duration_seconds,
      p_pdf_url, p_pdf_title,
      p_slides_url, p_slides_provider,
      p_is_published, p_additional_resources
    )
    RETURNING * INTO v_result;
  END IF;

  -- Return the saved row as JSON
  RETURN to_jsonb(v_result);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION save_topic_resources TO authenticated;

-- Force PostgREST to reload schema and discover the new function
NOTIFY pgrst, 'reload schema';

-- =============================================
-- DONE! The function is now available via:
-- supabase.rpc('save_topic_resources', { ... })
-- =============================================
