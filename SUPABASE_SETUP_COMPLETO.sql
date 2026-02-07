-- ============================================================================
-- PUNTA CANA ACADEMY - SCRIPT SQL COMPLETO PARA SUPABASE
-- ============================================================================
-- Ejecutar este archivo COMPLETO en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query > Pegar todo este contenido > Run
-- ============================================================================

-- ============================================================================
-- PARTE 1: EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PARTE 2: TABLAS PRINCIPALES (CORE)
-- ============================================================================

-- 2.1 Tabla de PERFILES de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    date_of_birth DATE,
    country TEXT,
    timezone TEXT,
    language TEXT DEFAULT 'es',
    user_type TEXT DEFAULT 'student' CHECK (user_type IN ('student', 'teacher', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Tabla de CURSOS
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES auth.users(id),
    price DECIMAL(10,2) DEFAULT 0,
    duration_hours INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Principiante',
    modality TEXT DEFAULT 'Online',
    schedule TEXT,
    category TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT true,
    max_students INTEGER,
    start_date DATE,
    end_date DATE,
    requirements TEXT[],
    what_you_learn TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Tabla de INSCRIPCIONES (enrollments)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'dropped', 'suspended')),
    grade DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- 2.4 Tabla de LECCIONES del curso
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    video_url TEXT,
    duration_minutes INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Tabla de PROGRESO de lecciones
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completion_date TIMESTAMPTZ,
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- 2.6 Tabla de TAREAS (assignments)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    assignment_type TEXT DEFAULT 'task' CHECK (assignment_type IN ('task', 'exam', 'quiz')),
    due_date TIMESTAMPTZ,
    max_points INTEGER DEFAULT 100,
    max_score INTEGER DEFAULT 100,
    file_upload_allowed BOOLEAN DEFAULT true,
    quiz_data JSONB,
    file_requirements JSONB,
    is_published BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Tabla de ENTREGAS de tareas
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    file_name TEXT,
    answers JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    score DECIMAL(5,2),
    grade DECIMAL(5,2),
    feedback TEXT,
    graded_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'draft', 'submitted', 'graded', 'late')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- 2.8 Tabla de EXÁMENES
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    time_limit_minutes INTEGER DEFAULT 60,
    max_attempts INTEGER DEFAULT 1,
    passing_score DECIMAL(5,2) DEFAULT 70,
    is_published BOOLEAN DEFAULT true,
    available_from TIMESTAMPTZ DEFAULT NOW(),
    available_until TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Tabla de PREGUNTAS de examen
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
    options JSONB,
    correct_answer TEXT,
    points INTEGER DEFAULT 1,
    order_in_exam INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 Tabla de ENVÍOS de exámenes
CREATE TABLE IF NOT EXISTS public.exam_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}',
    score DECIMAL(5,2),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_spent_minutes INTEGER,
    attempt_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'abandoned', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 Tabla de CONFIGURACIÓN de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_assignments BOOLEAN DEFAULT true,
    email_grades BOOLEAN DEFAULT true,
    email_announcements BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- PARTE 3: TRIGGER PARA CREAR PERFIL AUTOMÁTICO (MUY IMPORTANTE)
-- ============================================================================

-- Esta función crea automáticamente un perfil cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar y recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PARTE 4: FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_lessons_updated_at ON public.course_lessons;
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON public.assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exams_updated_at ON public.exams;
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_submissions_updated_at ON public.exam_submissions;
CREATE TRIGGER update_exam_submissions_updated_at BEFORE UPDATE ON public.exam_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTE 5: HABILITAR RLS (Row Level Security)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 6: POLÍTICAS RLS
-- ============================================================================

-- PROFILES
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- COURSES
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (is_published = true OR auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Instructors can manage own courses" ON public.courses;
CREATE POLICY "Instructors can manage own courses" ON public.courses FOR ALL USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;
CREATE POLICY "Authenticated users can create courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = instructor_id);

-- ENROLLMENTS
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view course enrollments" ON public.enrollments;
CREATE POLICY "Instructors can view course enrollments" ON public.enrollments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = enrollments.course_id AND instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Students can create enrollments" ON public.enrollments;
CREATE POLICY "Students can create enrollments" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own enrollments" ON public.enrollments;
CREATE POLICY "Students can update own enrollments" ON public.enrollments FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can delete own enrollments" ON public.enrollments;
CREATE POLICY "Students can delete own enrollments" ON public.enrollments FOR DELETE USING (auth.uid() = student_id);

-- COURSE_LESSONS
DROP POLICY IF EXISTS "Anyone can view lessons of enrolled courses" ON public.course_lessons;
CREATE POLICY "Anyone can view lessons of enrolled courses" ON public.course_lessons FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.enrollments WHERE student_id = auth.uid() AND course_id = course_lessons.course_id) OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_lessons.course_id AND instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Instructors can manage lessons" ON public.course_lessons;
CREATE POLICY "Instructors can manage lessons" ON public.course_lessons FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_lessons.course_id AND instructor_id = auth.uid())
);

-- LESSON_PROGRESS
DROP POLICY IF EXISTS "Students can manage own progress" ON public.lesson_progress;
CREATE POLICY "Students can manage own progress" ON public.lesson_progress FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view progress" ON public.lesson_progress;
CREATE POLICY "Instructors can view progress" ON public.lesson_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = lesson_progress.course_id AND instructor_id = auth.uid())
);

-- ASSIGNMENTS
DROP POLICY IF EXISTS "View assignments" ON public.assignments;
CREATE POLICY "View assignments" ON public.assignments FOR SELECT USING (
    is_published = true AND EXISTS (SELECT 1 FROM public.enrollments WHERE student_id = auth.uid() AND course_id = assignments.course_id) OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Instructors manage assignments" ON public.assignments;
CREATE POLICY "Instructors manage assignments" ON public.assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND instructor_id = auth.uid())
);

-- ASSIGNMENT_SUBMISSIONS
DROP POLICY IF EXISTS "Students manage own submissions" ON public.assignment_submissions;
CREATE POLICY "Students manage own submissions" ON public.assignment_submissions FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors view submissions" ON public.assignment_submissions;
CREATE POLICY "Instructors view submissions" ON public.assignment_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Instructors grade submissions" ON public.assignment_submissions;
CREATE POLICY "Instructors grade submissions" ON public.assignment_submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid())
);

-- EXAMS
DROP POLICY IF EXISTS "View exams" ON public.exams;
CREATE POLICY "View exams" ON public.exams FOR SELECT USING (
    is_published = true AND EXISTS (SELECT 1 FROM public.enrollments WHERE student_id = auth.uid() AND course_id = exams.course_id) OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = exams.course_id AND instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Instructors manage exams" ON public.exams;
CREATE POLICY "Instructors manage exams" ON public.exams FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = exams.course_id AND instructor_id = auth.uid())
);

-- EXAM_QUESTIONS
DROP POLICY IF EXISTS "View exam questions" ON public.exam_questions;
CREATE POLICY "View exam questions" ON public.exam_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exams e JOIN public.enrollments en ON en.course_id = e.course_id WHERE e.id = exam_questions.exam_id AND e.is_published = true AND en.student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.exams e JOIN public.courses c ON c.id = e.course_id WHERE e.id = exam_questions.exam_id AND c.instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Instructors manage questions" ON public.exam_questions;
CREATE POLICY "Instructors manage questions" ON public.exam_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exams e JOIN public.courses c ON c.id = e.course_id WHERE e.id = exam_questions.exam_id AND c.instructor_id = auth.uid())
);

-- EXAM_SUBMISSIONS
DROP POLICY IF EXISTS "Students manage exam submissions" ON public.exam_submissions;
CREATE POLICY "Students manage exam submissions" ON public.exam_submissions FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors view exam submissions" ON public.exam_submissions;
CREATE POLICY "Instructors view exam submissions" ON public.exam_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exams e JOIN public.courses c ON c.id = e.course_id WHERE e.id = exam_submissions.exam_id AND c.instructor_id = auth.uid())
);

-- NOTIFICATION_SETTINGS
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notification_settings;
CREATE POLICY "Users manage own notifications" ON public.notification_settings FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PARTE 7: ÍNDICES PARA RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON public.enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON public.course_lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_course ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam ON public.exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student ON public.exam_submissions(student_id);

-- ============================================================================
-- PARTE 8: HABILITAR REALTIME (Opcional pero recomendado)
-- ============================================================================

-- Para habilitar Realtime, ve a: Database > Replication en el dashboard de Supabase
-- Y activa las tablas que quieras en tiempo real (enrollments, assignments, etc.)

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLAS CREADAS:';
    RAISE NOTICE '   - profiles (perfiles de usuario)';
    RAISE NOTICE '   - courses (cursos)';
    RAISE NOTICE '   - enrollments (inscripciones)';
    RAISE NOTICE '   - course_lessons (lecciones)';
    RAISE NOTICE '   - lesson_progress (progreso de lecciones)';
    RAISE NOTICE '   - assignments (tareas)';
    RAISE NOTICE '   - assignment_submissions (entregas)';
    RAISE NOTICE '   - exams (exámenes)';
    RAISE NOTICE '   - exam_questions (preguntas)';
    RAISE NOTICE '   - exam_submissions (envíos de exámenes)';
    RAISE NOTICE '   - notification_settings (notificaciones)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FUNCIONES CREADAS:';
    RAISE NOTICE '   - handle_new_user (crear perfil automático)';
    RAISE NOTICE '   - update_updated_at_column (actualizar timestamps)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SEGURIDAD:';
    RAISE NOTICE '   - RLS habilitado en todas las tablas';
    RAISE NOTICE '   - Políticas RLS configuradas';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ RENDIMIENTO:';
    RAISE NOTICE '   - Índices creados para consultas rápidas';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ¡La plataforma está lista para usar!';
    RAISE NOTICE '';
END $$;
