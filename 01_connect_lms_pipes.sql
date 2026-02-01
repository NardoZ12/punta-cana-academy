/*
  MIGRACIÓN: CONECTAR TUBERÍAS LMS (Enrollments, Assignments, Submissions, Notifications)
  --------------------------------------------------------------------------------------
  Objetivo: Establecer el flujo completo de datos entre Profesor y Estudiante.
*/

-- Habilitar extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. TABLA ENROLLMENTS (Inscripciones)
-- =================================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- RLS: Seguridad para Enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Estudiantes ven sus inscripciones" ON enrollments;
CREATE POLICY "Estudiantes ven sus inscripciones" 
ON enrollments FOR SELECT 
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Profesores ven inscritos en sus cursos" ON enrollments;
CREATE POLICY "Profesores ven inscritos en sus cursos" 
ON enrollments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = enrollments.course_id 
        AND courses.instructor_id = auth.uid()
    )
);

-- =================================================================
-- 2. TABLA ASSIGNMENTS (Tareas y Exámenes)
-- =================================================================
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type VARCHAR(10) CHECK (type IN ('task', 'quiz')) NOT NULL,
    content JSONB DEFAULT '{}'::jsonb, -- Aquí van las preguntas del quiz o instrucciones
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Seguridad para Assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Estudiantes ven tareas de sus cursos activos" ON assignments;
CREATE POLICY "Estudiantes ven tareas de sus cursos activos" 
ON assignments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM enrollments 
        WHERE enrollments.course_id = assignments.course_id 
        AND enrollments.student_id = auth.uid()
        AND enrollments.status = 'active'
    )
);

DROP POLICY IF EXISTS "Profesores gestionan tareas de sus cursos" ON assignments;
CREATE POLICY "Profesores gestionan tareas de sus cursos" 
ON assignments FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = assignments.course_id 
        AND courses.instructor_id = auth.uid()
    )
);

-- =================================================================
-- 3. TABLA SUBMISSIONS (Entregas)
-- =================================================================
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_url TEXT,
    answers JSONB, -- Respuestas del quiz
    grade INTEGER, -- Nota numérica (0-100)
    feedback TEXT, -- Feedback del profesor
    status VARCHAR(20) CHECK (status IN ('pending', 'submitted', 'graded')) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- RLS: Seguridad Estricta para Submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Estudiantes ven SOLO sus propias entregas" ON submissions;
CREATE POLICY "Estudiantes ven SOLO sus propias entregas" 
ON submissions FOR SELECT 
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Estudiantes crean sus entregas" ON submissions;
CREATE POLICY "Estudiantes crean sus entregas" 
ON submissions FOR INSERT 
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Estudiantes editan entregas no calificadas" ON submissions;
CREATE POLICY "Estudiantes editan entregas no calificadas" 
ON submissions FOR UPDATE 
USING (auth.uid() = student_id AND status != 'graded');

DROP POLICY IF EXISTS "Profesores ven todas las entregas de sus cursos" ON submissions;
CREATE POLICY "Profesores ven todas las entregas de sus cursos" 
ON submissions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE a.id = submissions.assignment_id 
        AND c.instructor_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Profesores califican entregas" ON submissions;
CREATE POLICY "Profesores califican entregas" 
ON submissions FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE a.id = submissions.assignment_id 
        AND c.instructor_id = auth.uid()
    )
);

-- =================================================================
-- 4. TABLA NOTIFICATIONS (Campana)
-- =================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(20) CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios gestionan sus notificaciones" ON notifications;
CREATE POLICY "Usuarios gestionan sus notificaciones" 
ON notifications FOR ALL 
USING (auth.uid() = user_id);

-- =================================================================
-- 5. AUTOMATIZACIÓN (Triggers)
-- =================================================================

-- Trigger: Notificar al estudiante cuando recibe una nota
CREATE OR REPLACE FUNCTION notify_on_grade() RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status != 'graded' AND NEW.status = 'graded') OR (OLD.grade IS NULL AND NEW.grade IS NOT NULL) THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        SELECT NEW.student_id, 'Nueva Calificación 🎓', 'Tu entrega en "' || a.title || '" ha sido calificada. Nota: ' || NEW.grade, 'success', '/dashboard/student/assignments'
        FROM assignments a WHERE a.id = NEW.assignment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_submission_graded ON submissions;
CREATE TRIGGER on_submission_graded AFTER UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION notify_on_grade();