-- Script para VERIFICAR y CREAR las relaciones faltantes en la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si existe la tabla courses
SELECT 'VERIFICANDO TABLA COURSES...' as info;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si existe la tabla profiles
SELECT 'VERIFICANDO TABLA PROFILES...' as info;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar relaciones existentes
SELECT 'VERIFICANDO FOREIGN KEYS...' as info;
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name='courses' OR tc.table_name='profiles');

-- 4. Si no existe la foreign key, crearla
-- (Descomenta si necesitas crearla)

/*
-- Crear foreign key si no existe
ALTER TABLE public.courses 
ADD CONSTRAINT fk_courses_instructor 
FOREIGN KEY (instructor_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
*/

-- 5. Verificar que instructor_id existe en courses
SELECT 'VERIFICANDO COLUMNA INSTRUCTOR_ID...' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND table_schema = 'public' 
  AND column_name = 'instructor_id';

SELECT 'VERIFICACIÓN COMPLETA - Revisa los resultados arriba' as resultado;