-- ============================================================================
-- FIX PARA CREAR CURSOS - EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================================================
-- Este script asegura que las políticas RLS permitan crear cursos correctamente
-- Ejecutar DESPUÉS de SUPABASE_SETUP_COMPLETO.sql
-- ============================================================================

-- Primero, verificamos si la tabla courses existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        RAISE EXCEPTION 'La tabla courses NO existe. Ejecuta primero SUPABASE_SETUP_COMPLETO.sql';
    END IF;
END $$;

-- ============================================================================
-- PARTE 1: Asegurar que RLS esté habilitado pero permitiendo operaciones
-- ============================================================================

-- Habilitar RLS en courses (si no está habilitado)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 2: Recrear políticas RLS para courses (más permisivas)
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can manage own courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON public.courses;

-- SELECT: Cualquiera puede ver cursos publicados, instructor ve todos los suyos
CREATE POLICY "courses_select_policy" ON public.courses
FOR SELECT USING (
    is_published = true 
    OR instructor_id = auth.uid()
);

-- INSERT: Cualquier usuario autenticado puede crear cursos
CREATE POLICY "courses_insert_policy" ON public.courses
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND instructor_id = auth.uid()
);

-- UPDATE: Solo el instructor puede actualizar sus cursos
CREATE POLICY "courses_update_policy" ON public.courses
FOR UPDATE USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- DELETE: Solo el instructor puede eliminar sus cursos
CREATE POLICY "courses_delete_policy" ON public.courses
FOR DELETE USING (instructor_id = auth.uid());

-- ============================================================================
-- PARTE 3: Verificar que la columna price sea DECIMAL (no TEXT)
-- ============================================================================

-- Si price es TEXT, conviértela a DECIMAL
DO $$
BEGIN
    -- Verificar tipo de columna price
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'price' 
        AND data_type = 'text'
    ) THEN
        -- Primero, convertir valores existentes o poner 0
        EXECUTE 'UPDATE public.courses SET price = ''0'' WHERE price IS NULL OR price = ''''';
        -- Alterar columna
        EXECUTE 'ALTER TABLE public.courses ALTER COLUMN price TYPE DECIMAL(10,2) USING COALESCE(NULLIF(price, '''')::DECIMAL, 0)';
        RAISE NOTICE 'Columna price convertida de TEXT a DECIMAL';
    ELSE
        RAISE NOTICE 'Columna price ya es del tipo correcto';
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: Verificar que is_published tenga valor por defecto TRUE
-- ============================================================================

ALTER TABLE public.courses ALTER COLUMN is_published SET DEFAULT true;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'courses';
    
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ CONFIGURACIÓN COMPLETADA';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Políticas RLS en courses: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Ahora puedes crear cursos desde el panel de profesor.';
    RAISE NOTICE '';
END $$;
