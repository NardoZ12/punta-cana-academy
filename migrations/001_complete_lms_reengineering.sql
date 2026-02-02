-- =================================================================
-- MIGRACIÓN: REINGENIERÍA COMPLETA DEL LMS
-- Versión: 1.0
-- Descripción: Estructura jerárquica completa para currículo educativo
-- =================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. ESTRUCTURA JERÁRQUICA DEL CURSO
-- =================================================================

-- 1.1 UNIDADES DEL CURSO (5-12 por curso)
CREATE TABLE IF NOT EXISTS public.course_units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT[],
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    estimated_hours DECIMAL(4,1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_unit_order_per_course UNIQUE (course_id, order_index)
);

-- 1.2 TEMAS DE CADA UNIDAD
CREATE TABLE IF NOT EXISTS public.unit_topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES public.course_units(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    estimated_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_topic_order_per_unit UNIQUE (unit_id, order_index)
);

-- 1.3 RECURSOS DEL TEMA
CREATE TABLE IF NOT EXISTS public.topic_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID NOT NULL REFERENCES public.unit_topics(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.course_units(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    
    -- CONTENIDO OBLIGATORIO
    introduction TEXT NOT NULL,
    introduction_format TEXT DEFAULT 'markdown' CHECK (introduction_format IN ('markdown', 'html', 'plain')),
    
    -- VIDEO EXPLICATIVO
    video_url TEXT,
    video_provider TEXT CHECK (video_provider IN ('youtube', 'vimeo', 'cloudflare', 'bunny', 'custom')),
    video_duration_seconds INTEGER,
    video_thumbnail_url TEXT,
    
    -- MATERIAL PDF
    pdf_url TEXT,
    pdf_title TEXT,
    pdf_pages INTEGER,
    
    -- DIAPOSITIVAS/SLIDES
    slides_url TEXT,
    slides_provider TEXT CHECK (slides_provider IN ('google_slides', 'canva', 'pdf', 'custom')),
    slides_embed_code TEXT,
    
    -- RECURSOS ADICIONALES
    additional_resources JSONB DEFAULT '[]'::jsonb,
    
    is_published BOOLEAN DEFAULT false,
    requires_video_completion BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT one_resource_per_topic UNIQUE (topic_id)
);

-- =================================================================
-- 2. SISTEMA DE EVALUACIONES
-- =================================================================

DO $$ BEGIN
    CREATE TYPE exam_scope AS ENUM ('topic_quiz', 'unit_exam', 'course_final');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'ordering');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    scope exam_scope NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.course_units(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.unit_topics(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    total_points INTEGER NOT NULL DEFAULT 100,
    passing_score INTEGER NOT NULL DEFAULT 60,
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 3,
    shuffle_questions BOOLEAN DEFAULT true,
    shuffle_options BOOLEAN DEFAULT true,
    show_correct_answers BOOLEAN DEFAULT false,
    show_score_immediately BOOLEAN DEFAULT true,
    
    is_published BOOLEAN DEFAULT false,
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_scope_references CHECK (
        (scope = 'topic_quiz' AND topic_id IS NOT NULL) OR
        (scope = 'unit_exam' AND unit_id IS NOT NULL AND topic_id IS NULL) OR
        (scope = 'course_final' AND unit_id IS NULL AND topic_id IS NULL)
    )
);

-- INTENTOS DE EVALUACIÓN
CREATE TABLE IF NOT EXISTS public.evaluation_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    score DECIMAL(5,2),
    total_points_earned DECIMAL(5,2),
    total_points_possible INTEGER,
    passed BOOLEAN,
    
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,
    
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'abandoned')),
    attempt_number INTEGER NOT NULL DEFAULT 1,
    
    instructor_feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_attempt_number UNIQUE (evaluation_id, student_id, attempt_number)
);

-- =================================================================
-- 3. SISTEMA DE ASIGNACIONES AVANZADO
-- =================================================================

DO $$ BEGIN
    CREATE TYPE assignment_type AS ENUM ('file_upload', 'video_analysis', 'project_delivery', 'written_response', 'code_submission');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_target AS ENUM ('all_students', 'specific_student', 'student_group');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Eliminar tabla assignments existente si tiene estructura vieja y recrear
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;

CREATE TABLE public.assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    
    unit_id UUID REFERENCES public.course_units(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.unit_topics(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    
    assignment_type assignment_type NOT NULL DEFAULT 'file_upload',
    
    target_type assignment_target NOT NULL DEFAULT 'all_students',
    target_student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_group_ids UUID[],
    
    attached_files JSONB DEFAULT '[]'::jsonb,
    reference_video_url TEXT,
    reference_video_title TEXT,
    instruction_image_url TEXT,
    instruction_image_caption TEXT,
    additional_links JSONB DEFAULT '[]'::jsonb,
    
    max_file_size_mb INTEGER DEFAULT 50,
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'zip'],
    max_files INTEGER DEFAULT 5,
    
    max_points INTEGER NOT NULL DEFAULT 100,
    due_date TIMESTAMP WITH TIME ZONE,
    late_submission_allowed BOOLEAN DEFAULT true,
    late_penalty_percent INTEGER DEFAULT 10,
    
    requires_peer_review BOOLEAN DEFAULT false,
    rubric JSONB,
    
    is_published BOOLEAN DEFAULT false,
    available_from TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_target CHECK (
        (target_type = 'all_students' AND target_student_id IS NULL) OR
        (target_type = 'specific_student' AND target_student_id IS NOT NULL) OR
        (target_type = 'student_group' AND target_group_ids IS NOT NULL)
    )
);

-- ENTREGAS DE TAREAS
CREATE TABLE public.assignment_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    submission_text TEXT,
    submitted_files JSONB DEFAULT '[]'::jsonb,
    video_url TEXT,
    external_link TEXT,
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'late', 'graded', 'returned')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    is_late BOOLEAN DEFAULT false,
    days_late INTEGER DEFAULT 0,
    
    score DECIMAL(5,2),
    score_after_penalty DECIMAL(5,2),
    rubric_scores JSONB,
    
    instructor_feedback TEXT,
    feedback_files JSONB DEFAULT '[]'::jsonb,
    private_notes TEXT,
    
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    
    revision_number INTEGER DEFAULT 1,
    previous_submission_id UUID REFERENCES public.assignment_submissions(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_submission_per_student UNIQUE (assignment_id, student_id, revision_number)
);

-- =================================================================
-- 4. PROGRESO DEL ESTUDIANTE
-- =================================================================

CREATE TABLE IF NOT EXISTS public.topic_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.unit_topics(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.course_units(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    
    introduction_read BOOLEAN DEFAULT false,
    introduction_read_at TIMESTAMP WITH TIME ZONE,
    
    video_watched BOOLEAN DEFAULT false,
    video_watched_at TIMESTAMP WITH TIME ZONE,
    video_progress_percent INTEGER DEFAULT 0,
    video_last_position_seconds INTEGER DEFAULT 0,
    
    pdf_downloaded BOOLEAN DEFAULT false,
    pdf_downloaded_at TIMESTAMP WITH TIME ZONE,
    
    slides_viewed BOOLEAN DEFAULT false,
    slides_viewed_at TIMESTAMP WITH TIME ZONE,
    
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_percent INTEGER DEFAULT 0,
    
    total_time_spent_seconds INTEGER DEFAULT 0,
    
    first_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_topic_progress UNIQUE (student_id, topic_id)
);

CREATE TABLE IF NOT EXISTS public.unit_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.course_units(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    
    topics_completed INTEGER DEFAULT 0,
    topics_total INTEGER DEFAULT 0,
    completion_percent DECIMAL(5,2) DEFAULT 0,
    
    unit_exam_passed BOOLEAN,
    unit_exam_score DECIMAL(5,2),
    unit_exam_attempts INTEGER DEFAULT 0,
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_unit_progress UNIQUE (student_id, unit_id)
);

-- =================================================================
-- 5. ÍNDICES
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_course_units_course_id ON public.course_units(course_id);
CREATE INDEX IF NOT EXISTS idx_course_units_order ON public.course_units(course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_unit_topics_unit_id ON public.unit_topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_topics_course_id ON public.unit_topics(course_id);

CREATE INDEX IF NOT EXISTS idx_topic_resources_topic_id ON public.topic_resources(topic_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_course_id ON public.evaluations(course_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_scope ON public.evaluations(scope);

CREATE INDEX IF NOT EXISTS idx_evaluation_attempts_student ON public.evaluation_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_attempts_evaluation ON public.evaluation_attempts(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_target ON public.assignments(target_type, target_student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON public.assignment_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_topic_progress_student ON public.topic_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_topic ON public.topic_progress(topic_id);

CREATE INDEX IF NOT EXISTS idx_unit_progress_student ON public.unit_progress(student_id);

-- =================================================================
-- 6. TRIGGERS
-- =================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_course_units_modtime ON public.course_units;
CREATE TRIGGER update_course_units_modtime BEFORE UPDATE ON public.course_units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_unit_topics_modtime ON public.unit_topics;
CREATE TRIGGER update_unit_topics_modtime BEFORE UPDATE ON public.unit_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topic_resources_modtime ON public.topic_resources;
CREATE TRIGGER update_topic_resources_modtime BEFORE UPDATE ON public.topic_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluations_modtime ON public.evaluations;
CREATE TRIGGER update_evaluations_modtime BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluation_attempts_modtime ON public.evaluation_attempts;
CREATE TRIGGER update_evaluation_attempts_modtime BEFORE UPDATE ON public.evaluation_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_modtime ON public.assignments;
CREATE TRIGGER update_assignments_modtime BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_submissions_modtime ON public.assignment_submissions;
CREATE TRIGGER update_assignment_submissions_modtime BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topic_progress_modtime ON public.topic_progress;
CREATE TRIGGER update_topic_progress_modtime BEFORE UPDATE ON public.topic_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_unit_progress_modtime ON public.unit_progress;
CREATE TRIGGER update_unit_progress_modtime BEFORE UPDATE ON public.unit_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- 7. ASEGURAR COLUMNAS EXISTEN (para migraciones sobre tablas existentes)
-- =================================================================

DO $$ BEGIN
    ALTER TABLE public.course_units ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.unit_topics ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.topic_resources ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- =================================================================
-- 8. RLS POLICIES
-- =================================================================

ALTER TABLE public.course_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_progress ENABLE ROW LEVEL SECURITY;

-- COURSE_UNITS policies
DROP POLICY IF EXISTS "View units" ON public.course_units;
CREATE POLICY "View units" ON public.course_units FOR SELECT USING (
    course_units.is_published = true OR EXISTS (SELECT 1 FROM public.courses WHERE id = course_units.course_id AND instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Manage units" ON public.course_units;
CREATE POLICY "Manage units" ON public.course_units FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_units.course_id AND instructor_id = auth.uid())
);

-- UNIT_TOPICS policies
DROP POLICY IF EXISTS "View topics" ON public.unit_topics;
CREATE POLICY "View topics" ON public.unit_topics FOR SELECT USING (
    unit_topics.is_published = true OR EXISTS (SELECT 1 FROM public.courses WHERE id = unit_topics.course_id AND instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Manage topics" ON public.unit_topics;
CREATE POLICY "Manage topics" ON public.unit_topics FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = unit_topics.course_id AND instructor_id = auth.uid())
);

-- TOPIC_RESOURCES policies
DROP POLICY IF EXISTS "View resources" ON public.topic_resources;
CREATE POLICY "View resources" ON public.topic_resources FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = topic_resources.course_id AND instructor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = topic_resources.course_id AND student_id = auth.uid())
);

DROP POLICY IF EXISTS "Manage resources" ON public.topic_resources;
CREATE POLICY "Manage resources" ON public.topic_resources FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = topic_resources.course_id AND instructor_id = auth.uid())
);

-- EVALUATIONS policies
DROP POLICY IF EXISTS "View evaluations" ON public.evaluations;
CREATE POLICY "View evaluations" ON public.evaluations FOR SELECT USING (
    (evaluations.is_published = true AND EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = evaluations.course_id AND student_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.courses WHERE id = evaluations.course_id AND instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Manage evaluations" ON public.evaluations;
CREATE POLICY "Manage evaluations" ON public.evaluations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = evaluations.course_id AND instructor_id = auth.uid())
);

-- EVALUATION_ATTEMPTS policies
DROP POLICY IF EXISTS "Students own attempts" ON public.evaluation_attempts;
CREATE POLICY "Students own attempts" ON public.evaluation_attempts FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Instructors view attempts" ON public.evaluation_attempts;
CREATE POLICY "Instructors view attempts" ON public.evaluation_attempts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.evaluations e JOIN public.courses c ON c.id = e.course_id WHERE e.id = evaluation_attempts.evaluation_id AND c.instructor_id = auth.uid())
);

-- ASSIGNMENTS policies
DROP POLICY IF EXISTS "View assignments" ON public.assignments;
CREATE POLICY "View assignments" ON public.assignments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND instructor_id = auth.uid())
    OR (assignments.is_published = true AND (assignments.target_type = 'all_students' OR assignments.target_student_id = auth.uid()) AND EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = assignments.course_id AND student_id = auth.uid()))
);

DROP POLICY IF EXISTS "Manage assignments" ON public.assignments;
CREATE POLICY "Manage assignments" ON public.assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND instructor_id = auth.uid())
);

-- ASSIGNMENT_SUBMISSIONS policies
DROP POLICY IF EXISTS "Students own submissions" ON public.assignment_submissions;
CREATE POLICY "Students own submissions" ON public.assignment_submissions FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Instructors view submissions" ON public.assignment_submissions;
CREATE POLICY "Instructors view submissions" ON public.assignment_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid())
);

-- TOPIC_PROGRESS policies
DROP POLICY IF EXISTS "Students own progress" ON public.topic_progress;
CREATE POLICY "Students own progress" ON public.topic_progress FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Instructors view progress" ON public.topic_progress;
CREATE POLICY "Instructors view progress" ON public.topic_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = topic_progress.course_id AND instructor_id = auth.uid())
);

-- UNIT_PROGRESS policies
DROP POLICY IF EXISTS "Students own unit progress" ON public.unit_progress;
CREATE POLICY "Students own unit progress" ON public.unit_progress FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Instructors view unit progress" ON public.unit_progress;
CREATE POLICY "Instructors view unit progress" ON public.unit_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = unit_progress.course_id AND instructor_id = auth.uid())
);
