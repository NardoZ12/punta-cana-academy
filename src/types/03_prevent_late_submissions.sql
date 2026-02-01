-- =================================================================
-- TRIGGER: PREVENIR ENTREGAS TARDÍAS
-- Impide que los estudiantes creen o actualicen entregas después de la fecha límite
-- =================================================================

CREATE OR REPLACE FUNCTION public.check_submission_deadline()
RETURNS TRIGGER AS $$
DECLARE
    assignment_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Obtener la fecha límite de la asignación asociada
    SELECT due_date INTO assignment_due_date
    FROM public.assignments
    WHERE id = NEW.assignment_id;

    -- 2. Verificar si existe fecha límite y si ya ha pasado
    IF assignment_due_date IS NOT NULL AND NOW() > assignment_due_date THEN
        -- 3. Verificar si es el estudiante quien intenta realizar la acción
        -- Si auth.uid() coincide con el student_id, bloqueamos la acción.
        -- Esto permite que los profesores (cuyo auth.uid() != student_id) puedan calificar sin problemas.
        IF auth.uid() = NEW.student_id THEN
            RAISE EXCEPTION 'El plazo de entrega ha finalizado. No puedes subir o modificar tu tarea.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_late_submissions ON public.submissions;

CREATE TRIGGER prevent_late_submissions
    BEFORE INSERT OR UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_submission_deadline();