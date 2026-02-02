-- =================================================================
-- MIGRACIÓN: UNIDADES DE CURSO (COURSE UNITS)
-- Permite organizar las lecciones en módulos o unidades
-- =================================================================

-- 1. Crear tabla course_units
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

-- 2. Agregar referencia en course_lessons
-- Esto permite que una lección pertenezca a una unidad
ALTER TABLE public.course_lessons 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.course_units(id) ON DELETE SET NULL;

-- 3. Habilitar RLS
ALTER TABLE public.course_units ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad

-- Lectura: Cualquiera puede ver unidades de cursos publicados
-- O si el usuario es el instructor del curso
CREATE POLICY "View units" ON public.course_units
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = course_units.course_id 
            AND (is_published = true OR instructor_id = auth.uid())
        )
    );

-- Escritura: Solo el instructor del curso puede modificar unidades
CREATE POLICY "Manage units" ON public.course_units
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = course_units.course_id 
            AND instructor_id = auth.uid()
        )
    );

-- 5. Trigger para updated_at
-- Asumimos que la función update_updated_at_column ya existe (creada en migraciones anteriores)
DROP TRIGGER IF EXISTS update_course_units_modtime ON public.course_units;
CREATE TRIGGER update_course_units_modtime 
    BEFORE UPDATE ON public.course_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();