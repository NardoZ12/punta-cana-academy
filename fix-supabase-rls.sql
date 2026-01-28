/**
 * 🚀 SCRIPT DE EJECUCIÓN PARA CORREGIR RLS DE SUPABASE
 * 
 * INSTRUCCIONES:
 * 1. Ve a Supabase Dashboard -> SQL Editor
 * 2. Copia y pega este código completo
 * 3. Ejecuta cada sección marcada con EXECUTE STEP X
 */

-- ===================================================================
-- EXECUTE STEP 1: HABILITAR RLS EN TABLAS PRINCIPALES
-- ===================================================================

-- Primero habilitamos RLS en todas las tablas
ALTER TABLE IF EXISTS course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS course_modules ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- EXECUTE STEP 2: POLÍTICAS PARA LECCIONES
-- ===================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "students_can_view_published_lessons" ON course_lessons;
DROP POLICY IF EXISTS "teachers_can_manage_own_lessons" ON course_lessons;
DROP POLICY IF EXISTS "public_can_view_course_lessons" ON course_lessons;

-- Política para estudiantes: ver lecciones de cursos en los que están inscritos
CREATE POLICY "students_can_view_published_lessons" ON course_lessons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM course_modules cm
    JOIN courses c ON cm.course_id = c.id
    JOIN enrollments e ON e.course_id = c.id
    WHERE cm.id = course_lessons.module_id
    AND e.student_id = auth.uid()
    AND c.is_published = true
    AND cm.is_published = true
  )
);

-- Política para profesores: gestionar lecciones de sus cursos
CREATE POLICY "teachers_can_manage_own_lessons" ON course_lessons
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM course_modules cm
    JOIN courses c ON cm.course_id = c.id
    WHERE cm.id = course_lessons.module_id
    AND c.teacher_id = auth.uid()
  )
);

-- ===================================================================
-- EXECUTE STEP 3: POLÍTICAS PARA PROGRESO DE LECCIONES
-- ===================================================================

DROP POLICY IF EXISTS "students_can_manage_own_progress" ON lesson_progress;
DROP POLICY IF EXISTS "teachers_can_view_students_progress" ON lesson_progress;

-- Estudiantes pueden gestionar su propio progreso
CREATE POLICY "students_can_manage_own_progress" ON lesson_progress
FOR ALL
USING (student_id = auth.uid());

-- Profesores pueden ver el progreso de estudiantes en sus cursos
CREATE POLICY "teachers_can_view_students_progress" ON lesson_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM courses c
    WHERE c.id = lesson_progress.course_id
    AND c.teacher_id = auth.uid()
  )
);

-- ===================================================================
-- EXECUTE STEP 4: POLÍTICAS PARA INSCRIPCIONES
-- ===================================================================

DROP POLICY IF EXISTS "students_can_view_own_enrollments" ON enrollments;
DROP POLICY IF EXISTS "teachers_can_view_course_enrollments" ON enrollments;
DROP POLICY IF EXISTS "teachers_can_update_grades" ON enrollments;

-- Estudiantes pueden ver sus propias inscripciones
CREATE POLICY "students_can_view_own_enrollments" ON enrollments
FOR SELECT
USING (student_id = auth.uid());

-- Profesores pueden ver inscripciones de sus cursos
CREATE POLICY "teachers_can_view_course_enrollments" ON enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM courses c
    WHERE c.id = enrollments.course_id
    AND c.teacher_id = auth.uid()
  )
);

-- Profesores pueden actualizar notas
CREATE POLICY "teachers_can_update_grades" ON enrollments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM courses c
    WHERE c.id = enrollments.course_id
    AND c.teacher_id = auth.uid()
  )
);

-- ===================================================================
-- EXECUTE STEP 5: VERIFICACIÓN FINAL
-- ===================================================================

-- Verificar que las políticas están activas
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('course_lessons', 'lesson_progress', 'enrollments')
ORDER BY tablename, policyname;

-- ===================================================================
-- EXECUTE STEP 6: ÍNDICES DE PERFORMANCE (OPCIONAL)
-- ===================================================================

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_course 
  ON lesson_progress(student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_completed 
  ON lesson_progress(lesson_id, completed);

CREATE INDEX IF NOT EXISTS idx_enrollments_student 
  ON enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_course_lessons_module 
  ON course_lessons(module_id);

-- ===================================================================
-- ¡COMPLETADO! 🎉
-- ===================================================================

-- Si todo se ejecutó correctamente, verifica que las políticas están activas:
-- Deberías ver políticas para course_lessons, lesson_progress, y enrollments