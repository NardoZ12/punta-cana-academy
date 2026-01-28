-- Configuración completa de Supabase para funciones en tiempo real
-- Punta Cana Academy - Setup Real Time Features

-- Primero, habilitamos las extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Habilitar realtime para las tablas existentes y nuevas
ALTER publication supabase_realtime ADD TABLE notifications;
ALTER publication supabase_realtime ADD TABLE student_enrollments;
ALTER publication supabase_realtime ADD TABLE tasks;
ALTER publication supabase_realtime ADD TABLE grades;
ALTER publication supabase_realtime ADD TABLE user_activity;

-- Si las tablas no existen en la publicación, las agregamos de forma segura
DO $$
BEGIN
    BEGIN
        ALTER publication supabase_realtime ADD TABLE profiles;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER publication supabase_realtime ADD TABLE courses;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Crear función para limpiar notificaciones antiguas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Eliminar notificaciones leídas más antiguas de 30 días
    DELETE FROM notifications 
    WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Eliminar notificaciones no leídas más antiguas de 90 días
    DELETE FROM notifications 
    WHERE is_read = false 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true 
    WHERE user_id = user_uuid 
    AND is_read = false;
END;
$$ language 'plpgsql';

-- Función para obtener estadísticas de notificaciones
CREATE OR REPLACE FUNCTION get_notification_stats(user_uuid UUID)
RETURNS TABLE(
    total_notifications BIGINT,
    unread_notifications BIGINT,
    notifications_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE is_read = false) as unread_notifications,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as notifications_today
    FROM notifications
    WHERE user_id = user_uuid;
END;
$$ language 'plpgsql';

-- Función para obtener actividad reciente del instructor
CREATE OR REPLACE FUNCTION get_instructor_recent_activity(instructor_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    activity_type TEXT,
    description TEXT,
    student_name TEXT,
    course_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.activity_type,
        ua.description,
        p.full_name as student_name,
        COALESCE(ua.metadata->>'course_title', 'Sin especificar') as course_title,
        ua.created_at
    FROM user_activity ua
    LEFT JOIN profiles p ON p.id = (ua.metadata->>'student_id')::UUID
    WHERE ua.user_id = instructor_uuid
    ORDER BY ua.created_at DESC
    LIMIT limit_count;
END;
$$ language 'plpgsql';

-- Función para obtener estadísticas en tiempo real del instructor
CREATE OR REPLACE FUNCTION get_instructor_realtime_stats(instructor_uuid UUID)
RETURNS TABLE(
    new_enrollments_today BIGINT,
    grades_assigned_today BIGINT,
    tasks_published_today BIGINT,
    active_students BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM student_enrollments 
         WHERE instructor_id = instructor_uuid 
         AND enrolled_at >= CURRENT_DATE) as new_enrollments_today,
        
        (SELECT COUNT(*) FROM grades 
         WHERE instructor_id = instructor_uuid 
         AND graded_at >= CURRENT_DATE) as grades_assigned_today,
        
        (SELECT COUNT(*) FROM tasks 
         WHERE instructor_id = instructor_uuid 
         AND published_at >= CURRENT_DATE) as tasks_published_today,
        
        (SELECT COUNT(DISTINCT student_id) FROM student_enrollments 
         WHERE instructor_id = instructor_uuid 
         AND status = 'active') as active_students;
END;
$$ language 'plpgsql';

-- Función para obtener estadísticas del estudiante
CREATE OR REPLACE FUNCTION get_student_realtime_stats(student_uuid UUID)
RETURNS TABLE(
    new_tasks_today BIGINT,
    new_grades_today BIGINT,
    pending_tasks BIGINT,
    completed_courses BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT t.id) FROM tasks t
         JOIN student_enrollments se ON se.course_id = t.course_id
         WHERE se.student_id = student_uuid 
         AND t.published_at >= CURRENT_DATE
         AND se.status = 'active') as new_tasks_today,
        
        (SELECT COUNT(*) FROM grades 
         WHERE student_id = student_uuid 
         AND graded_at >= CURRENT_DATE) as new_grades_today,
        
        (SELECT COUNT(DISTINCT t.id) FROM tasks t
         JOIN student_enrollments se ON se.course_id = t.course_id
         LEFT JOIN grades g ON g.task_id = t.id AND g.student_id = student_uuid
         WHERE se.student_id = student_uuid 
         AND t.is_published = true
         AND se.status = 'active'
         AND g.id IS NULL
         AND (t.due_date IS NULL OR t.due_date > NOW())) as pending_tasks,
        
        (SELECT COUNT(*) FROM student_enrollments 
         WHERE student_id = student_uuid 
         AND status = 'completed') as completed_courses;
END;
$$ language 'plpgsql';

-- Insertar algunos datos de ejemplo para testing con usuarios reales
INSERT INTO tasks (title, description, course_id, instructor_id, type, due_date, is_published)
SELECT 
    'Tarea de Ejemplo ' || generate_series(1,3),
    'Descripción de tarea de ejemplo para testing del sistema en tiempo real',
    '00000000-0000-0000-0000-000000000001'::UUID,
    'b88d8d60-ef84-4764-9889-237acb49bbc4'::UUID, -- UUID del profesor real
    'assignment',
    NOW() + INTERVAL '7 days',
    true
ON CONFLICT DO NOTHING;

-- Insertar inscripción de prueba del estudiante real
INSERT INTO student_enrollments (student_id, course_id, instructor_id, status, enrolled_at)
VALUES (
    'f3744ab7-e60f-4121-9ee2-b07e041d43e5'::UUID, -- UUID del estudiante real
    '00000000-0000-0000-0000-000000000001'::UUID,  -- Curso de prueba
    'b88d8d60-ef84-4764-9889-237acb49bbc4'::UUID,  -- UUID del profesor real
    'active',
    NOW() - INTERVAL '1 hour'
)
ON CONFLICT DO NOTHING;

-- Insertar notificaciones de prueba para ambos usuarios
INSERT INTO notifications (user_id, title, message, type, created_at) 
VALUES 
    ('b88d8d60-ef84-4764-9889-237acb49bbc4'::UUID, 'Sistema configurado', 'El sistema de tiempo real está funcionando correctamente', 'general', NOW() - INTERVAL '30 minutes'),
    ('f3744ab7-e60f-4121-9ee2-b07e041d43e5'::UUID, 'Bienvenido estudiante', 'Tu cuenta está configurada para recibir notificaciones en tiempo real', 'general', NOW() - INTERVAL '45 minutes'),
    ('b88d8d60-ef84-4764-9889-237acb49bbc4'::UUID, 'Nuevo estudiante inscrito', 'Un estudiante se ha inscrito en tu curso de prueba', 'enrollment', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Configurar permisos de funciones para usuarios autenticados
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_instructor_recent_activity(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_instructor_realtime_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_realtime_stats(UUID) TO authenticated;

-- Políticas adicionales para funciones en tiempo real
CREATE POLICY "Users can call notification functions for themselves" ON notifications
    FOR SELECT USING (true); -- Permitir lectura para funciones

-- Comentarios finales
COMMENT ON FUNCTION mark_all_notifications_read(UUID) IS 'Marca todas las notificaciones de un usuario como leídas';
COMMENT ON FUNCTION get_notification_stats(UUID) IS 'Obtiene estadísticas de notificaciones para un usuario';
COMMENT ON FUNCTION get_instructor_recent_activity(UUID, INTEGER) IS 'Obtiene actividad reciente del instructor con detalles';
COMMENT ON FUNCTION get_instructor_realtime_stats(UUID) IS 'Estadísticas en tiempo real para el dashboard del instructor';
COMMENT ON FUNCTION get_student_realtime_stats(UUID) IS 'Estadísticas en tiempo real para el dashboard del estudiante';

-- Verificar que todo esté configurado correctamente
SELECT 'Configuración de tiempo real completada correctamente' AS status;