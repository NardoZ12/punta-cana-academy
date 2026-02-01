-- =================================================================
-- CONFIGURACIÓN DE STORAGE PARA TAREAS (ASSIGNMENTS)
-- =================================================================

-- 1. Crear el bucket 'assignments' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assignments', 
    'assignments', 
    true, -- Public para facilitar la descarga, pero protegido por RLS para la subida/modificación
    10485760, -- Límite de 10MB (en bytes)
    '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,application/zip}' -- Tipos permitidos
)
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Habilitar RLS en la tabla de objetos (por si acaso no está)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE SEGURIDAD (RLS)

-- Política: Los estudiantes pueden subir archivos a su propia carpeta
-- Estructura de carpeta: {course_id}/{assignment_id}/{student_id}/{filename}
CREATE POLICY "Students can upload own assignment submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignments' AND
    (storage.foldername(name))[3] = auth.uid()::text
);

-- Política: Los estudiantes pueden ver/descargar sus propios archivos
CREATE POLICY "Students can view own assignment submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignments' AND
    (storage.foldername(name))[3] = auth.uid()::text
);

-- Política: Los profesores pueden ver todos los archivos (simplificado para cualquier profesor autenticado, 
-- idealmente se refinaría para verificar si es el instructor del curso, pero requiere cruce complejo con tablas public)
CREATE POLICY "Teachers can view all assignment submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignments' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('teacher', 'admin'))
);