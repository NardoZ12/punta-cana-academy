-- =====================================================
-- FIX: Asignar instructor_id a cursos sin instructor
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Ver cursos sin instructor_id asignado
SELECT id, title, instructor_id, created_at 
FROM courses 
WHERE instructor_id IS NULL;

-- 2. Ver profesores disponibles
SELECT p.id, p.full_name, p.user_type, a.email
FROM profiles p
JOIN auth.users a ON a.id = p.id
WHERE p.user_type = 'teacher';

-- 3. Asignar el primer profesor encontrado a cursos sin instructor
-- (Cambia el UUID si necesitas un profesor específico)
DO $$
DECLARE
    teacher_uuid UUID;
    updated_count INTEGER;
BEGIN
    -- Buscar el primer profesor
    SELECT p.id INTO teacher_uuid
    FROM profiles p
    WHERE p.user_type = 'teacher'
    LIMIT 1;

    IF teacher_uuid IS NULL THEN
        RAISE NOTICE '❌ No se encontró ningún profesor. Crea un perfil de profesor primero.';
        RETURN;
    END IF;

    -- Actualizar cursos sin instructor
    UPDATE courses 
    SET instructor_id = teacher_uuid 
    WHERE instructor_id IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ % cursos actualizados con instructor_id = %', updated_count, teacher_uuid;
END $$;

-- 4. Verificar que todos los cursos tienen instructor
SELECT id, title, instructor_id 
FROM courses 
ORDER BY created_at DESC;
