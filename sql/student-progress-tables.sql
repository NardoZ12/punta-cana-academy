-- ============================================================
-- SQL para crear tablas de progreso del estudiante + políticas RLS
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla topic_progress (progreso por tema)
CREATE TABLE IF NOT EXISTS topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES unit_topics(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES course_units(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Progreso granular
  introduction_read BOOLEAN DEFAULT FALSE,
  introduction_read_at TIMESTAMPTZ,
  video_watched BOOLEAN DEFAULT FALSE,
  video_watched_at TIMESTAMPTZ,
  video_progress_percent INTEGER DEFAULT 0,
  pdf_downloaded BOOLEAN DEFAULT FALSE,
  slides_viewed BOOLEAN DEFAULT FALSE,
  
  -- Completado
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completion_percent INTEGER DEFAULT 0,
  
  -- Metadatos
  first_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, topic_id)
);

-- 2. Tabla unit_progress (progreso por unidad)
CREATE TABLE IF NOT EXISTS unit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES course_units(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  completion_percent INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, unit_id)
);

-- 3. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_topic_progress_student ON topic_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_topic ON topic_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_course ON topic_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_student_course ON topic_progress(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_unit_progress_student ON unit_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_unit_progress_unit ON unit_progress(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_progress_course ON unit_progress(course_id);

-- 4. Habilitar RLS
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_progress ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para topic_progress
-- Estudiantes pueden ver su propio progreso
DROP POLICY IF EXISTS "Students can view own topic progress" ON topic_progress;
CREATE POLICY "Students can view own topic progress"
  ON topic_progress FOR SELECT
  USING (auth.uid() = student_id);

-- Estudiantes pueden insertar su propio progreso
DROP POLICY IF EXISTS "Students can insert own topic progress" ON topic_progress;
CREATE POLICY "Students can insert own topic progress"
  ON topic_progress FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Estudiantes pueden actualizar su propio progreso
DROP POLICY IF EXISTS "Students can update own topic progress" ON topic_progress;
CREATE POLICY "Students can update own topic progress"
  ON topic_progress FOR UPDATE
  USING (auth.uid() = student_id);

-- Profesores pueden ver el progreso de sus estudiantes
DROP POLICY IF EXISTS "Teachers can view student topic progress" ON topic_progress;
CREATE POLICY "Teachers can view student topic progress"
  ON topic_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = topic_progress.course_id
      AND c.instructor_id = auth.uid()
    )
  );

-- 6. Políticas RLS para unit_progress
DROP POLICY IF EXISTS "Students can view own unit progress" ON unit_progress;
CREATE POLICY "Students can view own unit progress"
  ON unit_progress FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own unit progress" ON unit_progress;
CREATE POLICY "Students can insert own unit progress"
  ON unit_progress FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own unit progress" ON unit_progress;
CREATE POLICY "Students can update own unit progress"
  ON unit_progress FOR UPDATE
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view student unit progress" ON unit_progress;
CREATE POLICY "Teachers can view student unit progress"
  ON unit_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = unit_progress.course_id
      AND c.instructor_id = auth.uid()
    )
  );

-- 7. Asegurar que unit_topics y topic_resources tengan políticas de lectura para estudiantes
-- Estudiantes inscritos pueden leer los temas del curso
DROP POLICY IF EXISTS "Enrolled students can view topics" ON unit_topics;
CREATE POLICY "Enrolled students can view topics"
  ON unit_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = unit_topics.course_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = unit_topics.course_id
      AND c.instructor_id = auth.uid()
    )
  );

-- Estudiantes inscritos pueden leer los recursos
DROP POLICY IF EXISTS "Enrolled students can view topic resources" ON topic_resources;
CREATE POLICY "Enrolled students can view topic resources"
  ON topic_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM unit_topics ut
      JOIN enrollments e ON e.course_id = ut.course_id
      WHERE ut.id = topic_resources.topic_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM unit_topics ut
      JOIN courses c ON c.id = ut.course_id
      WHERE ut.id = topic_resources.topic_id
      AND c.instructor_id = auth.uid()
    )
  );

-- Estudiantes inscritos pueden leer las unidades
DROP POLICY IF EXISTS "Enrolled students can view units" ON course_units;
CREATE POLICY "Enrolled students can view units"
  ON course_units FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = course_units.course_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_units.course_id
      AND c.instructor_id = auth.uid()
    )
  );

-- 8. Políticas para evaluations y evaluation_attempts
DROP POLICY IF EXISTS "Enrolled students can view evaluations" ON evaluations;
CREATE POLICY "Enrolled students can view evaluations"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = evaluations.course_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = evaluations.course_id
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enrolled students can view evaluation questions" ON evaluation_questions;
CREATE POLICY "Enrolled students can view evaluation questions"
  ON evaluation_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evaluations ev
      JOIN enrollments e ON e.course_id = ev.course_id
      WHERE ev.id = evaluation_questions.evaluation_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM evaluations ev
      JOIN courses c ON c.id = ev.course_id
      WHERE ev.id = evaluation_questions.evaluation_id
      AND c.instructor_id = auth.uid()
    )
  );

-- Estudiantes pueden ver y crear sus propios intentos
DROP POLICY IF EXISTS "Students can view own attempts" ON evaluation_attempts;
CREATE POLICY "Students can view own attempts"
  ON evaluation_attempts FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own attempts" ON evaluation_attempts;
CREATE POLICY "Students can insert own attempts"
  ON evaluation_attempts FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own attempts" ON evaluation_attempts;
CREATE POLICY "Students can update own attempts"
  ON evaluation_attempts FOR UPDATE
  USING (auth.uid() = student_id);

-- Teachers can view all attempts for their courses
DROP POLICY IF EXISTS "Teachers can view student attempts" ON evaluation_attempts;
CREATE POLICY "Teachers can view student attempts"
  ON evaluation_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evaluations ev
      JOIN courses c ON c.id = ev.course_id
      WHERE ev.id = evaluation_attempts.evaluation_id
      AND c.instructor_id = auth.uid()
    )
  );

-- 9. Función para actualizar el progreso de la unidad cuando se completa un tema
CREATE OR REPLACE FUNCTION update_unit_progress_on_topic_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_unit_id UUID;
  v_course_id UUID;
  v_total_topics INT;
  v_completed_topics INT;
  v_percent INT;
BEGIN
  IF NEW.completed = TRUE AND (OLD IS NULL OR OLD.completed = FALSE) THEN
    v_unit_id := NEW.unit_id;
    v_course_id := NEW.course_id;
    
    -- Contar temas totales y completados
    SELECT COUNT(*) INTO v_total_topics
    FROM unit_topics WHERE unit_id = v_unit_id;
    
    SELECT COUNT(*) INTO v_completed_topics
    FROM topic_progress
    WHERE unit_id = v_unit_id
    AND student_id = NEW.student_id
    AND completed = TRUE;
    
    v_percent := CASE WHEN v_total_topics > 0 THEN ROUND((v_completed_topics::FLOAT / v_total_topics) * 100) ELSE 0 END;
    
    -- Upsert unit_progress
    INSERT INTO unit_progress (student_id, unit_id, course_id, completion_percent, completed, completed_at)
    VALUES (
      NEW.student_id,
      v_unit_id,
      v_course_id,
      v_percent,
      v_percent = 100,
      CASE WHEN v_percent = 100 THEN NOW() ELSE NULL END
    )
    ON CONFLICT (student_id, unit_id)
    DO UPDATE SET
      completion_percent = EXCLUDED.completion_percent,
      completed = EXCLUDED.completed,
      completed_at = CASE WHEN EXCLUDED.completed THEN NOW() ELSE unit_progress.completed_at END,
      updated_at = NOW();
    
    -- También actualizar el progreso en enrollments
    UPDATE enrollments
    SET progress = (
      SELECT ROUND(AVG(up.completion_percent))
      FROM unit_progress up
      WHERE up.course_id = v_course_id
      AND up.student_id = NEW.student_id
    ),
    updated_at = NOW()
    WHERE course_id = v_course_id
    AND student_id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_unit_progress ON topic_progress;
CREATE TRIGGER trigger_update_unit_progress
  AFTER INSERT OR UPDATE ON topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_progress_on_topic_complete();

-- 10. Verificar que las tablas existen
SELECT 'topic_progress' as tabla, COUNT(*) as filas FROM topic_progress
UNION ALL
SELECT 'unit_progress', COUNT(*) FROM unit_progress;
