-- ============================================================
-- RPC: grade_assignment - Profesor califica una entrega
-- ============================================================

DROP FUNCTION IF EXISTS public.grade_assignment;

CREATE OR REPLACE FUNCTION public.grade_assignment(
    p_submission_id UUID,
    p_score DECIMAL(5,2),
    p_feedback TEXT DEFAULT ''
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_user_id UUID;
    v_submission RECORD;
    v_assignment RECORD;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    
    -- Obtener la submission
    SELECT s.*, a.course_id, a.title as assignment_title, a.max_points
    INTO v_submission
    FROM assignment_submissions s
    JOIN assignments a ON a.id = s.assignment_id
    WHERE s.id = p_submission_id;
    
    IF v_submission.id IS NULL THEN
        RAISE EXCEPTION 'Entrega no encontrada';
    END IF;
    
    -- Verificar que el usuario es el instructor del curso
    IF NOT EXISTS (
        SELECT 1 FROM courses 
        WHERE id = v_submission.course_id AND instructor_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'No autorizado: no eres el instructor de este curso';
    END IF;
    
    -- Actualizar la submission
    UPDATE assignment_submissions SET
        score = p_score,
        instructor_feedback = p_feedback,
        status = 'graded',
        graded_at = NOW(),
        graded_by = v_user_id,
        updated_at = NOW()
    WHERE id = p_submission_id;
    
    -- Crear notificación para el estudiante
    INSERT INTO notifications (
        user_id, title, message, type, link,
        reference_id, reference_type, is_read, created_at
    ) VALUES (
        v_submission.student_id,
        'Tarea calificada: ' || v_submission.assignment_title,
        'Tu entrega ha sido calificada: ' || p_score || '/' || v_submission.max_points ||
        CASE WHEN p_feedback IS NOT NULL AND p_feedback != '' 
            THEN '. Comentario: ' || LEFT(p_feedback, 100)
            ELSE '' END,
        'grade_updated', '/dashboard/student/tasks',
        p_submission_id, 'submission', false, NOW()
    );
    
    SELECT to_jsonb(s.*) INTO v_result 
    FROM assignment_submissions s WHERE s.id = p_submission_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'submission', v_result
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grade_assignment TO authenticated;

-- Asegurar que las columnas necesarias existen
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS score DECIMAL(5,2);
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS instructor_feedback TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS graded_by UUID;
