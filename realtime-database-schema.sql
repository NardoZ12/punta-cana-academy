-- Schema de base de datos para funcionalidades en tiempo real
-- Punta Cana Academy - Real Time Features

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'enrollment', 'grade_updated', 'task_assigned', 
    'course_published', 'lesson_completed', 'general'
  )),
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de inscripciones con timestamps detallados para tiempo real
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress DECIMAL(5,2) DEFAULT 0.00,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tareas mejorada para tiempo real
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  course_id UUID NOT NULL,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'assignment' CHECK (type IN ('assignment', 'quiz', 'exam', 'project')),
  due_date TIMESTAMP WITH TIME ZONE,
  max_score INTEGER DEFAULT 100,
  instructions TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de calificaciones con timestamps para tiempo real
CREATE TABLE IF NOT EXISTS grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL DEFAULT 100,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, task_id)
);

-- Tabla de actividad de usuarios para tiempo real
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50), -- 'course', 'task', 'grade', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas en tiempo real
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON student_enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_instructor ON student_enrollments(instructor_id, enrolled_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_course ON student_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_instructor ON tasks(instructor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_course ON tasks(course_id, is_published);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id, graded_at DESC);
CREATE INDEX IF NOT EXISTS idx_grades_instructor ON grades(instructor_id, graded_at DESC);
CREATE INDEX IF NOT EXISTS idx_grades_task ON grades(task_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type, created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_enrollments_updated_at ON student_enrollments;
CREATE TRIGGER update_student_enrollments_updated_at 
    BEFORE UPDATE ON student_enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
CREATE TRIGGER update_grades_updated_at 
    BEFORE UPDATE ON grades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear notificaciones automáticamente
CREATE OR REPLACE FUNCTION create_notification_for_new_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificación al instructor
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (
        NEW.instructor_id,
        'Nuevo estudiante inscrito',
        'Un estudiante se ha inscrito en uno de tus cursos',
        'enrollment',
        jsonb_build_object(
            'enrollment_id', NEW.id,
            'student_id', NEW.student_id,
            'course_id', NEW.course_id
        )
    );
    
    -- Registrar actividad
    INSERT INTO user_activity (user_id, activity_type, description, entity_type, entity_id, metadata)
    VALUES (
        NEW.student_id,
        'course_enrollment',
        'Estudiante se inscribió en un curso',
        'enrollment',
        NEW.id,
        jsonb_build_object('course_id', NEW.course_id, 'instructor_id', NEW.instructor_id)
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para crear notificaciones de nuevas calificaciones
CREATE OR REPLACE FUNCTION create_notification_for_new_grade()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificación al estudiante
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (
        NEW.student_id,
        'Nueva calificación disponible',
        'Has recibido una nueva calificación: ' || NEW.score || '/' || NEW.max_score,
        'grade_updated',
        jsonb_build_object(
            'grade_id', NEW.id,
            'task_id', NEW.task_id,
            'score', NEW.score,
            'max_score', NEW.max_score
        )
    );
    
    -- Registrar actividad
    INSERT INTO user_activity (user_id, activity_type, description, entity_type, entity_id, metadata)
    VALUES (
        NEW.instructor_id,
        'grade_assigned',
        'Calificación asignada a estudiante',
        'grade',
        NEW.id,
        jsonb_build_object('student_id', NEW.student_id, 'score', NEW.score)
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para crear notificaciones de nuevas tareas
CREATE OR REPLACE FUNCTION create_notification_for_published_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo crear notificación si la tarea se acaba de publicar
    IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
        -- Insertar notificaciones para todos los estudiantes del curso
        INSERT INTO notifications (user_id, title, message, type, metadata)
        SELECT 
            se.student_id,
            'Nueva tarea asignada',
            'Se ha asignado una nueva tarea: ' || NEW.title,
            'task_assigned',
            jsonb_build_object(
                'task_id', NEW.id,
                'course_id', NEW.course_id,
                'due_date', NEW.due_date
            )
        FROM student_enrollments se
        WHERE se.course_id = NEW.course_id 
        AND se.status = 'active';
        
        -- Actualizar published_at
        NEW.published_at = NOW();
        
        -- Registrar actividad
        INSERT INTO user_activity (user_id, activity_type, description, entity_type, entity_id, metadata)
        VALUES (
            NEW.instructor_id,
            'task_published',
            'Tarea publicada: ' || NEW.title,
            'task',
            NEW.id,
            jsonb_build_object('course_id', NEW.course_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para notificaciones automáticas
DROP TRIGGER IF EXISTS trigger_new_enrollment_notification ON student_enrollments;
CREATE TRIGGER trigger_new_enrollment_notification
    AFTER INSERT ON student_enrollments
    FOR EACH ROW EXECUTE FUNCTION create_notification_for_new_enrollment();

DROP TRIGGER IF EXISTS trigger_new_grade_notification ON grades;
CREATE TRIGGER trigger_new_grade_notification
    AFTER INSERT ON grades
    FOR EACH ROW EXECUTE FUNCTION create_notification_for_new_grade();

DROP TRIGGER IF EXISTS trigger_published_task_notification ON tasks;
CREATE TRIGGER trigger_published_task_notification
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION create_notification_for_published_task();

-- Habilitar Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificaciones
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para inscripciones
CREATE POLICY "Students can view their own enrollments" ON student_enrollments
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view enrollments in their courses" ON student_enrollments
    FOR SELECT USING (auth.uid() = instructor_id);

CREATE POLICY "Students can create enrollments for themselves" ON student_enrollments
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Políticas RLS para tareas
CREATE POLICY "Instructors can manage their own tasks" ON tasks
    FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Students can view published tasks in their courses" ON tasks
    FOR SELECT USING (
        is_published = true AND 
        course_id IN (
            SELECT course_id FROM student_enrollments 
            WHERE student_id = auth.uid() AND status = 'active'
        )
    );

-- Políticas RLS para calificaciones
CREATE POLICY "Students can view their own grades" ON grades
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Instructors can manage grades they assign" ON grades
    FOR ALL USING (auth.uid() = instructor_id);

-- Políticas RLS para actividad de usuarios
CREATE POLICY "Users can view their own activity" ON user_activity
    FOR SELECT USING (auth.uid() = user_id);

-- Datos de prueba para testing
INSERT INTO notifications (user_id, title, message, type, created_at) 
VALUES 
    ((SELECT id FROM auth.users LIMIT 1), 'Bienvenido al sistema', 'Sistema de tiempo real configurado correctamente', 'general', NOW() - INTERVAL '1 hour'),
    ((SELECT id FROM auth.users LIMIT 1), 'Nueva función disponible', 'Las notificaciones en tiempo real están activas', 'general', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE notifications IS 'Tabla de notificaciones del sistema con soporte para tiempo real';
COMMENT ON TABLE student_enrollments IS 'Inscripciones de estudiantes con tracking detallado para tiempo real';
COMMENT ON TABLE tasks IS 'Tareas y asignaciones con estado de publicación para notificaciones automáticas';
COMMENT ON TABLE grades IS 'Calificaciones con notificaciones automáticas a estudiantes';
COMMENT ON TABLE user_activity IS 'Log de actividad de usuarios para análisis y tiempo real';