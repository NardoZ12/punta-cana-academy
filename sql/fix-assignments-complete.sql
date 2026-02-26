-- ============================================================
-- FIX COMPLETO: TAREAS, SUBMISSIONS Y NOTIFICACIONES
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PASO 1: Asegurar que la tabla assignments existe con TODAS las columnas
-- ============================================================

-- Crear tabla si no existe (esquema base)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    max_points INTEGER DEFAULT 100,
    is_published BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas faltantes una por una
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'file_upload';
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS allowed_file_types JSONB DEFAULT '["pdf","doc"]'::jsonb;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS rubric TEXT;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS attached_files JSONB;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'all_students';
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS target_student_ids UUID[];
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS file_upload_allowed BOOLEAN DEFAULT true;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS submission_format TEXT;

-- ============================================================
-- PASO 2: Asegurar que la tabla assignment_submissions existe
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    submission_text TEXT,
    content TEXT,
    file_url TEXT,
    attachment_url TEXT,
    file_name TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    grade DECIMAL(5,2),
    feedback TEXT,
    graded_by UUID,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'late')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas que podrían faltar
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- UNIQUE constraint (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assignment_submissions_unique_student'
  ) THEN
    ALTER TABLE public.assignment_submissions 
      ADD CONSTRAINT assignment_submissions_unique_student UNIQUE (assignment_id, student_id);
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON public.assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON public.assignment_submissions(student_id);

-- ============================================================
-- PASO 3: Tabla de notificaciones
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    link TEXT,
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas que podrían faltar
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_type TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================
-- PASO 4: RLS para assignments
-- ============================================================

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Los profesores pueden ver tareas de sus cursos
DROP POLICY IF EXISTS "Teachers view own assignments" ON public.assignments;
CREATE POLICY "Teachers view own assignments" ON public.assignments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND instructor_id = auth.uid())
);

-- Los estudiantes pueden ver tareas publicadas de cursos donde están inscritos
DROP POLICY IF EXISTS "Students view published assignments" ON public.assignments;
CREATE POLICY "Students view published assignments" ON public.assignments FOR SELECT USING (
    is_published = true AND EXISTS (
        SELECT 1 FROM public.enrollments 
        WHERE course_id = assignments.course_id AND student_id = auth.uid()
    )
);

-- Los profesores pueden crear tareas en sus cursos
DROP POLICY IF EXISTS "Teachers create assignments" ON public.assignments;
CREATE POLICY "Teachers create assignments" ON public.assignments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- Los profesores pueden actualizar tareas de sus cursos
DROP POLICY IF EXISTS "Teachers update assignments" ON public.assignments;
CREATE POLICY "Teachers update assignments" ON public.assignments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND instructor_id = auth.uid())
);

-- Los profesores pueden eliminar tareas de sus cursos
DROP POLICY IF EXISTS "Teachers delete assignments" ON public.assignments;
CREATE POLICY "Teachers delete assignments" ON public.assignments FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND instructor_id = auth.uid())
);

-- ============================================================
-- PASO 5: RLS para assignment_submissions
-- ============================================================

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Estudiantes ven solo sus propias entregas
DROP POLICY IF EXISTS "Students view own submissions" ON public.assignment_submissions;
CREATE POLICY "Students view own submissions" ON public.assignment_submissions FOR SELECT USING (
    student_id = auth.uid()
);

-- Profesores ven todas las entregas de tareas de sus cursos
DROP POLICY IF EXISTS "Teachers view course submissions" ON public.assignment_submissions;
CREATE POLICY "Teachers view course submissions" ON public.assignment_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.courses c ON c.id = a.course_id
        WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid()
    )
);

-- Estudiantes pueden crear entregas
DROP POLICY IF EXISTS "Students create submissions" ON public.assignment_submissions;
CREATE POLICY "Students create submissions" ON public.assignment_submissions FOR INSERT WITH CHECK (
    student_id = auth.uid()
);

-- Estudiantes pueden actualizar entregas no calificadas
DROP POLICY IF EXISTS "Students update own submissions" ON public.assignment_submissions;
CREATE POLICY "Students update own submissions" ON public.assignment_submissions FOR UPDATE USING (
    student_id = auth.uid() AND status != 'graded'
);

-- Profesores pueden calificar entregas
DROP POLICY IF EXISTS "Teachers grade submissions" ON public.assignment_submissions;
CREATE POLICY "Teachers grade submissions" ON public.assignment_submissions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.courses c ON c.id = a.course_id
        WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid()
    )
);

-- ============================================================
-- PASO 6: RLS para notifications
-- ============================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (
    user_id = auth.uid()
);

-- Permitir INSERT para las funciones SECURITY DEFINER y para authenticated users
DROP POLICY IF EXISTS "Insert notifications" ON public.notifications;
CREATE POLICY "Insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- ============================================================
-- PASO 7: Función RPC create_assignment (SECURITY DEFINER)
-- Crea la tarea + notificaciones para los estudiantes
-- ============================================================

DROP FUNCTION IF EXISTS public.create_assignment(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT, INTEGER, INTEGER, JSONB, TEXT, JSONB, TEXT, UUID[], BOOLEAN);

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

    -- Verificar que el usuario es instructor del curso
    IF NOT EXISTS (
        SELECT 1 FROM courses WHERE id = p_course_id AND instructor_id = v_user_id
    ) THEN
        -- Auto-asignar si instructor_id es NULL
        UPDATE courses SET instructor_id = v_user_id 
        WHERE id = p_course_id AND instructor_id IS NULL;
        
        IF NOT EXISTS (
            SELECT 1 FROM courses WHERE id = p_course_id AND instructor_id = v_user_id
        ) THEN
            RAISE EXCEPTION 'No autorizado: no eres el instructor de este curso';
        END IF;
    END IF;

    -- Obtener nombre del curso para las notificaciones
    SELECT title INTO v_course_title FROM courses WHERE id = p_course_id;

    -- Insertar la tarea
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

    -- Si está publicada, crear notificaciones
    IF p_is_published THEN
        -- Determinar qué estudiantes notificar
        IF p_target_type = 'all_students' THEN
            SELECT array_agg(student_id) INTO v_student_ids
            FROM enrollments
            WHERE course_id = p_course_id;
        ELSE
            v_student_ids := p_target_student_ids;
        END IF;

        -- Crear notificación para cada estudiante
        IF v_student_ids IS NOT NULL THEN
            FOREACH v_student_id IN ARRAY v_student_ids
            LOOP
                INSERT INTO notifications (
                    user_id, title, message, type, link, 
                    reference_id, reference_type, is_read, created_at
                ) VALUES (
                    v_student_id,
                    'Nueva tarea: ' || p_title,
                    'Se ha asignado una nueva tarea en ' || COALESCE(v_course_title, 'tu curso') || 
                    CASE WHEN p_due_date IS NOT NULL 
                        THEN '. Fecha límite: ' || to_char(p_due_date, 'DD/MM/YYYY HH24:MI')
                        ELSE ''
                    END,
                    'info',
                    '/dashboard/student/tasks',
                    v_assignment_id,
                    'assignment',
                    false,
                    NOW()
                );
            END LOOP;
        END IF;
    END IF;

    -- Retornar resultado
    SELECT to_jsonb(a.*) INTO v_result
    FROM assignments a WHERE a.id = v_assignment_id;

    RETURN jsonb_build_object(
        'success', true,
        'assignment', v_result,
        'notifications_sent', COALESCE(array_length(v_student_ids, 1), 0)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_assignment TO authenticated;

-- ============================================================
-- PASO 8: Habilitar Realtime para notifications
-- ============================================================

-- Habilitar realtime para la tabla notifications (para que el hook useNotifications funcione)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ============================================================
-- PASO 9: Trigger para updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON public.assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at
    BEFORE UPDATE ON public.assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Columnas de assignments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assignments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Columnas de assignment_submissions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assignment_submissions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Columnas de notifications
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar función RPC
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'create_assignment';
