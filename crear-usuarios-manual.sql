-- Script SQL para crear usuarios de prueba MANUALMENTE en Supabase
-- Ejecutar en Supabase Dashboard > SQL Editor

-- =====================================================
-- CREAR USUARIOS DE PRUEBA MANUALMENTE
-- =====================================================

-- 1. Primero verificar que las tablas existen
SELECT 'Verificando tablas...' as status;
SELECT count(*) as profiles_count FROM profiles;

-- 2. Insertar usuarios de prueba directamente en la tabla profiles
-- Nota: Normalmente esto se haría con auth.users primero, pero para pruebas
-- vamos a crear los perfiles directamente

-- Generar UUIDs únicos para los usuarios
DO $$
DECLARE
    teacher_id UUID := gen_random_uuid();
    student1_id UUID := gen_random_uuid();
    student2_id UUID := gen_random_uuid();
BEGIN
    -- Insertar profesor
    INSERT INTO profiles (
        id,
        full_name,
        user_type,
        phone,
        language,
        created_at,
        updated_at
    ) VALUES (
        teacher_id,
        'Carlos Martínez',
        'teacher',
        '+1-809-555-0101',
        'es',
        NOW(),
        NOW()
    );

    -- Insertar estudiante 1
    INSERT INTO profiles (
        id,
        full_name,
        user_type,
        phone,
        language,
        created_at,
        updated_at
    ) VALUES (
        student1_id,
        'María García',
        'student',
        '+1-809-555-0102',
        'es',
        NOW(),
        NOW()
    );

    -- Insertar estudiante 2
    INSERT INTO profiles (
        id,
        full_name,
        user_type,
        phone,
        language,
        created_at,
        updated_at
    ) VALUES (
        student2_id,
        'Juan Pérez',
        'student',
        '+1-809-555-0103',
        'es',
        NOW(),
        NOW()
    );

    -- Mostrar información de los usuarios creados
    RAISE NOTICE 'Usuarios creados con IDs:';
    RAISE NOTICE 'Profesor (Carlos): %', teacher_id;
    RAISE NOTICE 'Estudiante 1 (María): %', student1_id;
    RAISE NOTICE 'Estudiante 2 (Juan): %', student2_id;
END $$;

-- 3. Verificar que los usuarios se crearon correctamente
SELECT 'USUARIOS CREADOS:' as info;
SELECT 
    id,
    full_name,
    user_type,
    phone,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- 4. Contar usuarios totales
SELECT 'TOTAL DE USUARIOS:' as info, count(*) as total FROM profiles;

-- =====================================================
-- CREAR ALGUNOS DATOS DE EJEMPLO
-- =====================================================

-- Crear curso de ejemplo
INSERT INTO courses (
    id,
    title,
    description,
    level,
    duration_hours,
    price,
    is_active,
    instructor_id,
    created_at
) VALUES (
    gen_random_uuid(),
    'Introducción a la Programación',
    'Curso básico de programación para principiantes',
    'beginner',
    40,
    199.99,
    true,
    (SELECT id FROM profiles WHERE user_type = 'teacher' LIMIT 1),
    NOW()
) ON CONFLICT DO NOTHING;

-- Enrollar estudiantes en el curso
INSERT INTO course_enrollments (
    id,
    user_id,
    course_id,
    enrollment_date,
    status,
    created_at
) 
SELECT 
    gen_random_uuid(),
    p.id,
    c.id,
    NOW(),
    'active',
    NOW()
FROM profiles p
CROSS JOIN courses c
WHERE p.user_type = 'student'
ON CONFLICT DO NOTHING;

SELECT 'SETUP COMPLETO - Usuarios y datos de ejemplo creados!' as resultado;