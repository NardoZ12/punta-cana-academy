-- Script CORREGIDO para ARREGLAR políticas RLS que bloquean el trigger
-- Soluciona el error "policy already exists" eliminando TODAS las políticas conflictivas
-- Ejecutar en Supabase SQL Editor

-- Temporalmente deshabilitar RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes que podrían causar conflictos (seguro)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for trigger" ON public.profiles;

-- Crear política SELECT (ver perfiles propios)
CREATE POLICY "Enable read access for own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Crear política UPDATE (actualizar perfil propio)
CREATE POLICY "Enable update for own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Crear política INSERT que permite al usuario autenticado insertar su propio perfil
-- y también permite inserts cuando auth.uid() IS NULL (útil para triggers)
CREATE POLICY "Enable insert for authenticated users" ON public.profiles
  FOR INSERT TO authenticated, anon
  WITH CHECK (
    ((SELECT auth.uid()) = id)
    OR
    ((SELECT auth.uid()) IS NULL)
  );

-- (Opcional) Política permisiva para funciones SECURITY DEFINER que deben bypass checks
-- Solo mantener si realmente necesitas que triggers/funciones puedan insertar libremente
CREATE POLICY "Enable insert for trigger" ON public.profiles
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Re-habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verificar las políticas creadas
SELECT 'POLÍTICAS RLS ACTUALIZADAS:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd;

SELECT 'PROBLEMA RLS RESUELTO - Prueba el registro ahora' as resultado;