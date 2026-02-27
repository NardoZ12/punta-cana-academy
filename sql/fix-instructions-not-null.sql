-- ============================================================
-- FIX: instructions NOT NULL + otros NOT NULL constraints
-- ============================================================

-- 1. Quitar NOT NULL de instructions (el frontend usa description)
ALTER TABLE public.assignments ALTER COLUMN instructions DROP NOT NULL;

-- 2. Quitar NOT NULL de assignment_type por si acaso
DO $$ BEGIN
  ALTER TABLE public.assignments ALTER COLUMN assignment_type DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Quitar NOT NULL de max_points por si acaso
DO $$ BEGIN
  ALTER TABLE public.assignments ALTER COLUMN max_points DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Recrear función RPC que también llene instructions
DROP FUNCTION IF EXISTS public.create_assignment;

CREATE OR REPLACE FUNCTION public.create_assignment(
    p_course_id UUID,
    p_title TEXT,
    p_description TEXT DEFAULT '',
    p_due_date TIMESTAMPTZ DEFAULT NULL,
    p_assignment_type TEXT DEFAULT 'file_upload',
    p_max_points INTEGER DEFAULT 100,
    p_max_file_size_mb INTEGER DEFAULT 10,
    p_allowed_file_types JSONB DEFAULT '["pdf","doc"]'::jsonb,
    p_rubric TEXT DEFAULT NULL,
    p_attached_files JSONB DEFAULT NULL,
    p_target_type TEXT DEFAULT 'all_students',
    p_target_student_ids UUID[] DEFAULT NULL,
    p_is_published BOOLEAN DEFAULT true
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_user_id UUID;
    v_assignment_id UUID;
    v_result JSONB;
    v_student_ids UUID[];
    v_student_id UUID;
    v_course_title TEXT;
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
            RAISE EXCEPTION 'No autorizado: no eres el instructor de este curso';
        END IF;
    END IF;

    SELECT title INTO v_course_title FROM courses WHERE id = p_course_id;

    INSERT INTO assignments (
        course_id, title, description, instructions, due_date, 
        assignment_type, max_points, max_file_size_mb,
        allowed_file_types, rubric, attached_files,
        target_type, target_student_ids,
        is_published, created_by, created_at, updated_at
    ) VALUES (
        p_course_id, p_title, p_description, 
        COALESCE(p_description, ''),
        p_due_date,
        p_assignment_type, p_max_points, p_max_file_size_mb,
        p_allowed_file_types, p_rubric, p_attached_files,
        p_target_type, p_target_student_ids,
        p_is_published, v_user_id, NOW(), NOW()
    )
    RETURNING id INTO v_assignment_id;

    IF p_is_published THEN
        IF p_target_type = 'all_students' THEN
            SELECT array_agg(student_id) INTO v_student_ids
            FROM enrollments WHERE course_id = p_course_id;
        ELSE
            v_student_ids := p_target_student_ids;
        END IF;

        IF v_student_ids IS NOT NULL THEN
            FOREACH v_student_id IN ARRAY v_student_ids LOOP
                INSERT INTO notifications (
                    user_id, title, message, type, link, 
                    reference_id, reference_type, is_read, created_at
                ) VALUES (
                    v_student_id,
                    'Nueva tarea: ' || p_title,
                    'Se ha asignado una nueva tarea en ' || COALESCE(v_course_title, 'tu curso') || 
                    CASE WHEN p_due_date IS NOT NULL 
                        THEN '. Fecha límite: ' || to_char(p_due_date, 'DD/MM/YYYY HH24:MI')
                        ELSE '' END,
                    'info', '/dashboard/student/tasks',
                    v_assignment_id, 'assignment', false, NOW()
                );
            END LOOP;
        END IF;
    END IF;

    SELECT to_jsonb(a.*) INTO v_result FROM assignments a WHERE a.id = v_assignment_id;

    RETURN jsonb_build_object(
        'success', true,
        'assignment', v_result,
        'notifications_sent', COALESCE(array_length(v_student_ids, 1), 0)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_assignment TO authenticated;
