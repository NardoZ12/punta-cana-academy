-- =================================================================
-- MIGRACIÓN COMPLETA LMS: ENROLLMENTS, ASSIGNMENTS, SUBMISSIONS, NOTIFICATIONS
-- =================================================================

-- Habilitar extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA ENROLLMENTS (Inscripciones)
-- Vincula alumnos con cursos y guarda su progreso
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    grade NUMERIC(5,2), -- Nota final del curso (opcional)
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id) -- Un estudiante no puede inscribirse dos veces al mismo curso
);

-- 2. TABLA ASSIGNMENTS (Tareas y Exámenes)
-- Creado por el profesor, vinculado al curso
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('task', 'quiz')),
    content JSONB DEFAULT '{}'::jsonb, -- Preguntas del quiz o instrucciones detalladas
    due_date TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT false, -- Para borradores
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA SUBMISSIONS (Entregas)
-- La respuesta del estudiante a una tarea
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'graded')) DEFAULT 'pending',
    file_url TEXT, -- URL del archivo en Storage (para tareas)
    answers JSONB DEFAULT '{}'::jsonb, -- Respuestas estructuradas (para quizzes)
    grade NUMERIC(5,2), -- Nota de la tarea (0-100)
    feedback TEXT, -- Comentario del profesor
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id) -- Solo una entrega por tarea por estudiante
);

-- 4. TABLA NOTIFICATIONS (Campana)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    link TEXT, -- URL a donde redirige al hacer click
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =================================================================

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS ENROLLMENTS
-- Estudiante: Ve solo sus propias inscripciones
CREATE POLICY "Students view own enrollments" ON public.enrollments
    FOR SELECT USING (auth.uid() = student_id);

-- Profesor: Ve inscripciones de cursos que él enseña
CREATE POLICY "Teachers view course enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE id = enrollments.course_id AND instructor_id = auth.uid()
        )
    );

-- POLÍTICAS ASSIGNMENTS
-- Estudiante: Ve tareas publicadas de cursos donde está inscrito y activo
CREATE POLICY "Students view active assignments" ON public.assignments
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM public.enrollments
            WHERE course_id = assignments.course_id 
            AND student_id = auth.uid() 
            AND status = 'active'
        )
    );

-- Profesor: Control total sobre tareas de sus cursos
CREATE POLICY "Teachers manage own assignments" ON public.assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE id = assignments.course_id AND instructor_id = auth.uid()
        )
    );

-- POLÍTICAS SUBMISSIONS (CRÍTICO: Privacidad de datos)
-- Estudiante: Ve y edita SOLO sus propias entregas
CREATE POLICY "Students view own submissions" ON public.submissions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students create own submissions" ON public.submissions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update own submissions" ON public.submissions
    FOR UPDATE USING (auth.uid() = student_id);

-- Profesor: Ve y califica entregas de tareas que pertenecen a sus cursos
CREATE POLICY "Teachers view and grade submissions" ON public.submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.courses c ON a.course_id = c.id
            WHERE a.id = submissions.assignment_id AND c.instructor_id = auth.uid()
        )
    );

-- POLÍTICAS NOTIFICATIONS
CREATE POLICY "Users manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- =================================================================
-- TRIGGERS Y AUTOMATIZACIÓN
-- =================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assignments_modtime BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_modtime BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AUTOMATIZACIÓN: Notificar al estudiante cuando se califica una tarea
CREATE OR REPLACE FUNCTION notify_student_on_grade()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status != 'graded' AND NEW.status = 'graded') THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        SELECT 
            NEW.student_id,
            'Tarea Calificada',
            'Tu entrega ha sido calificada. Haz clic para ver tu nota.',
            'success',
            '/dashboard/student/assignment/' || NEW.assignment_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_submission_graded
    AFTER UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION notify_student_on_grade();