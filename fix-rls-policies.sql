-- Script para arreglar las políticas RLS que están bloqueando el registro
-- Ejecutar en Supabase SQL Editor

-- 1. Ver las políticas actuales de la tabla profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 2. Deshabilitar RLS temporalmente para poder insertar datos (SOLO PARA DESARROLLO)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. O mejor, crear/actualizar políticas que permitan registro
-- Política para permitir que los usuarios puedan crear sus propios perfiles
CREATE POLICY "Users can create their own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Política para permitir que los usuarios lean sus propios perfiles
CREATE POLICY "Users can read their own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Política para permitir que los usuarios actualicen sus propios perfiles
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Política para permitir que los profesores y admins vean todos los perfiles
CREATE POLICY "Teachers and admins can read all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.user_type IN ('teacher', 'admin')
        )
    );

-- 4. Si quieres rehabilitar RLS después de crear las políticas
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Ver el estado actual de RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';