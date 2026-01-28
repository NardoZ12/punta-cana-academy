-- Script completo para crear todas las tablas necesarias
-- Ejecutar en Supabase SQL Editor

-- 1. Actualizar tabla profiles para incluir campos nuevos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Crear tabla de inscripciones (enrollments)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- 3. Crear tabla de módulos de curso
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Actualizar tabla de lecciones para incluir más campos
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL;
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS video_duration INTEGER; -- en segundos
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS slides_url TEXT;
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 5. Crear tabla de exámenes
CREATE TABLE IF NOT EXISTS public.course_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit INTEGER, -- en minutos
  passing_score INTEGER DEFAULT 70, -- porcentaje
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Crear tabla de preguntas de examen
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.course_exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'multiple_choice', -- multiple_choice, true_false, essay
  options JSONB, -- Para respuestas múltiples
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Crear tabla de progreso de estudiantes por lección
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  watch_time INTEGER DEFAULT 0, -- segundos vistos del video
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- 8. Crear tabla de resultados de exámenes
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.course_exams(id) ON DELETE CASCADE,
  score INTEGER, -- porcentaje
  passed BOOLEAN DEFAULT FALSE,
  answers JSONB, -- respuestas del estudiante
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Crear tabla de reseñas/calificaciones
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- 10. Añadir campos faltantes a la tabla courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'beginner'; -- beginner, intermediate, advanced
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS what_you_learn TEXT[];
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- 11. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON public.course_reviews(course_id);

-- 12. Crear triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a las tablas relevantes
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON public.enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_modules_updated_at ON public.course_modules;
CREATE TRIGGER update_course_modules_updated_at 
    BEFORE UPDATE ON public.course_modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at 
    BEFORE UPDATE ON public.lesson_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Habilitar RLS en las nuevas tablas
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- 14. Crear políticas RLS básicas (idempotentes)
-- Eliminar políticas existentes primero para evitar errores de duplicados

-- Enrollments: estudiantes pueden ver sus inscripciones, profesores pueden ver inscripciones a sus cursos
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
CREATE POLICY "Students can view own enrollments" ON public.enrollments
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = student_id);

DROP POLICY IF EXISTS "Students can insert own enrollments" ON public.enrollments;
CREATE POLICY "Students can insert own enrollments" ON public.enrollments
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = student_id);

DROP POLICY IF EXISTS "Teachers can view course enrollments" ON public.enrollments;
CREATE POLICY "Teachers can view course enrollments" ON public.enrollments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = enrollments.course_id 
            AND courses.instructor_id = (SELECT auth.uid())
        )
    );

-- Módulos: profesores pueden gestionar módulos de sus cursos
DROP POLICY IF EXISTS "Teachers can manage course modules" ON public.course_modules;
CREATE POLICY "Teachers can manage course modules" ON public.course_modules
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_modules.course_id 
            AND courses.instructor_id = (SELECT auth.uid())
        )
    );

-- Estudiantes pueden ver módulos de cursos en los que están inscritos
DROP POLICY IF EXISTS "Students can view enrolled course modules" ON public.course_modules;
CREATE POLICY "Students can view enrolled course modules" ON public.course_modules
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.enrollments 
            WHERE enrollments.course_id = course_modules.course_id 
            AND enrollments.student_id = (SELECT auth.uid())
        )
    );

-- Exámenes: profesores pueden gestionar exámenes de sus cursos
DROP POLICY IF EXISTS "Teachers can manage course exams" ON public.course_exams;
CREATE POLICY "Teachers can manage course exams" ON public.course_exams
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_exams.course_id 
            AND courses.instructor_id = (SELECT auth.uid())
        )
    );

-- Estudiantes pueden ver exámenes de cursos inscritos
DROP POLICY IF EXISTS "Students can view enrolled course exams" ON public.course_exams;
CREATE POLICY "Students can view enrolled course exams" ON public.course_exams
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.enrollments 
            WHERE enrollments.course_id = course_exams.course_id 
            AND enrollments.student_id = (SELECT auth.uid())
        )
    );

-- Preguntas de examen: profesores pueden gestionarlas
DROP POLICY IF EXISTS "Teachers can manage exam questions" ON public.exam_questions;
CREATE POLICY "Teachers can manage exam questions" ON public.exam_questions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_exams 
            JOIN public.courses ON courses.id = course_exams.course_id
            WHERE course_exams.id = exam_questions.exam_id 
            AND courses.instructor_id = (SELECT auth.uid())
        )
    );

-- Estudiantes pueden ver preguntas de exámenes de cursos inscritos
DROP POLICY IF EXISTS "Students can view enrolled exam questions" ON public.exam_questions;
CREATE POLICY "Students can view enrolled exam questions" ON public.exam_questions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_exams 
            JOIN public.enrollments ON enrollments.course_id = course_exams.course_id
            WHERE course_exams.id = exam_questions.exam_id 
            AND enrollments.student_id = (SELECT auth.uid())
        )
    );

-- Progreso de lecciones: estudiantes pueden ver/actualizar su propio progreso
DROP POLICY IF EXISTS "Students can manage own lesson progress" ON public.lesson_progress;
CREATE POLICY "Students can manage own lesson progress" ON public.lesson_progress
    FOR ALL TO authenticated
    USING ((SELECT auth.uid()) = student_id);

-- Profesores pueden ver progreso de estudiantes en sus cursos
DROP POLICY IF EXISTS "Teachers can view student progress" ON public.lesson_progress;
CREATE POLICY "Teachers can view student progress" ON public.lesson_progress
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_lessons 
            JOIN public.courses ON courses.id = course_lessons.course_id
            WHERE course_lessons.id = lesson_progress.lesson_id 
            AND courses.instructor_id = (SELECT auth.uid())
        )
    );

-- Resultados de exámenes: estudiantes pueden ver/insertar sus resultados
DROP POLICY IF EXISTS "Students can manage own exam results" ON public.exam_results;
CREATE POLICY "Students can manage own exam results" ON public.exam_results
    FOR ALL TO authenticated
    USING ((SELECT auth.uid()) = student_id);

-- Profesores pueden ver resultados de exámenes de sus cursos
DROP POLICY IF EXISTS "Teachers can view exam results" ON public.exam_results;
CREATE POLICY "Teachers can view exam results" ON public.exam_results
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_exams 
            JOIN public.courses ON courses.id = course_exams.course_id
            WHERE course_exams.id = exam_results.exam_id 
            AND courses.instructor_id = (SELECT auth.uid())
        )
    );

-- Reviews: estudiantes pueden gestionar sus propias reseñas
DROP POLICY IF EXISTS "Students can manage own reviews" ON public.course_reviews;
CREATE POLICY "Students can manage own reviews" ON public.course_reviews
    FOR ALL TO authenticated
    USING ((SELECT auth.uid()) = student_id);

-- Cualquiera puede ver reseñas (para mostrar en página del curso)
DROP POLICY IF EXISTS "Anyone can view course reviews" ON public.course_reviews;
CREATE POLICY "Anyone can view course reviews" ON public.course_reviews
    FOR SELECT TO authenticated, anon
    USING (true);

-- Profesores pueden ver reseñas de sus cursos
DROP POLICY IF EXISTS "Teachers can view course reviews" ON public.course_reviews;
CREATE POLICY "Teachers can view course reviews" ON public.course_reviews
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_reviews.course_id 
            AND courses.instructor_id = (SELECT auth.uid())
        )
    );

SELECT 'TODAS LAS TABLAS Y POLÍTICAS CREADAS EXITOSAMENTE' as resultado;