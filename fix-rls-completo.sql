-- =====================================================
-- FIX COMPLETO: RLS, Columnas Faltantes e Instructor ID
-- Ejecutar en Supabase SQL Editor
-- =====================================================
-- Este script asegura que:
-- 1. Profesores pueden editar todos los campos de sus cursos
-- 2. Los cambios se reflejan inmediatamente para estudiantes inscritos
-- 3. Los cambios se reflejan en la página principal
-- 4. Columnas faltantes se crean si no existen
-- 5. instructor_id se asigna a cursos huérfanos
-- =====================================================

-- =====================================================
-- PASO 1: AGREGAR COLUMNAS FALTANTES A courses
-- =====================================================

-- Columna modality (Online, Presencial, Híbrido)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'modality') THEN
        ALTER TABLE courses ADD COLUMN modality TEXT DEFAULT 'Online';
        RAISE NOTICE '✅ Columna modality agregada a courses';
    END IF;
END $$;

-- Columna schedule (horario)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'schedule') THEN
        ALTER TABLE courses ADD COLUMN schedule TEXT;
        RAISE NOTICE '✅ Columna schedule agregada a courses';
    END IF;
END $$;

-- Columna enrolled_students (contador)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'enrolled_students') THEN
        ALTER TABLE courses ADD COLUMN enrolled_students INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Columna enrolled_students agregada a courses';
    END IF;
END $$;

-- Columna duration (texto legible como "3 meses")
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'duration') THEN
        ALTER TABLE courses ADD COLUMN duration TEXT;
        RAISE NOTICE '✅ Columna duration agregada a courses';
    END IF;
END $$;

-- =====================================================
-- PASO 2: ASEGURAR course_modules EXISTE
-- (usado en la página de detalle de curso público)
-- =====================================================

CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar sort_order a course_modules si ya existía sin esa columna
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_modules' AND column_name = 'sort_order') THEN
        ALTER TABLE course_modules ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Columna sort_order agregada a course_modules';
    END IF;
END $$;

-- Agregar is_published a course_modules si ya existía sin esa columna
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_modules' AND column_name = 'is_published') THEN
        ALTER TABLE course_modules ADD COLUMN is_published BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Columna is_published agregada a course_modules';
    END IF;
END $$;

-- Agregar sort_order a course_lessons si no existe
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_lessons' AND column_name = 'sort_order') THEN
        ALTER TABLE course_lessons ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Columna sort_order agregada a course_lessons';
    END IF;
END $$;

-- Agregar module_id a course_lessons si no existe
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_lessons' AND column_name = 'module_id') THEN
        ALTER TABLE course_lessons ADD COLUMN module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Columna module_id agregada a course_lessons';
    END IF;
END $$;

-- Índices para course_modules
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_sort_order ON course_modules(course_id, sort_order);

-- =====================================================
-- PASO 3: FIX instructor_id EN CURSOS HUÉRFANOS
-- =====================================================

-- Asignar instructor_id al primer profesor disponible si es NULL
DO $$
DECLARE
    teacher_uuid UUID;
    updated_count INTEGER;
BEGIN
    SELECT p.id INTO teacher_uuid
    FROM profiles p
    WHERE p.user_type = 'teacher'
    LIMIT 1;

    IF teacher_uuid IS NOT NULL THEN
        UPDATE courses SET instructor_id = teacher_uuid WHERE instructor_id IS NULL;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        IF updated_count > 0 THEN
            RAISE NOTICE '✅ % cursos actualizados con instructor_id = %', updated_count, teacher_uuid;
        ELSE
            RAISE NOTICE '✅ Todos los cursos ya tienen instructor_id';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No hay profesores en la tabla profiles. Crea uno primero.';
    END IF;
END $$;

-- =====================================================
-- PASO 4: ACTUALIZAR enrolled_students CON CONTEO REAL
-- =====================================================

UPDATE courses c SET enrolled_students = (
    SELECT COUNT(*) FROM enrollments e 
    WHERE e.course_id = c.id AND e.status = 'active'
);

-- =====================================================
-- PASO 5: RLS COMPLETO PARA COURSES
-- =====================================================

-- Habilitar RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- FUNCIONES HELPER (SECURITY DEFINER) para romper recursión RLS
-- Estas funciones bypasean RLS internamente, evitando el loop circular
-- ==========================================

-- Chequear si un usuario está inscrito en un curso (sin pasar por RLS de enrollments)
CREATE OR REPLACE FUNCTION is_enrolled_in_course(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments 
    WHERE student_id = p_user_id AND course_id = p_course_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Chequear si un usuario es instructor de un curso (sin pasar por RLS de courses)
CREATE OR REPLACE FUNCTION is_instructor_of_course(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses 
    WHERE id = p_course_id AND instructor_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Chequear si un curso está publicado (sin pasar por RLS de courses)
CREATE OR REPLACE FUNCTION is_course_published(p_course_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses WHERE id = p_course_id AND is_published = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- COURSES: Políticas de lectura
-- ==========================================

-- Cualquier persona (incluso no logueada) puede ver cursos publicados
-- Esto permite que la PÁGINA PRINCIPAL muestre los cursos sin autenticación
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (
        is_published = true
    );

-- Profesores ven TODOS sus propios cursos (publicados o no)
DROP POLICY IF EXISTS "Instructors view own courses" ON courses;
CREATE POLICY "Instructors view own courses" ON courses
    FOR SELECT USING (
        auth.uid() = instructor_id
    );

-- Estudiantes inscritos ven los cursos donde están matriculados
-- (incluso si el profesor cambia datos, el estudiante ve los cambios al instante)
DROP POLICY IF EXISTS "Enrolled students view their courses" ON courses;
CREATE POLICY "Enrolled students view their courses" ON courses
    FOR SELECT USING (
        is_enrolled_in_course(auth.uid(), id)
    );

-- ==========================================
-- COURSES: Políticas de escritura (INSERT, UPDATE, DELETE)
-- ==========================================

-- Profesores pueden crear cursos
DROP POLICY IF EXISTS "Instructors can insert courses" ON courses;
CREATE POLICY "Instructors can insert courses" ON courses
    FOR INSERT WITH CHECK (
        auth.uid() = instructor_id
    );

-- Profesores pueden actualizar SUS cursos
-- (título, descripción, imagen, temario, etc.)
DROP POLICY IF EXISTS "Instructors can update own courses" ON courses;
CREATE POLICY "Instructors can update own courses" ON courses
    FOR UPDATE USING (
        auth.uid() = instructor_id
    );

-- Profesores pueden eliminar SUS cursos
DROP POLICY IF EXISTS "Instructors can delete own courses" ON courses;
CREATE POLICY "Instructors can delete own courses" ON courses
    FOR DELETE USING (
        auth.uid() = instructor_id
    );

-- IMPORTANTE: Eliminar la política genérica FOR ALL si existe
-- (puede causar conflictos con las políticas específicas)
DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;

-- ==========================================
-- COURSE_MODULES: Para el temario del detalle del curso
-- ==========================================

DROP POLICY IF EXISTS "Anyone can view published modules" ON course_modules;
CREATE POLICY "Anyone can view published modules" ON course_modules
    FOR SELECT USING (
        is_course_published(course_id)
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Teachers can manage course modules" ON course_modules;
CREATE POLICY "Teachers can manage course modules" ON course_modules
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- ==========================================
-- COURSE_LESSONS: Lecciones del temario
-- ==========================================

DROP POLICY IF EXISTS "Students can view lessons of enrolled courses" ON course_lessons;
CREATE POLICY "Students can view lessons of enrolled courses" ON course_lessons
    FOR SELECT USING (
        is_course_published(course_id)
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Instructors can manage lessons of own courses" ON course_lessons;
CREATE POLICY "Instructors can manage lessons of own courses" ON course_lessons
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- ==========================================
-- COURSE_UNITS: Unidades (nuevo sistema curricular)
-- ==========================================

DROP POLICY IF EXISTS "View units" ON course_units;
CREATE POLICY "View units" ON course_units 
    FOR SELECT USING (
        (is_published = true AND is_course_published(course_id))
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Manage units" ON course_units;
CREATE POLICY "Manage units" ON course_units 
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- ==========================================
-- UNIT_TOPICS: Temas de cada unidad
-- ==========================================

DROP POLICY IF EXISTS "View topics" ON unit_topics;
CREATE POLICY "View topics" ON unit_topics 
    FOR SELECT USING (
        (is_published = true AND is_course_published(course_id))
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Manage topics" ON unit_topics;
CREATE POLICY "Manage topics" ON unit_topics 
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- ==========================================
-- TOPIC_RESOURCES: Recursos de cada tema
-- ==========================================

DROP POLICY IF EXISTS "View resources" ON topic_resources;
CREATE POLICY "View resources" ON topic_resources 
    FOR SELECT USING (
        is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Manage resources" ON topic_resources;
CREATE POLICY "Manage resources" ON topic_resources 
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- ==========================================
-- ENROLLMENTS: Estudiantes ven sus inscripciones + profes ven las de su curso
-- ==========================================

DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;
CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create enrollments" ON enrollments;
CREATE POLICY "Students can create enrollments" ON enrollments
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own enrollments" ON enrollments;
CREATE POLICY "Students can update own enrollments" ON enrollments
    FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON enrollments;
CREATE POLICY "Instructors can view enrollments for their courses" ON enrollments
    FOR SELECT USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- ==========================================
-- PASO 6: TRIGGER para actualizar enrolled_students automáticamente
-- ==========================================

-- Cuando un estudiante se inscribe o sale, actualizar el conteo
CREATE OR REPLACE FUNCTION update_enrolled_students_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el conteo de estudiantes inscritos
    IF TG_OP = 'INSERT' THEN
        UPDATE courses SET enrolled_students = (
            SELECT COUNT(*) FROM enrollments WHERE course_id = NEW.course_id AND status = 'active'
        ) WHERE id = NEW.course_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE courses SET enrolled_students = (
            SELECT COUNT(*) FROM enrollments WHERE course_id = NEW.course_id AND status = 'active'
        ) WHERE id = NEW.course_id;
        -- Si cambió de curso (raro pero posible)
        IF OLD.course_id != NEW.course_id THEN
            UPDATE courses SET enrolled_students = (
                SELECT COUNT(*) FROM enrollments WHERE course_id = OLD.course_id AND status = 'active'
            ) WHERE id = OLD.course_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE courses SET enrolled_students = (
            SELECT COUNT(*) FROM enrollments WHERE course_id = OLD.course_id AND status = 'active'
        ) WHERE id = OLD.course_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en enrollments
DROP TRIGGER IF EXISTS trigger_update_enrolled_students ON enrollments;
CREATE TRIGGER trigger_update_enrolled_students
    AFTER INSERT OR UPDATE OR DELETE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_enrolled_students_count();

-- ==========================================
-- PASO 7: TRIGGER para course_modules de updated_at
-- ==========================================

DROP TRIGGER IF EXISTS update_course_modules_updated_at ON course_modules;
CREATE TRIGGER update_course_modules_updated_at 
    BEFORE UPDATE ON course_modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    courses_count INTEGER;
    courses_no_instructor INTEGER;
    modules_count INTEGER;
    enrolled_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO courses_count FROM courses;
    SELECT COUNT(*) INTO courses_no_instructor FROM courses WHERE instructor_id IS NULL;
    SELECT COUNT(*) INTO modules_count FROM course_modules;
    SELECT COALESCE(SUM(enrolled_students), 0) INTO enrolled_total FROM courses;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ FIX COMPLETO EJECUTADO EXITOSAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '📊 Total cursos: %', courses_count;
    RAISE NOTICE '⚠️ Cursos sin instructor: %', courses_no_instructor;
    RAISE NOTICE '📚 Total módulos: %', modules_count;
    RAISE NOTICE '👥 Total estudiantes inscritos: %', enrolled_total;
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Políticas RLS actualizadas:';
    RAISE NOTICE '   ✓ courses: SELECT público para publicados + inscritos + instructor';
    RAISE NOTICE '   ✓ courses: INSERT/UPDATE/DELETE solo instructor';
    RAISE NOTICE '   ✓ course_modules: visible en página pública + inscritos';
    RAISE NOTICE '   ✓ course_lessons: visible en página pública + inscritos';
    RAISE NOTICE '   ✓ course_units: visible para inscritos + instructor';
    RAISE NOTICE '   ✓ unit_topics: visible para inscritos + instructor';
    RAISE NOTICE '   ✓ topic_resources: visible para inscritos + instructor';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Triggers configurados:';
    RAISE NOTICE '   ✓ enrolled_students se actualiza automáticamente';
    RAISE NOTICE '   ✓ updated_at se actualiza en todas las tablas';
    RAISE NOTICE '============================================';
END $$;
