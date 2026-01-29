-- =====================================================
-- PUNTA CANA ACADEMY - LMS SUPABASE SETUP
-- Script unificado para configurar la base de datos
-- Ejecutar en Supabase SQL Editor en orden
-- =====================================================

-- =====================================================
-- PASO 1: EXTENSIONES NECESARIAS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PASO 2: TABLAS PRINCIPALES
-- =====================================================

-- 2.1 Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    date_of_birth DATE,
    country TEXT DEFAULT 'Dominican Republic',
    timezone TEXT DEFAULT 'America/Santo_Domingo',
    language TEXT DEFAULT 'es',
    user_type TEXT DEFAULT 'student' CHECK (user_type IN ('student', 'teacher', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Tabla de cursos
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    thumbnail_url TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    duration_hours INTEGER DEFAULT 0,
    estimated_hours INTEGER,
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT,
    requirements TEXT,
    what_you_learn TEXT[],
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    max_students INTEGER,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Tabla de modulos de curso
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Tabla de lecciones
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    video_url TEXT,
    video_duration INTEGER, -- en segundos
    pdf_url TEXT,
    slides_url TEXT,
    duration_minutes INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Tabla de recursos de leccion
CREATE TABLE IF NOT EXISTS public.lesson_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT CHECK (resource_type IN ('pdf', 'video', 'link', 'file', 'image')),
    resource_url TEXT NOT NULL,
    file_size INTEGER, -- en bytes
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Tabla de inscripciones
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'suspended')),
    grade DECIMAL(5,2),
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- 2.7 Tabla de progreso de lecciones
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completion_date TIMESTAMPTZ,
    watch_time INTEGER DEFAULT 0, -- segundos vistos
    last_position INTEGER DEFAULT 0, -- posicion del video en segundos
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- 2.8 Tabla de tareas/assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMPTZ,
    max_points INTEGER DEFAULT 100,
    file_upload_allowed BOOLEAN DEFAULT true,
    submission_format TEXT DEFAULT 'both' CHECK (submission_format IN ('file', 'text', 'both')),
    created_by UUID REFERENCES public.profiles(id),
    is_published BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Tabla de envios de tareas
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    file_name TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    grade DECIMAL(5,2),
    feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'late', 'resubmitted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- 2.10 Tabla de examenes
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    time_limit_minutes INTEGER DEFAULT 60,
    max_attempts INTEGER DEFAULT 1,
    passing_score INTEGER DEFAULT 70,
    shuffle_questions BOOLEAN DEFAULT false,
    shuffle_options BOOLEAN DEFAULT false,
    show_correct_answers BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 Tabla de preguntas de examen
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank')),
    options JSONB, -- [{text: "Opcion A", is_correct: false}, ...]
    correct_answer TEXT, -- Para short_answer/fill_blank
    explanation TEXT, -- Explicacion de la respuesta correcta
    points INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 Tabla de envios/intentos de examenes
CREATE TABLE IF NOT EXISTS public.exam_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    answers JSONB NOT NULL, -- [{question_id: "...", answer: "..."}]
    score DECIMAL(5,2),
    total_points INTEGER,
    earned_points INTEGER,
    passed BOOLEAN,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_spent_seconds INTEGER,
    attempt_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'abandoned', 'timed_out')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.13 Tabla de anuncios de curso
CREATE TABLE IF NOT EXISTS public.course_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.14 Tabla de discusiones/foro
CREATE TABLE IF NOT EXISTS public.course_discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.course_discussions(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.15 Tabla de resenas/calificaciones de cursos
CREATE TABLE IF NOT EXISTS public.course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

-- 2.16 Tabla de configuracion de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_assignments BOOLEAN DEFAULT true,
    email_grades BOOLEAN DEFAULT true,
    email_announcements BOOLEAN DEFAULT true,
    email_discussions BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2.17 Tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error', 'assignment', 'grade', 'announcement', 'discussion')),
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.18 Tabla de certificados
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL,
    certificate_url TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PASO 3: INDICES PARA RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);

CREATE INDEX IF NOT EXISTS idx_modules_course ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.course_modules(course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON public.course_lessons(course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON public.lesson_progress(course_id);

CREATE INDEX IF NOT EXISTS idx_assignments_course ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due ON public.assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.assignment_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_exams_course ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_published ON public.exams(is_published);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON public.exam_questions(exam_id, order_index);

CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam ON public.exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student ON public.exam_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_discussions_course ON public.course_discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_lesson ON public.course_discussions(lesson_id);

CREATE INDEX IF NOT EXISTS idx_reviews_course ON public.course_reviews(course_id);

-- =====================================================
-- PASO 4: FUNCIONES Y TRIGGERS
-- =====================================================

-- 4.1 Funcion para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'updated_at'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
            CREATE TRIGGER update_%I_updated_at 
                BEFORE UPDATE ON public.%I 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- 4.3 Funcion para crear perfil automaticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, user_type)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.4 Trigger para crear perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.5 Funcion para actualizar progreso del curso
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    new_progress INTEGER;
    v_course_id UUID;
BEGIN
    -- Obtener course_id de la leccion
    SELECT course_id INTO v_course_id 
    FROM public.course_lessons 
    WHERE id = NEW.lesson_id;
    
    -- Contar total de lecciones del curso
    SELECT COUNT(*) INTO total_lessons 
    FROM public.course_lessons 
    WHERE course_id = v_course_id;
    
    -- Contar lecciones completadas
    SELECT COUNT(*) INTO completed_lessons 
    FROM public.lesson_progress lp
    JOIN public.course_lessons cl ON cl.id = lp.lesson_id
    WHERE lp.student_id = NEW.student_id 
    AND cl.course_id = v_course_id
    AND lp.completed = true;
    
    -- Calcular progreso
    IF total_lessons > 0 THEN
        new_progress := (completed_lessons * 100) / total_lessons;
    ELSE
        new_progress := 0;
    END IF;
    
    -- Actualizar enrollment
    UPDATE public.enrollments 
    SET 
        progress = new_progress,
        status = CASE WHEN new_progress >= 100 THEN 'completed' ELSE status END,
        completion_date = CASE WHEN new_progress >= 100 THEN NOW() ELSE completion_date END
    WHERE student_id = NEW.student_id 
    AND course_id = v_course_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.6 Trigger para actualizar progreso
DROP TRIGGER IF EXISTS on_lesson_progress_change ON public.lesson_progress;
CREATE TRIGGER on_lesson_progress_change
    AFTER INSERT OR UPDATE ON public.lesson_progress
    FOR EACH ROW 
    WHEN (NEW.completed = true)
    EXECUTE FUNCTION update_enrollment_progress();

-- 4.7 Funcion para calificar examen automaticamente
CREATE OR REPLACE FUNCTION grade_exam_submission()
RETURNS TRIGGER AS $$
DECLARE
    question RECORD;
    student_answer TEXT;
    total_points INTEGER := 0;
    earned_points INTEGER := 0;
    passing INTEGER;
BEGIN
    -- Solo procesar si el examen fue enviado
    IF NEW.status != 'submitted' THEN
        RETURN NEW;
    END IF;
    
    -- Obtener passing score
    SELECT passing_score INTO passing FROM public.exams WHERE id = NEW.exam_id;
    
    -- Iterar sobre las preguntas
    FOR question IN 
        SELECT * FROM public.exam_questions WHERE exam_id = NEW.exam_id
    LOOP
        total_points := total_points + question.points;
        
        -- Obtener respuesta del estudiante
        SELECT value->>'answer' INTO student_answer
        FROM jsonb_array_elements(NEW.answers) 
        WHERE value->>'question_id' = question.id::text;
        
        -- Verificar respuesta para multiple_choice y true_false
        IF question.question_type IN ('multiple_choice', 'true_false') THEN
            IF student_answer = question.correct_answer THEN
                earned_points := earned_points + question.points;
            END IF;
        END IF;
    END LOOP;
    
    -- Calcular score
    NEW.total_points := total_points;
    NEW.earned_points := earned_points;
    IF total_points > 0 THEN
        NEW.score := (earned_points::DECIMAL / total_points) * 100;
    ELSE
        NEW.score := 0;
    END IF;
    NEW.passed := NEW.score >= passing;
    NEW.status := 'graded';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.8 Trigger para calificar examen
DROP TRIGGER IF EXISTS on_exam_submitted ON public.exam_submissions;
CREATE TRIGGER on_exam_submitted
    BEFORE UPDATE ON public.exam_submissions
    FOR EACH ROW 
    WHEN (OLD.status = 'in_progress' AND NEW.status = 'submitted')
    EXECUTE FUNCTION grade_exam_submission();

-- =====================================================
-- PASO 5: HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 6: POLITICAS RLS
-- =====================================================

-- 6.1 PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- 6.2 COURSES
DROP POLICY IF EXISTS "courses_select_published" ON public.courses;
CREATE POLICY "courses_select_published" ON public.courses
    FOR SELECT TO authenticated
    USING (
        is_published = true 
        OR instructor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.enrollments 
            WHERE enrollments.course_id = courses.id 
            AND enrollments.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "courses_insert_teacher" ON public.courses;
CREATE POLICY "courses_insert_teacher" ON public.courses
    FOR INSERT TO authenticated
    WITH CHECK (
        instructor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('teacher', 'admin')
        )
    );

DROP POLICY IF EXISTS "courses_update_own" ON public.courses;
CREATE POLICY "courses_update_own" ON public.courses
    FOR UPDATE TO authenticated
    USING (instructor_id = auth.uid());

DROP POLICY IF EXISTS "courses_delete_own" ON public.courses;
CREATE POLICY "courses_delete_own" ON public.courses
    FOR DELETE TO authenticated
    USING (instructor_id = auth.uid());

-- 6.3 COURSE_MODULES
DROP POLICY IF EXISTS "modules_select" ON public.course_modules;
CREATE POLICY "modules_select" ON public.course_modules
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_modules.course_id 
            AND (c.instructor_id = auth.uid() OR c.is_published = true)
        )
        OR EXISTS (
            SELECT 1 FROM public.enrollments e 
            WHERE e.course_id = course_modules.course_id 
            AND e.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "modules_manage_teacher" ON public.course_modules;
CREATE POLICY "modules_manage_teacher" ON public.course_modules
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_modules.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- 6.4 COURSE_LESSONS
DROP POLICY IF EXISTS "lessons_select" ON public.course_lessons;
CREATE POLICY "lessons_select" ON public.course_lessons
    FOR SELECT TO authenticated
    USING (
        is_preview = true
        OR EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_lessons.course_id 
            AND c.instructor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.enrollments e 
            WHERE e.course_id = course_lessons.course_id 
            AND e.student_id = auth.uid()
            AND e.status = 'active'
        )
    );

DROP POLICY IF EXISTS "lessons_manage_teacher" ON public.course_lessons;
CREATE POLICY "lessons_manage_teacher" ON public.course_lessons
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_lessons.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- 6.5 LESSON_RESOURCES
DROP POLICY IF EXISTS "resources_select" ON public.lesson_resources;
CREATE POLICY "resources_select" ON public.lesson_resources
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_lessons cl
            JOIN public.courses c ON c.id = cl.course_id
            WHERE cl.id = lesson_resources.lesson_id
            AND (
                c.instructor_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.enrollments e 
                    WHERE e.course_id = c.id 
                    AND e.student_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "resources_manage_teacher" ON public.lesson_resources;
CREATE POLICY "resources_manage_teacher" ON public.lesson_resources
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_lessons cl
            JOIN public.courses c ON c.id = cl.course_id
            WHERE cl.id = lesson_resources.lesson_id
            AND c.instructor_id = auth.uid()
        )
    );

-- 6.6 ENROLLMENTS
DROP POLICY IF EXISTS "enrollments_select_student" ON public.enrollments;
CREATE POLICY "enrollments_select_student" ON public.enrollments
    FOR SELECT TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "enrollments_select_teacher" ON public.enrollments;
CREATE POLICY "enrollments_select_teacher" ON public.enrollments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = enrollments.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "enrollments_insert_student" ON public.enrollments;
CREATE POLICY "enrollments_insert_student" ON public.enrollments
    FOR INSERT TO authenticated
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "enrollments_update_student" ON public.enrollments;
CREATE POLICY "enrollments_update_student" ON public.enrollments
    FOR UPDATE TO authenticated
    USING (student_id = auth.uid());

-- 6.7 LESSON_PROGRESS
DROP POLICY IF EXISTS "progress_manage_student" ON public.lesson_progress;
CREATE POLICY "progress_manage_student" ON public.lesson_progress
    FOR ALL TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "progress_select_teacher" ON public.lesson_progress;
CREATE POLICY "progress_select_teacher" ON public.lesson_progress
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_lessons cl
            JOIN public.courses c ON c.id = cl.course_id
            WHERE cl.id = lesson_progress.lesson_id
            AND c.instructor_id = auth.uid()
        )
    );

-- 6.8 ASSIGNMENTS
DROP POLICY IF EXISTS "assignments_select_student" ON public.assignments;
CREATE POLICY "assignments_select_student" ON public.assignments
    FOR SELECT TO authenticated
    USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM public.enrollments 
            WHERE enrollments.course_id = assignments.course_id
            AND enrollments.student_id = auth.uid()
            AND enrollments.status = 'active'
        )
    );

DROP POLICY IF EXISTS "assignments_manage_teacher" ON public.assignments;
CREATE POLICY "assignments_manage_teacher" ON public.assignments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = assignments.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- 6.9 ASSIGNMENT_SUBMISSIONS
DROP POLICY IF EXISTS "submissions_manage_student" ON public.assignment_submissions;
CREATE POLICY "submissions_manage_student" ON public.assignment_submissions
    FOR ALL TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "submissions_select_teacher" ON public.assignment_submissions;
CREATE POLICY "submissions_select_teacher" ON public.assignment_submissions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.courses c ON c.id = a.course_id
            WHERE a.id = assignment_submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "submissions_update_teacher" ON public.assignment_submissions;
CREATE POLICY "submissions_update_teacher" ON public.assignment_submissions
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.courses c ON c.id = a.course_id
            WHERE a.id = assignment_submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );

-- 6.10 EXAMS
DROP POLICY IF EXISTS "exams_select_student" ON public.exams;
CREATE POLICY "exams_select_student" ON public.exams
    FOR SELECT TO authenticated
    USING (
        is_published = true AND
        (available_from IS NULL OR available_from <= NOW()) AND
        (available_until IS NULL OR available_until >= NOW()) AND
        EXISTS (
            SELECT 1 FROM public.enrollments 
            WHERE enrollments.course_id = exams.course_id
            AND enrollments.student_id = auth.uid()
            AND enrollments.status = 'active'
        )
    );

DROP POLICY IF EXISTS "exams_manage_teacher" ON public.exams;
CREATE POLICY "exams_manage_teacher" ON public.exams
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = exams.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- 6.11 EXAM_QUESTIONS
DROP POLICY IF EXISTS "questions_select_student" ON public.exam_questions;
CREATE POLICY "questions_select_student" ON public.exam_questions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exams e
            JOIN public.enrollments en ON en.course_id = e.course_id
            WHERE e.id = exam_questions.exam_id
            AND e.is_published = true
            AND en.student_id = auth.uid()
            AND en.status = 'active'
        )
    );

DROP POLICY IF EXISTS "questions_manage_teacher" ON public.exam_questions;
CREATE POLICY "questions_manage_teacher" ON public.exam_questions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exams e
            JOIN public.courses c ON c.id = e.course_id
            WHERE e.id = exam_questions.exam_id
            AND c.instructor_id = auth.uid()
        )
    );

-- 6.12 EXAM_SUBMISSIONS
DROP POLICY IF EXISTS "exam_submissions_manage_student" ON public.exam_submissions;
CREATE POLICY "exam_submissions_manage_student" ON public.exam_submissions
    FOR ALL TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "exam_submissions_select_teacher" ON public.exam_submissions;
CREATE POLICY "exam_submissions_select_teacher" ON public.exam_submissions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exams e
            JOIN public.courses c ON c.id = e.course_id
            WHERE e.id = exam_submissions.exam_id
            AND c.instructor_id = auth.uid()
        )
    );

-- 6.13 COURSE_ANNOUNCEMENTS
DROP POLICY IF EXISTS "announcements_select" ON public.course_announcements;
CREATE POLICY "announcements_select" ON public.course_announcements
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_announcements.course_id 
            AND c.instructor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.enrollments e 
            WHERE e.course_id = course_announcements.course_id 
            AND e.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "announcements_manage_teacher" ON public.course_announcements;
CREATE POLICY "announcements_manage_teacher" ON public.course_announcements
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_announcements.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- 6.14 COURSE_DISCUSSIONS
DROP POLICY IF EXISTS "discussions_select" ON public.course_discussions;
CREATE POLICY "discussions_select" ON public.course_discussions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_discussions.course_id 
            AND c.instructor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.enrollments e 
            WHERE e.course_id = course_discussions.course_id 
            AND e.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "discussions_insert" ON public.course_discussions;
CREATE POLICY "discussions_insert" ON public.course_discussions
    FOR INSERT TO authenticated
    WITH CHECK (
        author_id = auth.uid() AND
        (
            EXISTS (
                SELECT 1 FROM public.courses c 
                WHERE c.id = course_discussions.course_id 
                AND c.instructor_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM public.enrollments e 
                WHERE e.course_id = course_discussions.course_id 
                AND e.student_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "discussions_update_own" ON public.course_discussions;
CREATE POLICY "discussions_update_own" ON public.course_discussions
    FOR UPDATE TO authenticated
    USING (author_id = auth.uid());

DROP POLICY IF EXISTS "discussions_delete_own" ON public.course_discussions;
CREATE POLICY "discussions_delete_own" ON public.course_discussions
    FOR DELETE TO authenticated
    USING (author_id = auth.uid());

-- 6.15 COURSE_REVIEWS
DROP POLICY IF EXISTS "reviews_select" ON public.course_reviews;
CREATE POLICY "reviews_select" ON public.course_reviews
    FOR SELECT TO authenticated, anon
    USING (is_approved = true);

DROP POLICY IF EXISTS "reviews_manage_student" ON public.course_reviews;
CREATE POLICY "reviews_manage_student" ON public.course_reviews
    FOR ALL TO authenticated
    USING (student_id = auth.uid());

-- 6.16 NOTIFICATION_SETTINGS
DROP POLICY IF EXISTS "notification_settings_manage" ON public.notification_settings;
CREATE POLICY "notification_settings_manage" ON public.notification_settings
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- 6.17 NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- 6.18 CERTIFICATES
DROP POLICY IF EXISTS "certificates_select_own" ON public.certificates;
CREATE POLICY "certificates_select_own" ON public.certificates
    FOR SELECT TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "certificates_select_verify" ON public.certificates;
CREATE POLICY "certificates_select_verify" ON public.certificates
    FOR SELECT TO authenticated, anon
    USING (true); -- Cualquiera puede verificar un certificado por su numero

-- =====================================================
-- PASO 7: DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Descomentar para insertar datos de ejemplo
/*
-- Crear un curso de ejemplo (requiere un usuario teacher existente)
INSERT INTO public.courses (title, description, instructor_id, level, category, is_published)
SELECT 
    'Introduccion a la Programacion',
    'Aprende los fundamentos de la programacion desde cero',
    id,
    'beginner',
    'Tecnologia',
    true
FROM public.profiles 
WHERE user_type = 'teacher' 
LIMIT 1;

-- Crear modulos de ejemplo
INSERT INTO public.course_modules (course_id, title, description, order_index)
SELECT 
    c.id,
    unnest(ARRAY['Modulo 1: Conceptos Basicos', 'Modulo 2: Variables y Tipos de Datos', 'Modulo 3: Estructuras de Control']),
    unnest(ARRAY['Introduccion a los conceptos fundamentales', 'Aprende sobre variables y tipos de datos', 'Condicionales y bucles']),
    generate_series(1, 3)
FROM public.courses c
WHERE c.title = 'Introduccion a la Programacion';
*/

-- =====================================================
-- VERIFICACION FINAL
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'PUNTA CANA ACADEMY - LMS SETUP COMPLETADO';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Tablas creadas: %', table_count;
    RAISE NOTICE 'Politicas RLS: %', policy_count;
    RAISE NOTICE 'Indices: %', index_count;
    RAISE NOTICE '=====================================================';
END $$;

SELECT 'CONFIGURACION COMPLETADA EXITOSAMENTE' as resultado;
