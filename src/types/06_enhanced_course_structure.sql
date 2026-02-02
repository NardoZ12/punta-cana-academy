-- =================================================================
-- MIGRACIÓN: ESTRUCTURA AVANZADA DE CURSOS Y ASIGNACIONES
-- =================================================================

-- 1. TABLA DE UNIDADES (Si no existe)
CREATE TABLE IF NOT EXISTS public.course_units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ACTUALIZAR LECCIONES (TEMAS)
-- Añadir campos para los recursos específicos solicitados
ALTER TABLE public.course_lessons 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.course_units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS introduction TEXT, -- Introducción del tema
ADD COLUMN IF NOT EXISTS pdf_url TEXT,      -- Archivo PDF
ADD COLUMN IF NOT EXISTS slide_url TEXT,    -- Diapositiva
ADD COLUMN IF NOT EXISTS video_url TEXT;    -- Video explicativo (ya existía, aseguramos)

-- 3. ACTUALIZAR ASIGNACIONES (TAREAS/EXÁMENES)
-- Para vincularlas a Unidades, Lecciones o Estudiantes específicos
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.course_units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL; -- NULL = Para todos

-- 4. POLÍTICAS DE SEGURIDAD (RLS) PARA UNIDADES
ALTER TABLE public.course_units ENABLE ROW LEVEL SECURITY;

-- Lectura: Cualquiera puede ver unidades de cursos publicados o si es el instructor
DROP POLICY IF EXISTS "View units" ON public.course_units;
CREATE POLICY "View units" ON public.course_units
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = course_units.course_id 
            AND (is_published = true OR instructor_id = auth.uid())
        )
    );

-- Escritura: Solo el instructor del curso
DROP POLICY IF EXISTS "Manage units" ON public.course_units;
CREATE POLICY "Manage units" ON public.course_units
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = course_units.course_id 
            AND instructor_id = auth.uid()
        )
    );

-- 5. TRIGGER PARA UPDATED_AT EN UNIDADES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_course_units_modtime ON public.course_units;
CREATE TRIGGER update_course_units_modtime 
    BEFORE UPDATE ON public.course_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();