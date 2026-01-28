-- =====================================================
-- VERIFICACIÓN COMPLETA DEL LMS
-- Ejecutar para confirmar que todo funciona
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    course_count INTEGER;
    policy_count INTEGER;
    trigger_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Verificar tablas principales
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'profiles', 'courses', 'course_lessons', 'enrollments', 
        'notification_settings', 'lesson_progress', 'assignments', 
        'assignment_submissions', 'exams', 'exam_questions', 'exam_submissions'
    );
    
    -- Verificar cursos de ejemplo
    SELECT COUNT(*) INTO course_count FROM courses;
    
    -- Verificar políticas RLS
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Verificar triggers
    SELECT COUNT(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND trigger_name LIKE '%updated_at%';
    
    -- Verificar índices
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    -- Mostrar resumen completo
    RAISE NOTICE '🎉 ========== VERIFICACIÓN COMPLETA DEL LMS ==========';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLAS PRINCIPALES: % de 11 esperadas', table_count;
    RAISE NOTICE '📚 CURSOS DE EJEMPLO: %', course_count;
    RAISE NOTICE '🔒 POLÍTICAS DE SEGURIDAD: %', policy_count;
    RAISE NOTICE '⚡ TRIGGERS AUTOMÁTICOS: %', trigger_count;
    RAISE NOTICE '🚀 ÍNDICES DE RENDIMIENTO: %', index_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ FUNCIONALIDADES DISPONIBLES:';
    RAISE NOTICE '   👥 Gestión de usuarios (estudiantes, profesores, admin)';
    RAISE NOTICE '   📚 Cursos completos con lecciones';
    RAISE NOTICE '   📝 Sistema de tareas y envíos';
    RAISE NOTICE '   📊 Exámenes con preguntas y calificaciones';
    RAISE NOTICE '   📈 Seguimiento de progreso de estudiantes';
    RAISE NOTICE '   🔔 Sistema de notificaciones personalizable';
    RAISE NOTICE '   📱 Inscripciones y gestión de cursos';
    RAISE NOTICE '   🔐 Seguridad por filas (RLS)';
    RAISE NOTICE '';
    
    IF table_count = 11 AND course_count >= 3 AND policy_count > 15 THEN
        RAISE NOTICE '🎊 ¡PLATAFORMA LMS COMPLETAMENTE FUNCIONAL!';
        RAISE NOTICE '🚀 Lista para comenzar a desarrollar el frontend';
    ELSE
        RAISE NOTICE '⚠️ Algunas funcionalidades pueden estar incompletas';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASOS:';
    RAISE NOTICE '   1. Conectar tu aplicación Next.js a Supabase';
    RAISE NOTICE '   2. Configurar autenticación de usuarios';
    RAISE NOTICE '   3. Crear interfaces para estudiantes y profesores';
    RAISE NOTICE '   4. Implementar dashboard y funcionalidades';
END $$;

-- =====================================================
-- DATOS ADICIONALES DE PRUEBA (OPCIONAL)
-- =====================================================

-- Agregar algunas lecciones de ejemplo al curso de JavaScript
INSERT INTO course_lessons (course_id, title, content, order_in_course, duration_minutes, is_preview)
SELECT 
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Introducción a Variables',
    'En esta lección aprenderás sobre variables en JavaScript: var, let y const.',
    1,
    15,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM course_lessons 
    WHERE course_id = '550e8400-e29b-41d4-a716-446655440001'::uuid 
    AND order_in_course = 1
);

INSERT INTO course_lessons (course_id, title, content, order_in_course, duration_minutes)
SELECT 
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Funciones en JavaScript',
    'Aprende a crear y utilizar funciones para organizar tu código.',
    2,
    20
WHERE NOT EXISTS (
    SELECT 1 FROM course_lessons 
    WHERE course_id = '550e8400-e29b-41d4-a716-446655440001'::uuid 
    AND order_in_course = 2
);

INSERT INTO course_lessons (course_id, title, content, order_in_course, duration_minutes)
SELECT 
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Objetos y Arrays',
    'Manipulación de estructuras de datos complejas en JavaScript.',
    3,
    25
WHERE NOT EXISTS (
    SELECT 1 FROM course_lessons 
    WHERE course_id = '550e8400-e29b-41d4-a716-446655440001'::uuid 
    AND order_in_course = 3
);

DO $$
DECLARE
    lesson_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO lesson_count FROM course_lessons;
    RAISE NOTICE '📖 Lecciones de ejemplo agregadas: %', lesson_count;
END $$;