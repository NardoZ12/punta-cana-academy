-- =====================================================
-- SCRIPT DE DEBUG: CREAR TABLAS UNA POR UNA
-- Ejecutar este archivo para diagnosticar el problema
-- =====================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar si las tablas ya existen
DO $$
BEGIN
    RAISE NOTICE 'Verificando tablas existentes...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        RAISE NOTICE '⚠️ La tabla courses ya existe';
    ELSE
        RAISE NOTICE '✅ La tabla courses no existe, procederemos a crearla';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE '⚠️ La tabla profiles ya existe';
    ELSE
        RAISE NOTICE '✅ La tabla profiles no existe, procederemos a crearla';
    END IF;
END $$;

-- Crear tabla profiles primero (más simple)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    user_type TEXT DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verificar que profiles se creó correctamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE '✅ Tabla profiles creada exitosamente';
    ELSE
        RAISE NOTICE '❌ Error: No se pudo crear la tabla profiles';
    END IF;
END $$;

-- Crear tabla courses (simplificada)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID,
    price DECIMAL(10,2) DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verificar que courses se creó correctamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        RAISE NOTICE '✅ Tabla courses creada exitosamente';
        
        -- Verificar que la columna instructor_id existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'courses' AND column_name = 'instructor_id'
        ) THEN
            RAISE NOTICE '✅ Columna instructor_id existe en courses';
        ELSE
            RAISE NOTICE '❌ Error: Columna instructor_id NO existe en courses';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Error: No se pudo crear la tabla courses';
    END IF;
END $$;

-- Verificar y agregar columna instructor_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'instructor_id'
    ) THEN
        RAISE NOTICE '⚠️ La columna instructor_id no existe. Agregándola...';
        ALTER TABLE courses ADD COLUMN instructor_id UUID;
        RAISE NOTICE '✅ Columna instructor_id agregada a courses';
    ELSE
        RAISE NOTICE '✅ La columna instructor_id ya existe en courses';
    END IF;
END $$;

-- Ahora agregar la foreign key constraint por separado
DO $$
BEGIN
    -- Verificar si la constraint ya existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_courses_instructor' 
        AND table_name = 'courses'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT fk_courses_instructor 
        FOREIGN KEY (instructor_id) REFERENCES auth.users(id);
        RAISE NOTICE '✅ Foreign key constraint agregada a instructor_id';
    ELSE
        RAISE NOTICE '⚠️ Foreign key constraint ya existe';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error al agregar foreign key: %', SQLERRM;
END $$;

-- Probar un INSERT simple para verificar que funciona
DO $$
DECLARE
    test_user_id UUID := 'b88d8d60-ef84-4764-9889-237acb49bbc4'::uuid;
BEGIN
    -- Verificar que el usuario existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
        RAISE NOTICE '✅ Usuario instructor existe, probando INSERT...';
        
        -- Intentar insertar un curso de prueba
        INSERT INTO courses (id, title, description, instructor_id, price)
        VALUES (
            '00000000-0000-0000-0000-000000000001'::uuid,
            'Curso de Prueba',
            'Este es un curso de prueba',
            test_user_id,
            0.00
        )
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
        
        RAISE NOTICE '✅ INSERT exitoso en tabla courses';
        
        -- Limpiar datos de prueba
        DELETE FROM courses WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
        RAISE NOTICE '✅ Datos de prueba limpiados';
        
    ELSE
        RAISE NOTICE '❌ El usuario instructor % no existe', test_user_id;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error durante la prueba: %', SQLERRM;
END $$;

DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNÓSTICO COMPLETADO';
    RAISE NOTICE 'Si ves errores arriba, el problema está identificado.';
    RAISE NOTICE 'Si todo está ✅, el problema puede estar en otro lado.';
END $$;