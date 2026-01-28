-- =====================================================
-- SCRIPT ULTRA SIMPLE - SOLO LO ESENCIAL
-- Este DEBE funcionar
-- =====================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- LIMPIAR POLÍTICAS EXISTENTES PRIMERO
-- =====================================================

DO $$
BEGIN
    -- Eliminar todas las políticas RLS que puedan estar causando problemas
    DROP POLICY IF EXISTS "Profesores gestionan sus módulos" ON course_modules;
    DROP POLICY IF EXISTS "Students can view lessons of enrolled courses" ON course_lessons;
    DROP POLICY IF EXISTS "Instructors can manage lessons of own courses" ON course_lessons;
    DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
    DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;
    
    RAISE NOTICE '🧹 Políticas existentes eliminadas';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Algunas políticas no existían: %', SQLERRM;
END $$;

-- =====================================================
-- ELIMINAR TABLAS SI EXISTEN (FORZANDO CON CASCADE)
-- =====================================================

DROP TABLE IF EXISTS exam_submissions CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS course_lessons CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;  -- Esta tabla puede existir
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;         -- FORZAR eliminación
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- CREAR TABLAS EN ORDEN CORRECTO
-- =====================================================

-- 1. Tabla de perfiles (simple)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    user_type TEXT DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de cursos (sin dependencias complejas)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES auth.users(id),
    price DECIMAL(10,2) DEFAULT 0,
    level TEXT DEFAULT 'beginner',
    category TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de lecciones
CREATE TABLE course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    order_in_course INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de inscripciones
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- =====================================================
-- INSERTAR DATOS DE PRUEBA
-- =====================================================

-- Insertar cursos de ejemplo
INSERT INTO courses (id, title, description, instructor_id, price, level, category, image_url, is_published)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001'::uuid,
     'Introducción a JavaScript',
     'Aprende los fundamentos de JavaScript desde cero',
     'b88d8d60-ef84-4764-9889-237acb49bbc4'::uuid,
     99.99,
     'beginner',
     'Programming',
     'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
     true),
     
    ('550e8400-e29b-41d4-a716-446655440002'::uuid,
     'React para Principiantes',
     'Construye aplicaciones web modernas con React',
     'b88d8d60-ef84-4764-9889-237acb49bbc4'::uuid,
     149.99,
     'intermediate',
     'Web Development',
     'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
     true),
     
    ('550e8400-e29b-41d4-a716-446655440003'::uuid,
     'Python Avanzado',
     'Técnicas avanzadas de programación en Python',
     'b88d8d60-ef84-4764-9889-237acb49bbc4'::uuid,
     199.99,
     'advanced',
     'Data Science',
     'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
     true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    course_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO course_count FROM courses;
    
    RAISE NOTICE '✅ ÉXITO TOTAL!';
    RAISE NOTICE '📊 Tablas creadas: profiles, courses, course_lessons, enrollments';
    RAISE NOTICE '📚 Cursos creados: %', course_count;
    RAISE NOTICE '🚀 Base básica lista. Ahora puedes expandir.';
END $$;