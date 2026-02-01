-- =================================================================
-- VISTA: ESTUDIANTES EN RIESGO
-- Identifica alumnos con promedio bajo (<70) o con tareas acumuladas (>2)
-- =================================================================

-- CORRECCIÓN DE ESQUEMA: Asegurar que la columna se llame 'grade' y no 'score'
DO $$
BEGIN
    -- Si existe la columna 'score' (de scripts anteriores), la renombramos a 'grade'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'score') THEN
        ALTER TABLE public.submissions RENAME COLUMN score TO grade;
    -- Si no existe 'grade' ni 'score', agregamos 'grade'
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'grade') THEN
        ALTER TABLE public.submissions ADD COLUMN grade NUMERIC(5,2);
    END IF;
END $$;

-- CORRECCIÓN DE ESQUEMA: Asegurar que la tabla profiles tenga email para la vista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Sincronizar emails desde auth.users si están vacíos (para que la vista no muestre NULL)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

CREATE OR REPLACE VIEW public.at_risk_students AS
WITH student_metrics AS (
    SELECT 
        e.student_id,
        -- 1. Calcular promedio solo de las tareas ya calificadas ('graded')
        AVG(s.grade) as avg_grade,
        
        -- 2. Contar tareas vencidas (fecha límite pasada y estado es NULL o 'pending')
        COUNT(a.id) FILTER (
            WHERE a.due_date < NOW() 
            AND (s.status IS NULL OR s.status = 'pending')
        ) as overdue_count
        
    FROM public.enrollments e
    JOIN public.assignments a ON e.course_id = a.course_id
    LEFT JOIN public.submissions s ON a.id = s.assignment_id AND e.student_id = s.student_id
    WHERE e.status = 'active' 
      AND a.is_published = true
    GROUP BY e.student_id
)
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    ROUND(COALESCE(sm.avg_grade, 0), 2) as average_grade,
    COALESCE(sm.overdue_count, 0) as missing_tasks
FROM public.profiles p
JOIN student_metrics sm ON p.id = sm.student_id
WHERE 
    (sm.avg_grade IS NOT NULL AND sm.avg_grade < 70) -- Criterio 1: Promedio bajo
    OR 
    sm.overdue_count > 2; -- Criterio 2: Más de 2 tareas sin entregar
