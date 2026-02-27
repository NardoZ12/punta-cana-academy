-- ============================================================
-- FIX: assignment_submissions - agregar columnas faltantes y RPC
-- ============================================================

-- 1. Agregar columnas que el código usa pero la migration no creó
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 2. Asegurar RLS está habilitado con políticas correctas
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own submissions" ON public.assignment_submissions;
CREATE POLICY "Students view own submissions" ON public.assignment_submissions FOR SELECT USING (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Teachers view course submissions" ON public.assignment_submissions;
CREATE POLICY "Teachers view course submissions" ON public.assignment_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.courses c ON c.id = a.course_id
        WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Students create submissions" ON public.assignment_submissions;
CREATE POLICY "Students create submissions" ON public.assignment_submissions FOR INSERT WITH CHECK (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students update own submissions" ON public.assignment_submissions;
CREATE POLICY "Students update own submissions" ON public.assignment_submissions FOR UPDATE USING (
    student_id = auth.uid() AND status != 'graded'
);

DROP POLICY IF EXISTS "Teachers grade submissions" ON public.assignment_submissions;
CREATE POLICY "Teachers grade submissions" ON public.assignment_submissions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.courses c ON c.id = a.course_id
        WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid()
    )
);

-- 3. Crear RPC SECURITY DEFINER para que los estudiantes puedan enviar tareas sin RLS issues
DROP FUNCTION IF EXISTS public.submit_assignment;

CREATE OR REPLACE FUNCTION public.submit_assignment(
    p_assignment_id UUID,
    p_submission_text TEXT DEFAULT '',
    p_submitted_files JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_user_id UUID;
    v_submission_id UUID;
    v_result JSONB;
    v_assignment RECORD;
BEGIN
    v_user_id := auth.uid();
    
    -- Verificar que la tarea existe
    SELECT a.id, a.title, a.course_id, a.due_date
    INTO v_assignment
    FROM assignments a WHERE a.id = p_assignment_id;
    
    IF v_assignment.id IS NULL THEN
        RAISE EXCEPTION 'Tarea no encontrada';
    END IF;
    
    -- Verificar que el estudiante está inscrito en el curso
    IF NOT EXISTS (
        SELECT 1 FROM enrollments 
        WHERE course_id = v_assignment.course_id AND student_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'No estás inscrito en este curso';
    END IF;
    
    -- Verificar si ya existe una entrega
    IF EXISTS (
        SELECT 1 FROM assignment_submissions 
        WHERE assignment_id = p_assignment_id AND student_id = v_user_id
    ) THEN
        -- Actualizar entrega existente
        UPDATE assignment_submissions SET
            submission_text = p_submission_text,
            submitted_files = p_submitted_files,
            submitted_at = NOW(),
            status = CASE 
                WHEN v_assignment.due_date IS NOT NULL AND NOW() > v_assignment.due_date THEN 'late'
                ELSE 'submitted'
            END,
            is_late = CASE 
                WHEN v_assignment.due_date IS NOT NULL AND NOW() > v_assignment.due_date THEN true
                ELSE false
            END,
            updated_at = NOW()
        WHERE assignment_id = p_assignment_id AND student_id = v_user_id
        RETURNING id INTO v_submission_id;
    ELSE
        -- Crear nueva entrega
        INSERT INTO assignment_submissions (
            assignment_id, student_id, submission_text, submitted_files,
            submitted_at, status, is_late, created_at, updated_at
        ) VALUES (
            p_assignment_id, v_user_id, p_submission_text, p_submitted_files,
            NOW(),
            CASE 
                WHEN v_assignment.due_date IS NOT NULL AND NOW() > v_assignment.due_date THEN 'late'
                ELSE 'submitted'
            END,
            CASE 
                WHEN v_assignment.due_date IS NOT NULL AND NOW() > v_assignment.due_date THEN true
                ELSE false
            END,
            NOW(), NOW()
        )
        RETURNING id INTO v_submission_id;
    END IF;
    
    SELECT to_jsonb(s.*) INTO v_result FROM assignment_submissions s WHERE s.id = v_submission_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'submission', v_result
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_assignment TO authenticated;

-- 4. Verificar columnas
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'assignment_submissions'
ORDER BY ordinal_position;
