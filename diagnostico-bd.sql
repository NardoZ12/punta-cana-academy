-- Script de diagnóstico para verificar configuración de la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que las tablas existen
SELECT 'VERIFICANDO TABLAS:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'courses', 'course_enrollments', 'lesson_progress', 'quiz_attempts', 'task_submissions', 'notification_settings')
ORDER BY table_name;

-- 2. Verificar estructura de la tabla profiles
SELECT 'ESTRUCTURA DE TABLA PROFILES:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar que existe la función de trigger
SELECT 'VERIFICANDO TRIGGER FUNCTION:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name ILIKE '%handle_new_user%';

-- 4. Verificar que existe el trigger
SELECT 'VERIFICANDO TRIGGER:' as info;
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
AND event_object_table = 'users';

-- 5. Verificar políticas RLS en profiles
SELECT 'VERIFICANDO POLÍTICAS RLS:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 6. Verificar que RLS está habilitado
SELECT 'VERIFICANDO RLS HABILITADO:' as info;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 7. Probar inserción manual en profiles (esto debe fallar si RLS funciona correctamente)
-- SELECT 'PROBANDO INSERCIÓN DIRECTA:' as info;
-- INSERT INTO profiles (id, full_name, user_type) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Test User', 'student');

SELECT 'DIAGNÓSTICO COMPLETADO - Revisa los resultados arriba' as resultado;