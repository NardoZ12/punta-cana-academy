-- Script SQL para buscar y corregir usuarios con configuración incorrecta
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los usuarios actuales
SELECT 
  id,
  full_name,
  user_type,
  phone,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Buscar usuarios que podrían ser profesores pero están marcados como estudiantes
SELECT 
  id,
  full_name,
  user_type,
  created_at
FROM profiles 
WHERE 
  user_type = 'student' 
  AND (
    full_name ILIKE '%academy%' OR
    full_name ILIKE '%teacher%' OR
    full_name ILIKE '%profesor%' OR
    full_name ILIKE '%punta%'
  );

-- 3. Si encontramos al usuario específico, actualizar su tipo
-- (Reemplaza 'USER_ID_HERE' con el ID real del usuario)
/*
UPDATE profiles 
SET user_type = 'teacher' 
WHERE id = 'USER_ID_HERE';
*/

-- 4. También revisar la tabla auth.users para ver los emails
-- (Esta consulta solo funciona si tienes acceso a auth schema)
/*
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  p.full_name,
  p.user_type,
  p.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
*/