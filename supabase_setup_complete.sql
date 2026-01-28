-- =====================================================
-- SCRIPT COMPLETO PARA SUPABASE
-- Ejecutar este archivo en el SQL Editor de Supabase
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLAS PRINCIPALES
-- =====================================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
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

-- Tabla de configuración de notificaciones
CREATE TABLE IF NOT EXISTS notification_settings (
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

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES auth.users(id),
    price DECIMAL(10,2) DEFAULT 0,
    duration_hours INTEGER DEFAULT 0,
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
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

-- Tabla de lecciones
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    video_url TEXT,
    duration_minutes INTEGER DEFAULT 0,
    order_in_course INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de inscripciones
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'suspended')),
    grade DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Tabla de progreso de lecciones
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completion_date TIMESTAMPTZ,
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMPTZ,
    max_points INTEGER DEFAULT 100,
    file_upload_allowed BOOLEAN DEFAULT true,
    submission_format TEXT DEFAULT 'both',
    created_by UUID REFERENCES auth.users(id),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de envíos de tareas
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    file_name TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    grade DECIMAL(5,2),
    feedback TEXT,
    graded_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'late')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- Tabla de exámenes
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    time_limit_minutes INTEGER DEFAULT 60,
    max_attempts INTEGER DEFAULT 1,
    passing_score DECIMAL(5,2) DEFAULT 70,
    is_published BOOLEAN DEFAULT true,
    available_from TIMESTAMPTZ DEFAULT NOW(),
    available_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de preguntas de examen
CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
    options JSONB,
    correct_answer TEXT,
    points INTEGER DEFAULT 1,
    order_in_exam INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de envíos de exámenes
CREATE TABLE IF NOT EXISTS exam_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}',
    score DECIMAL(5,2),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_spent_minutes INTEGER,
    attempt_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'submitted', 'graded', 'abandoned', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. FUNCIÓN PARA UPDATE AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 3. TRIGGERS PARA UPDATE AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON notification_settings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_course_lessons_updated_at 
    BEFORE UPDATE ON course_lessons 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON enrollments 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_lesson_progress_updated_at 
    BEFORE UPDATE ON lesson_progress 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_assignments_updated_at 
    BEFORE UPDATE ON assignments 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_assignment_submissions_updated_at 
    BEFORE UPDATE ON assignment_submissions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_exams_updated_at 
    BEFORE UPDATE ON exams 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_exam_submissions_updated_at 
    BEFORE UPDATE ON exam_submissions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- 4. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para NOTIFICATION_SETTINGS
DROP POLICY IF EXISTS "Users can manage own notification settings" ON notification_settings;
CREATE POLICY "Users can manage own notification settings" ON notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para COURSES
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (is_published = true OR auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;
CREATE POLICY "Instructors can manage own courses" ON courses
    FOR ALL USING (auth.uid() = instructor_id);

-- Políticas para COURSE_LESSONS
DROP POLICY IF EXISTS "Students can view lessons of enrolled courses" ON course_lessons;
CREATE POLICY "Students can view lessons of enrolled courses" ON course_lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.student_id = auth.uid() 
            AND enrollments.course_id = course_lessons.course_id
            AND enrollments.status = 'active'
        )
        OR 
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_lessons.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Instructors can manage lessons of own courses" ON course_lessons;
CREATE POLICY "Instructors can manage lessons of own courses" ON course_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_lessons.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para ENROLLMENTS
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;
CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create enrollments" ON enrollments;
CREATE POLICY "Students can create enrollments" ON enrollments
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own enrollments" ON enrollments;
CREATE POLICY "Students can update own enrollments" ON enrollments
    FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON enrollments;
CREATE POLICY "Instructors can view enrollments for their courses" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = enrollments.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para LESSON_PROGRESS
DROP POLICY IF EXISTS "Students can manage own lesson progress" ON lesson_progress;
CREATE POLICY "Students can manage own lesson progress" ON lesson_progress
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view lesson progress for their courses" ON lesson_progress;
CREATE POLICY "Instructors can view lesson progress for their courses" ON lesson_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = lesson_progress.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para ASSIGNMENTS
DROP POLICY IF EXISTS "Students can view assignments for enrolled courses" ON assignments;
CREATE POLICY "Students can view assignments for enrolled courses" ON assignments
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.student_id = auth.uid() 
            AND enrollments.course_id = assignments.course_id
            AND enrollments.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Instructors can manage assignments for own courses" ON assignments;
CREATE POLICY "Instructors can manage assignments for own courses" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = assignments.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para ASSIGNMENT_SUBMISSIONS
DROP POLICY IF EXISTS "Students can manage own assignment submissions" ON assignment_submissions;
CREATE POLICY "Students can manage own assignment submissions" ON assignment_submissions
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view submissions for their course assignments" ON assignment_submissions;
CREATE POLICY "Instructors can view submissions for their course assignments" ON assignment_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON c.id = a.course_id
            WHERE a.id = assignment_submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Instructors can update submissions for their course assignments" ON assignment_submissions;
CREATE POLICY "Instructors can update submissions for their course assignments" ON assignment_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON c.id = a.course_id
            WHERE a.id = assignment_submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );

-- Políticas para EXAMS
DROP POLICY IF EXISTS "Students can view published exams for enrolled courses" ON exams;
CREATE POLICY "Students can view published exams for enrolled courses" ON exams
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.student_id = auth.uid() 
            AND enrollments.course_id = exams.course_id
            AND enrollments.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Instructors can manage exams for own courses" ON exams;
CREATE POLICY "Instructors can manage exams for own courses" ON exams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = exams.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para EXAM_QUESTIONS
DROP POLICY IF EXISTS "Students can view questions for accessible exams" ON exam_questions;
CREATE POLICY "Students can view questions for accessible exams" ON exam_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exams e
            JOIN courses c ON c.id = e.course_id
            JOIN enrollments en ON en.course_id = c.id
            WHERE e.id = exam_questions.exam_id
            AND e.is_published = true
            AND en.student_id = auth.uid()
            AND en.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Instructors can manage questions for own exams" ON exam_questions;
CREATE POLICY "Instructors can manage questions for own exams" ON exam_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM exams e
            JOIN courses c ON c.id = e.course_id
            WHERE e.id = exam_questions.exam_id
            AND c.instructor_id = auth.uid()
        )
    );

-- Políticas para EXAM_SUBMISSIONS
DROP POLICY IF EXISTS "Students can manage own exam submissions" ON exam_submissions;
CREATE POLICY "Students can manage own exam submissions" ON exam_submissions
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view submissions for their course exams" ON exam_submissions;
CREATE POLICY "Instructors can view submissions for their course exams" ON exam_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exams e
            JOIN courses c ON c.id = e.course_id
            WHERE e.id = exam_submissions.exam_id
            AND c.instructor_id = auth.uid()
        )
    );

-- =====================================================
-- 5. ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_lesson ON lesson_progress(student_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_student ON assignment_submissions(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam_student ON exam_submissions(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_course ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- =====================================================
-- 6. DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- INSTRUCCIONES: 
-- 1. Reemplaza 'YOUR_USER_ID_HERE' con el UUID de un usuario profesor real
-- 2. Si no tienes un usuario, ejecuta solo hasta la línea anterior
-- 3. Los cursos de ejemplo son opcionales

-- Insertar cursos de ejemplo con UUID del profesor (CON VERIFICACIONES)

DO $$
DECLARE
    instructor_user_id UUID := 'b88d8d60-ef84-4764-9889-237acb49bbc4'::uuid;  -- ✅ UUID del profesor
    table_exists BOOLEAN;
BEGIN
    -- Verificar que la tabla courses existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'courses'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE '❌ Error: La tabla courses no existe. Ejecuta primero la creación de tablas.';
        RETURN;
    END IF;
    
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = instructor_user_id) THEN
        RAISE NOTICE '❌ Error: El usuario instructor % no existe en auth.users', instructor_user_id;
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Tabla courses existe y usuario válido. Creando cursos...';
    
    BEGIN
        -- Curso 1: JavaScript
        INSERT INTO courses (id, title, description, instructor_id, price, level, category, image_url, is_published, duration_hours)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440001'::uuid,
             'Introducción a JavaScript',
             'Aprende los fundamentos de JavaScript desde cero',
             instructor_user_id,
             99.99,
             'beginner',
             'Programming',
             'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
             true,
             20)
        ON CONFLICT (id) DO NOTHING;

        -- Curso 2: React
        INSERT INTO courses (id, title, description, instructor_id, price, level, category, image_url, is_published, duration_hours)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440002'::uuid,
             'React para Principiantes',
             'Construye aplicaciones web modernas con React',
             instructor_user_id,
             149.99,
             'intermediate',
             'Web Development',
             'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
             true,
             30)
        ON CONFLICT (id) DO NOTHING;

        -- Curso 3: Python
        INSERT INTO courses (id, title, description, instructor_id, price, level, category, image_url, is_published, duration_hours)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440003'::uuid,
             'Python Avanzado',
             'Técnicas avanzadas de programación en Python',
             instructor_user_id,
             199.99,
             'advanced',
             'Data Science',
             'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
             true,
             40)
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '📚 Cursos de ejemplo creados exitosamente con instructor: %', instructor_user_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error al crear cursos: %', SQLERRM;
    END;
END $$;

-- =====================================================
-- 7. MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos configurada exitosamente!';
    RAISE NOTICE '📊 Tablas creadas: profiles, courses, enrollments, assignments, exams, etc.';
    RAISE NOTICE '🔒 Políticas RLS implementadas para seguridad';
    RAISE NOTICE '⚡ Índices creados para mejor rendimiento';
    RAISE NOTICE '🚀 La plataforma está lista para usar';
END $$;