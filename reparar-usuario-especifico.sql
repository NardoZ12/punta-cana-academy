-- ===================================================================
-- SCRIPT DE REPARACIÓN PARA USUARIO ESPECÍFICO
-- Ejecutar en Supabase SQL Editor
-- ===================================================================

-- 1. Buscar el usuario por email
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'nardo2736@gmail.com';

-- 2. Buscar el curso "Inglés Educativo"
SELECT id, title, teacher_id, is_published, created_at
FROM courses 
WHERE title ILIKE '%inglés educativo%' OR title ILIKE '%ingles educativo%';

-- 3. Verificar si existe la inscripción
SELECT e.*, c.title as course_title, u.email as student_email
FROM enrollments e
JOIN courses c ON c.id = e.course_id
JOIN auth.users u ON u.id = e.student_id
WHERE u.email = 'nardo2736@gmail.com'
  AND c.title ILIKE '%inglés educativo%';

-- 4. SI NO EXISTE LA INSCRIPCIÓN, CREARLA:
-- (Ejecuta esto solo si la consulta anterior no devuelve resultados)

INSERT INTO enrollments (
  student_id, 
  course_id, 
  progress, 
  grade,
  enrolled_at,
  created_at,
  updated_at
)
SELECT 
  u.id as student_id,
  c.id as course_id,
  0 as progress,
  NULL as grade,
  NOW() as enrolled_at,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u, courses c
WHERE u.email = 'nardo2736@gmail.com'
  AND c.title ILIKE '%inglés educativo%'
  AND NOT EXISTS (
    SELECT 1 FROM enrollments e2 
    WHERE e2.student_id = u.id AND e2.course_id = c.id
  );

-- 5. Verificar la lección específica
SELECT cl.*, cm.title as module_title, c.title as course_title
FROM course_lessons cl
JOIN course_modules cm ON cm.id = cl.module_id
JOIN courses c ON c.id = cm.course_id
WHERE cl.id = '1499891d-b906-4c66-8430-38438f073428';

-- 6. Verificar progreso existente
SELECT lp.*, cl.title as lesson_title, u.email as student_email
FROM lesson_progress lp
JOIN course_lessons cl ON cl.id = lp.lesson_id
JOIN auth.users u ON u.id = lp.student_id
WHERE u.email = 'nardo2736@gmail.com'
  AND lp.lesson_id = '1499891d-b906-4c66-8430-38438f073428';

-- 7. Verificar estructura alternativa (si existe)
SELECT ulp.*, l.title as lesson_title, u.email as student_email
FROM user_lesson_progress ulp
JOIN lessons l ON l.id = ulp.lesson_id
JOIN auth.users u ON u.id = ulp.user_id
WHERE u.email = 'nardo2736@gmail.com'
  AND ulp.lesson_id = '1499891d-b906-4c66-8430-38438f073428';

-- 8. Listar todas las lecciones del curso para verificar estructura
SELECT 
  cl.id,
  cl.title as lesson_title,
  cl.sort_order,
  cm.title as module_title,
  cm.sort_order as module_order,
  c.title as course_title
FROM course_lessons cl
JOIN course_modules cm ON cm.id = cl.module_id
JOIN courses c ON c.id = cm.course_id
WHERE c.title ILIKE '%inglés educativo%'
ORDER BY cm.sort_order, cl.sort_order;

-- ===================================================================
-- RESULTADO ESPERADO:
-- ===================================================================
-- Después de ejecutar este script deberías ver:
-- 1. El usuario encontrado
-- 2. El curso encontrado
-- 3. La inscripción existente o recién creada
-- 4. La lección específica
-- 5. El progreso (si existe)
-- 6. Todas las lecciones del curso

-- Si después de esto la lección sigue sin cargar, el problema podría estar en:
-- - Permisos RLS (ejecutar fix-supabase-rls.sql)
-- - Estructura de tablas diferente a la esperada
-- - Problemas de autenticación en el frontend