-- =================================================================
-- PUNTA CANA ACADEMY - POLÍTICAS RLS Y TRIGGERS PARA SINCRONIZACIÓN
-- =================================================================

-- NOTA: Ejecuta estos comandos en el SQL Editor de Supabase Dashboard

-- =================================================================
-- 1. POLÍTICAS PARA LECCIONES (course_lessons)
-- =================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "students_can_view_published_lessons" ON course_lessons;
DROP POLICY IF EXISTS "teachers_can_manage_own_lessons" ON course_lessons;

-- Política: Los estudiantes pueden ver lecciones de cursos en los que están inscritos
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

-- Política: Los profesores pueden gestionar lecciones de sus cursos
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

-- =================================================================
-- 2. POLÍTICAS PARA PROGRESO DE LECCIONES (lesson_progress)
-- =================================================================

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

-- =================================================================
-- 3. POLÍTICAS PARA EXÁMENES (exams)
-- =================================================================

DROP POLICY IF EXISTS "students_can_view_assigned_exams" ON exams;
DROP POLICY IF EXISTS "teachers_can_manage_own_exams" ON exams;

-- Estudiantes pueden ver exámenes de cursos en los que están inscritos
CREATE POLICY "students_can_view_assigned_exams" ON exams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = auth.uid()
    AND c.id = exams.course_id
    AND c.is_published = true
  )
);

-- Profesores pueden gestionar exámenes de sus cursos
CREATE POLICY "teachers_can_manage_own_exams" ON exams
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM courses c
    WHERE c.id = exams.course_id
    AND c.teacher_id = auth.uid()
  )
);

-- =================================================================
-- 4. POLÍTICAS PARA SUBMISSIONS DE EXÁMENES (exam_submissions)
-- =================================================================

DROP POLICY IF EXISTS "students_can_manage_own_submissions" ON exam_submissions;
DROP POLICY IF EXISTS "teachers_can_view_students_submissions" ON exam_submissions;

-- Estudiantes pueden gestionar sus propias entregas
CREATE POLICY "students_can_manage_own_submissions" ON exam_submissions
FOR ALL
USING (student_id = auth.uid());

-- Profesores pueden ver entregas de estudiantes en sus cursos
CREATE POLICY "teachers_can_view_students_submissions" ON exam_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM exams ex
    JOIN courses c ON ex.course_id = c.id
    WHERE ex.id = exam_submissions.exam_id
    AND c.teacher_id = auth.uid()
  )
);

-- =================================================================
-- 5. POLÍTICAS PARA ASSIGNMENTS (assignments)
-- =================================================================

DROP POLICY IF EXISTS "students_can_view_assigned_assignments" ON assignments;
DROP POLICY IF EXISTS "teachers_can_manage_own_assignments" ON assignments;

-- Estudiantes pueden ver tareas de cursos en los que están inscritos
CREATE POLICY "students_can_view_assigned_assignments" ON assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = auth.uid()
    AND c.id = assignments.course_id
    AND c.is_published = true
  )
);

-- Profesores pueden gestionar tareas de sus cursos
CREATE POLICY "teachers_can_manage_own_assignments" ON assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM courses c
    WHERE c.id = assignments.course_id
    AND c.teacher_id = auth.uid()
  )
);

-- =================================================================
-- 6. POLÍTICAS PARA INSCRIPCIONES (enrollments)
-- =================================================================

DROP POLICY IF EXISTS "students_can_view_own_enrollments" ON enrollments;
DROP POLICY IF EXISTS "teachers_can_view_course_enrollments" ON enrollments;

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

-- Profesores pueden actualizar notas de estudiantes en sus cursos
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

-- =================================================================
-- 7. TRIGGER PARA ACTUALIZAR PROGRESO AUTOMÁTICAMENTE
-- =================================================================

-- Función que actualiza el progreso del curso cuando se completa una lección
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo ejecutar cuando se marca como completada
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    
    -- Calcular progreso total del curso
    WITH course_stats AS (
      SELECT 
        COUNT(DISTINCT cl.id) as total_lessons,
        COUNT(DISTINCT lp.lesson_id) as completed_lessons
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      LEFT JOIN lesson_progress lp ON lp.lesson_id = cl.id 
        AND lp.student_id = NEW.student_id 
        AND lp.completed = true
      WHERE cm.course_id = NEW.course_id
        AND cm.is_published = true
    )
    UPDATE enrollments 
    SET 
      progress = CASE 
        WHEN cs.total_lessons > 0 
        THEN ROUND((cs.completed_lessons::numeric / cs.total_lessons::numeric) * 100)
        ELSE 0 
      END,
      updated_at = NOW()
    FROM course_stats cs
    WHERE enrollments.student_id = NEW.student_id 
      AND enrollments.course_id = NEW.course_id;
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y crear nuevo
DROP TRIGGER IF EXISTS trigger_update_course_progress ON lesson_progress;

CREATE TRIGGER trigger_update_course_progress
  AFTER INSERT OR UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress();

-- =================================================================
-- 8. TRIGGER PARA ACTUALIZAR PROMEDIO CUANDO CAMBIA UNA NOTA
-- =================================================================

-- Función que actualiza el promedio general del estudiante
CREATE OR REPLACE FUNCTION update_student_average()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el promedio general en la tabla de perfiles (opcional)
  -- O mantener un campo average_grade en enrollments
  
  -- Por ahora, solo logueamos el cambio (puedes agregar lógica específica)
  RAISE NOTICE 'Grade updated for student % in course %: % -> %', 
    NEW.student_id, NEW.course_id, OLD.grade, NEW.grade;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para cuando cambia una nota
DROP TRIGGER IF EXISTS trigger_update_student_average ON enrollments;

CREATE TRIGGER trigger_update_student_average
  AFTER UPDATE ON enrollments
  FOR EACH ROW
  WHEN (OLD.grade IS DISTINCT FROM NEW.grade)
  EXECUTE FUNCTION update_student_average();

-- =================================================================
-- 9. ÍNDICES PARA PERFORMANCE
-- =================================================================

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_course 
  ON lesson_progress(student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_completed 
  ON lesson_progress(lesson_id, completed);

CREATE INDEX IF NOT EXISTS idx_enrollments_student 
  ON enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_course 
  ON enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_exam_submissions_student_exam 
  ON exam_submissions(student_id, exam_id);

-- =================================================================
-- 10. HABILITAR RLS EN TODAS LAS TABLAS (SI NO ESTÁ HABILITADO)
-- =================================================================

ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 11. POLÍTICAS ADICIONALES PARA ASSIGNMENT_SUBMISSIONS
-- =================================================================

DROP POLICY IF EXISTS "students_can_manage_own_assignment_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "teachers_can_view_assignment_submissions" ON assignment_submissions;

-- Estudiantes pueden gestionar sus propias entregas de tareas
CREATE POLICY "students_can_manage_own_assignment_submissions" ON assignment_submissions
FOR ALL
USING (student_id = auth.uid());

-- Profesores pueden ver entregas de tareas de sus cursos
CREATE POLICY "teachers_can_view_assignment_submissions" ON assignment_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = assignment_submissions.assignment_id
    AND c.teacher_id = auth.uid()
  )
);

-- =================================================================
-- FINAL: VERIFICACIÓN DE POLÍTICAS
-- =================================================================

-- Consulta para verificar que todas las políticas están activas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('course_lessons', 'lesson_progress', 'exams', 'exam_submissions', 'assignments', 'assignment_submissions', 'enrollments')
ORDER BY tablename, policyname;