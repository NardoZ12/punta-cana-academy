-- =============================================
-- DIAGNOSTIC: Check course instructor assignment
-- Run this in Supabase SQL Editor to see what's happening
-- =============================================

-- 1. Show all courses with their instructor info
SELECT 
  c.id as course_id,
  c.title,
  c.instructor_id,
  c.is_published,
  p.email as instructor_email,
  p.full_name as instructor_name
FROM courses c
LEFT JOIN profiles p ON c.instructor_id = p.id
ORDER BY c.created_at DESC;

-- 2. Show all auth users and their profile IDs
SELECT 
  au.id as auth_uid,
  au.email,
  p.id as profile_id,
  p.user_type,
  p.full_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- 3. If instructor_id is NULL, fix it by assigning to the teacher
-- UNCOMMENT and modify the email below if needed:
/*
UPDATE courses 
SET instructor_id = (
  SELECT au.id FROM auth.users au 
  WHERE au.email = 'puntacanaacademy.info@gmail.com'
  LIMIT 1
)
WHERE instructor_id IS NULL
OR instructor_id NOT IN (SELECT id FROM auth.users);
*/
