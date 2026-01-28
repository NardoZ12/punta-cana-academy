-- =====================================================
-- PASO 3: INSERTAR DATOS DE EJEMPLO
-- Ejecutar DESPUÉS del PASO 1 y PASO 2
-- =====================================================

-- Insertar cursos de ejemplo con UUID del profesor
DO $$
DECLARE
    instructor_user_id UUID := 'b88d8d60-ef84-4764-9889-237acb49bbc4'::uuid;
BEGIN
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = instructor_user_id) THEN
        RAISE NOTICE '❌ Error: El usuario instructor % no existe en auth.users', instructor_user_id;
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Usuario válido. Creando cursos de ejemplo...';
    
    -- Curso 1: JavaScript
    INSERT INTO courses (id, title, description, instructor_id, price, level, category, image_url, is_published, duration_hours)
    VALUES 
        ('550e8400-e29b-41d4-a716-446655440001'::uuid,
         'Introducción a JavaScript',
         'Aprende los fundamentos de JavaScript desde cero',
         instructor_user_id,
         99.99,
         'beginner',
         'Programming',
         'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
         true,
         20)
    ON CONFLICT (id) DO NOTHING;

    -- Curso 2: React
    INSERT INTO courses (id, title, description, instructor_id, price, level, category, image_url, is_published, duration_hours)
    VALUES 
        ('550e8400-e29b-41d4-a716-446655440002'::uuid,
         'React para Principiantes',
         'Construye aplicaciones web modernas con React',
         instructor_user_id,
         149.99,
         'intermediate',
         'Web Development',
         'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
         true,
         30)
    ON CONFLICT (id) DO NOTHING;

    -- Curso 3: Python
    INSERT INTO courses (id, title, description, instructor_id, price, level, category, image_url, is_published, duration_hours)
    VALUES 
        ('550e8400-e29b-41d4-a716-446655440003'::uuid,
         'Python Avanzado',
         'Técnicas avanzadas de programación en Python',
         instructor_user_id,
         199.99,
         'advanced',
         'Data Science',
         'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
         true,
         40)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '📚 Cursos de ejemplo creados exitosamente con instructor: %', instructor_user_id;
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error al crear cursos: %', SQLERRM;
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    course_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO course_count FROM courses;
    
    RAISE NOTICE '✅ PASO 3 COMPLETADO - Datos de ejemplo insertados';
    RAISE NOTICE '📚 Total de cursos en la base de datos: %', course_count;
    RAISE NOTICE '🚀 ¡Base de datos completamente configurada y lista para usar!';
END $$;