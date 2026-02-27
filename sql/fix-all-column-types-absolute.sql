-- ============================================================
-- FIX FINAL ABSOLUTO: Forzar TODOS los tipos correctos
-- para que coincidan con lo que el frontend envía.
-- Ejecutar COMPLETO en Supabase SQL Editor.
-- ============================================================

-- ========== PASO 1: Forzar tipos de columna ==========

-- assignment_type → TEXT (frontend envía: "file_upload", "video_analysis", etc.)
DO $$ BEGIN
  ALTER TABLE public.assignments ALTER COLUMN assignment_type DROP DEFAULT;
  ALTER TABLE public.assignments ALTER COLUMN assignment_type TYPE TEXT USING assignment_type::TEXT;
  ALTER TABLE public.assignments ALTER COLUMN assignment_type SET DEFAULT 'file_upload';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'assignment_type ya es TEXT';
END $$;

-- allowed_file_types → JSONB (frontend envía: ["pdf","doc"])
DO $$ BEGIN
  ALTER TABLE public.assignments ALTER COLUMN allowed_file_types DROP DEFAULT;
  ALTER TABLE public.assignments ALTER COLUMN allowed_file_types TYPE JSONB USING to_jsonb(allowed_file_types);
  ALTER TABLE public.assignments ALTER COLUMN allowed_file_types SET DEFAULT '["pdf","doc"]'::jsonb;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'allowed_file_types ya es JSONB';
END $$;

-- rubric → TEXT (frontend envía texto plano como "PRUEBA DE LA PRUEBA")
DO $$ BEGIN
  ALTER TABLE public.assignments ALTER COLUMN rubric DROP DEFAULT;
  ALTER TABLE public.assignments ALTER COLUMN rubric TYPE TEXT USING rubric::TEXT;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'rubric ya es TEXT';
END $$;

-- attached_files → JSONB (frontend envía: [{type:"link",url:"..."}])
DO $$ BEGIN
  ALTER TABLE public.assignments ALTER COLUMN attached_files DROP DEFAULT;
  ALTER TABLE public.assignments ALTER COLUMN attached_files TYPE JSONB USING attached_files::JSONB;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'attached_files ya es JSONB';
END $$;

-- target_type → TEXT (frontend envía: "all_students" / "specific_students")
DO $$ BEGIN
  ALTER TABLE public.assignments ALTER COLUMN target_type DROP DEFAULT;
  ALTER TABLE public.assignments ALTER COLUMN target_type TYPE TEXT USING target_type::TEXT;
  ALTER TABLE public.assignments ALTER COLUMN target_type SET DEFAULT 'all_students';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'target_type ya es TEXT';
END $$;

-- description → TEXT
DO $$ BEGIN
  ALTER TABLE public.assignments ALTER COLUMN description TYPE TEXT USING description::TEXT;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'description ya es TEXT';
END $$;

-- instructions → TEXT
DO $$ BEGIN
  ALTER TABLE public.assignments ALTER COLUMN instructions TYPE TEXT USING instructions::TEXT;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'instructions ya es TEXT';
END $$;

-- Eliminar tipo ENUM si quedó
DO $$ BEGIN
  DROP TYPE IF EXISTS public.assignment_type CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ========== PASO 2: Verificar tipos finales ==========
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'assignments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========== PASO 3: Recrear función RPC ==========
-- Primero eliminar TODAS las versiones posibles
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.create_assignment(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT, INTEGER, INTEGER, JSONB, TEXT, JSONB, TEXT, UUID[], BOOLEAN);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.create_assignment;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

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

    -- Verificar instructor
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

    -- Insertar tarea
    INSERT INTO assignments (
        course_id, title, description, due_date, 
        assignment_type, max_points, max_file_size_mb,
        allowed_file_types, rubric, attached_files,
        target_type, target_student_ids,
        is_published, created_by, created_at, updated_at
    ) VALUES (
        p_course_id, p_title, p_description, p_due_date,
        p_assignment_type, p_max_points, p_max_file_size_mb,
        p_allowed_file_types, p_rubric, p_attached_files,
        p_target_type, p_target_student_ids,
        p_is_published, v_user_id, NOW(), NOW()
    )
    RETURNING id INTO v_assignment_id;

    -- Notificaciones
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
                    'info',
                    '/dashboard/student/tasks',
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

-- ========== PASO 4: Test rápido (debe retornar los tipos correctos) ==========
-- Espera ver:
--   assignment_type  → text
--   allowed_file_types → jsonb  
--   rubric → text
--   attached_files → jsonb
--   target_type → text
SELECT column_name, udt_name
FROM information_schema.columns 
WHERE table_name = 'assignments' 
  AND column_name IN ('assignment_type','allowed_file_types','rubric','attached_files','target_type')
ORDER BY column_name;
