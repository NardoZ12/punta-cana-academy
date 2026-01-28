-- Script para ARREGLAR el trigger y evitar duplicados
-- El error "duplicate key value" significa que el usuario ya existe
-- Ejecutar en Supabase SQL Editor

-- Recrear la función del trigger con manejo de duplicados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Usar INSERT ... ON CONFLICT para evitar errores de duplicados
  INSERT INTO public.profiles (id, full_name, user_type, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'user_type', 'student'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(new.raw_user_meta_data->>'full_name', EXCLUDED.full_name),
    user_type = COALESCE(new.raw_user_meta_data->>'user_type', EXCLUDED.user_type),
    updated_at = now();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que la función se actualizó
SELECT 'TRIGGER ACTUALIZADO CON MANEJO DE DUPLICADOS' as resultado;

-- Opcional: Limpiar usuarios de prueba existentes para empezar limpio
-- (Descomenta las siguientes líneas si quieres empezar desde cero)

/*
-- Eliminar usuarios de prueba existentes
DELETE FROM public.profiles WHERE full_name IN ('Test User', 'User Test') OR id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%test%' OR email ILIKE '%prueba%'
);

-- También eliminar de auth.users si es necesario
-- (Solo descomenta si quieres eliminar completamente los usuarios de prueba)
-- DELETE FROM auth.users WHERE email ILIKE '%test%' OR email ILIKE '%prueba%';
*/

SELECT 'PROBLEMA DE DUPLICADOS RESUELTO - Prueba el registro ahora' as resultado;