-- Script para eliminar TODOS los usuarios existentes de Supabase
-- ⚠️ CUIDADO: Este script eliminará permanentemente todos los usuarios y datos relacionados
-- Ejecutar en Supabase SQL Editor

-- 1. Mostrar usuarios actuales antes de eliminar
SELECT 'USUARIOS ANTES DE ELIMINAR:' as info;
SELECT 
    id,
    full_name,
    user_type,
    phone,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Contar usuarios totales
SELECT 'TOTAL DE USUARIOS:' as info, count(*) as total FROM profiles;

-- 3. Eliminar todos los datos relacionados con usuarios (en orden para evitar errores FK)

-- Eliminar quiz_attempts
DELETE FROM quiz_attempts;

-- Eliminar task_submissions  
DELETE FROM task_submissions;

-- Eliminar lesson_progress
DELETE FROM lesson_progress;

-- Eliminar course_enrollments
DELETE FROM course_enrollments;

-- Eliminar notification_settings
DELETE FROM notification_settings;

-- Eliminar profiles (tabla de perfiles de usuarios)
DELETE FROM profiles;

-- 4. Verificar que todo se eliminó
SELECT 'VERIFICACIÓN POST-ELIMINACIÓN:' as info;
SELECT 'Profiles restantes:' as tabla, count(*) as cantidad FROM profiles
UNION ALL
SELECT 'Course enrollments restantes:', count(*) FROM course_enrollments  
UNION ALL
SELECT 'Lesson progress restante:', count(*) FROM lesson_progress
UNION ALL
SELECT 'Quiz attempts restantes:', count(*) FROM quiz_attempts
UNION ALL
SELECT 'Task submissions restantes:', count(*) FROM task_submissions
UNION ALL
SELECT 'Notification settings restantes:', count(*) FROM notification_settings;

-- 5. Nota importante sobre auth.users
/*
⚠️ IMPORTANTE: Este script NO elimina los registros de auth.users (tabla de autenticación)
Para eliminar completamente los usuarios de autenticación, necesitas:

1. Ir a Supabase Dashboard > Authentication > Users
2. Eliminar manualmente cada usuario, O
3. Usar el Admin API de Supabase

Los usuarios auth que no tengan profile asociado no podrán acceder al sistema correctamente.
*/

SELECT 'ELIMINACIÓN COMPLETA - Los usuarios fueron eliminados exitosamente!' as resultado;