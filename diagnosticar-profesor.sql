-- Script para diagnosticar problemas con el usuario profesor
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si existe el usuario profesor en auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    user_metadata
FROM auth.users 
WHERE email LIKE '%profesor%' OR email = 'profesor@academia.com' OR email = 'teacher@test.com';

-- 2. Verificar si existe el perfil del profesor en profiles
SELECT 
    id,
    full_name,
    user_type,
    email,
    created_at
FROM profiles 
WHERE user_type = 'teacher' OR email LIKE '%profesor%';

-- 3. Verificar las políticas RLS actuales para la tabla profiles
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Verificar si RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 5. Probar acceso directo a la tabla (esto debería funcionar como superusuario)
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_teachers FROM profiles WHERE user_type = 'teacher';

-- 6. Si el profesor no tiene perfil, crear uno
-- (Reemplazar 'USER_ID_AQUI' con el ID real del usuario profesor)
/*
INSERT INTO profiles (
    id,
    email,
    full_name,
    user_type,
    created_at
) VALUES (
    'USER_ID_AQUI', -- Reemplazar con el ID real
    'profesor@academia.com',
    'Profesor de Prueba',
    'teacher',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    user_type = 'teacher',
    full_name = COALESCE(profiles.full_name, 'Profesor de Prueba');
*/

-- 7. Verificar que las tablas relacionadas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('courses', 'lessons', 'enrollments', 'grades');

-- 8. Verificar triggers en la tabla profiles
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';