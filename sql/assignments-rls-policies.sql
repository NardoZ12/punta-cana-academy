-- =====================================================
-- ESTRUCTURA JSONB PARA EXÁMENES (quiz_data)
-- =====================================================
-- Ejemplo de cómo almacenar preguntas y respuestas en la columna quiz_data

/*
ESTRUCTURA JSONB PARA UN EXAMEN:

{
  "title": "Examen Final - Introducción a la Programación",
  "description": "Este examen evalúa los conceptos básicos de programación",
  "time_limit_minutes": 60,
  "passing_score": 70,
  "shuffle_questions": true,
  "show_correct_answers": false,
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "points": 10,
      "question": "¿Qué es una variable en programación?",
      "options": [
        {"id": "a", "text": "Un valor que nunca cambia"},
        {"id": "b", "text": "Un espacio en memoria para almacenar datos"},
        {"id": "c", "text": "Un tipo de función"},
        {"id": "d", "text": "Un error de código"}
      ],
      "correct_answer": "b",
      "explanation": "Una variable es un espacio en memoria que almacena datos que pueden cambiar."
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "points": 10,
      "question": "¿Cuál es el resultado de 5 + 3 * 2?",
      "options": [
        {"id": "a", "text": "16"},
        {"id": "b", "text": "11"},
        {"id": "c", "text": "13"},
        {"id": "d", "text": "10"}
      ],
      "correct_answer": "b",
      "explanation": "Por precedencia de operadores, primero se multiplica: 3*2=6, luego se suma: 5+6=11"
    },
    {
      "id": "q3",
      "type": "true_false",
      "points": 5,
      "question": "JavaScript es un lenguaje de programación compilado.",
      "correct_answer": false,
      "explanation": "JavaScript es un lenguaje interpretado, no compilado."
    },
    {
      "id": "q4",
      "type": "short_answer",
      "points": 15,
      "question": "Escribe una función en JavaScript que sume dos números.",
      "correct_keywords": ["function", "return", "+"],
      "sample_answer": "function suma(a, b) { return a + b; }"
    },
    {
      "id": "q5",
      "type": "multiple_select",
      "points": 10,
      "question": "Selecciona todos los tipos de datos primitivos en JavaScript:",
      "options": [
        {"id": "a", "text": "string"},
        {"id": "b", "text": "array"},
        {"id": "c", "text": "number"},
        {"id": "d", "text": "object"},
        {"id": "e", "text": "boolean"}
      ],
      "correct_answers": ["a", "c", "e"],
      "explanation": "Los tipos primitivos son: string, number, boolean, null, undefined, symbol, bigint"
    }
  ]
}

ESTRUCTURA JSONB PARA RESPUESTAS DEL ESTUDIANTE (en submissions.answers):

{
  "submitted_at": "2026-02-01T10:30:00Z",
  "time_taken_minutes": 45,
  "answers": [
    {"question_id": "q1", "answer": "b"},
    {"question_id": "q2", "answer": "b"},
    {"question_id": "q3", "answer": false},
    {"question_id": "q4", "answer": "function add(x, y) { return x + y; }"},
    {"question_id": "q5", "answer": ["a", "c", "e"]}
  ],
  "auto_score": 50,
  "auto_graded_at": "2026-02-01T10:30:01Z"
}
*/

-- =====================================================
-- CREAR TABLAS SI NO EXISTEN
-- =====================================================

-- Tabla de asignaciones (tareas y exámenes)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('task', 'exam', 'quiz')),
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 100,
    quiz_data JSONB, -- Para exámenes: contiene preguntas y respuestas correctas
    file_requirements JSONB, -- Para tareas: tipos de archivo permitidos, tamaño máximo, etc.
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de entregas de estudiantes
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded', 'late')),
    file_url TEXT, -- Para tareas: URL del archivo subido
    file_name VARCHAR(255),
    answers JSONB, -- Para exámenes: respuestas del estudiante
    score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id) -- Un estudiante solo puede tener una entrega por asignación
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA ASSIGNMENTS
-- =====================================================

-- Los estudiantes pueden VER asignaciones de cursos donde están inscritos
DROP POLICY IF EXISTS "Students can view assignments for enrolled courses" ON assignments;
CREATE POLICY "Students can view assignments for enrolled courses"
ON assignments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.course_id = assignments.course_id
        AND e.student_id = auth.uid()
        AND e.status IN ('active', 'in_progress')
    )
    AND is_published = true
);

-- Los profesores pueden VER todas las asignaciones de sus cursos
DROP POLICY IF EXISTS "Teachers can view own course assignments" ON assignments;
CREATE POLICY "Teachers can view own course assignments"
ON assignments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM courses c
        WHERE c.id = assignments.course_id
        AND c.instructor_id = auth.uid()
    )
);

-- Los profesores pueden CREAR asignaciones en sus cursos
DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;
CREATE POLICY "Teachers can create assignments"
ON assignments FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM courses c
        WHERE c.id = course_id
        AND c.instructor_id = auth.uid()
    )
);

-- Los profesores pueden ACTUALIZAR asignaciones de sus cursos
DROP POLICY IF EXISTS "Teachers can update own assignments" ON assignments;
CREATE POLICY "Teachers can update own assignments"
ON assignments FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM courses c
        WHERE c.id = assignments.course_id
        AND c.instructor_id = auth.uid()
    )
);

-- Los profesores pueden ELIMINAR asignaciones de sus cursos
DROP POLICY IF EXISTS "Teachers can delete own assignments" ON assignments;
CREATE POLICY "Teachers can delete own assignments"
ON assignments FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM courses c
        WHERE c.id = assignments.course_id
        AND c.instructor_id = auth.uid()
    )
);

-- =====================================================
-- POLÍTICAS PARA SUBMISSIONS
-- =====================================================

-- Los estudiantes pueden VER SOLO sus propias entregas
DROP POLICY IF EXISTS "Students can view own submissions" ON submissions;
CREATE POLICY "Students can view own submissions"
ON submissions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Los estudiantes pueden CREAR sus propias entregas
DROP POLICY IF EXISTS "Students can create own submissions" ON submissions;
CREATE POLICY "Students can create own submissions"
ON submissions FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM assignments a
        JOIN enrollments e ON e.course_id = a.course_id
        WHERE a.id = assignment_id
        AND e.student_id = auth.uid()
        AND e.status IN ('active', 'in_progress')
    )
);

-- Los estudiantes pueden ACTUALIZAR sus propias entregas (solo si no están calificadas)
DROP POLICY IF EXISTS "Students can update own ungraded submissions" ON submissions;
CREATE POLICY "Students can update own ungraded submissions"
ON submissions FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()
    AND status != 'graded'
);

-- Los profesores pueden VER TODAS las entregas de asignaciones de sus cursos
DROP POLICY IF EXISTS "Teachers can view all submissions for own courses" ON submissions;
CREATE POLICY "Teachers can view all submissions for own courses"
ON submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        JOIN courses c ON c.id = a.course_id
        WHERE a.id = submissions.assignment_id
        AND c.instructor_id = auth.uid()
    )
);

-- Los profesores pueden ACTUALIZAR (calificar) entregas de sus cursos
DROP POLICY IF EXISTS "Teachers can grade submissions" ON submissions;
CREATE POLICY "Teachers can grade submissions"
ON submissions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        JOIN courses c ON c.id = a.course_id
        WHERE a.id = submissions.assignment_id
        AND c.instructor_id = auth.uid()
    )
);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para auto-calificar exámenes de opción múltiple
CREATE OR REPLACE FUNCTION auto_grade_quiz(
    p_submission_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_quiz_data JSONB;
    v_student_answers JSONB;
    v_total_score INTEGER := 0;
    v_question JSONB;
    v_student_answer JSONB;
BEGIN
    -- Obtener datos del quiz y respuestas del estudiante
    SELECT a.quiz_data, s.answers
    INTO v_quiz_data, v_student_answers
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    WHERE s.id = p_submission_id;

    -- Iterar sobre las preguntas y calcular puntaje
    FOR v_question IN SELECT * FROM jsonb_array_elements(v_quiz_data->'questions')
    LOOP
        -- Buscar la respuesta del estudiante para esta pregunta
        SELECT answer INTO v_student_answer
        FROM (
            SELECT elem->>'question_id' AS qid, elem->'answer' AS answer
            FROM jsonb_array_elements(COALESCE(v_student_answers->'answers', '[]'::jsonb)) elem
        ) answers
        WHERE qid = v_question->>'id';

        -- Verificar respuesta según tipo de pregunta
        IF (v_question->>'type') = 'multiple_choice' OR (v_question->>'type') = 'true_false' THEN
            -- Comparar JSONB values directamente
            IF v_student_answer IS NOT NULL AND v_student_answer = v_question->'correct_answer' THEN
                v_total_score := v_total_score + (v_question->>'points')::INTEGER;
            END IF;
        ELSIF (v_question->>'type') = 'multiple_select' THEN
            -- Para selección múltiple, comparar arrays con operadores de contención
            IF v_student_answer IS NOT NULL
               AND (v_student_answer @> v_question->'correct_answers') 
               AND (v_question->'correct_answers' @> v_student_answer) THEN
                v_total_score := v_total_score + (v_question->>'points')::INTEGER;
            END IF;
        END IF;
        -- Las preguntas de respuesta corta requieren calificación manual
    END LOOP;

    -- Actualizar el submission con el puntaje auto-calculado
    UPDATE submissions
    SET 
        answers = jsonb_set(
            COALESCE(answers, '{}'::jsonb),
            '{auto_score}',
            to_jsonb(v_total_score),
            true
        ),
        updated_at = NOW()
    WHERE id = p_submission_id;

    RETURN v_total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Insertar una asignación de ejemplo (task)
/*
INSERT INTO assignments (course_id, title, description, assignment_type, due_date, max_score, is_published, file_requirements)
VALUES (
    'YOUR_COURSE_ID',
    'Proyecto Final: Crear una Página Web',
    'Diseña y desarrolla una página web responsive usando HTML, CSS y JavaScript.',
    'task',
    NOW() + INTERVAL '7 days',
    100,
    true,
    '{
        "allowed_types": ["pdf", "zip", "html"],
        "max_size_mb": 10,
        "required": true
    }'::jsonb
);

-- Insertar una asignación de ejemplo (exam)
INSERT INTO assignments (course_id, title, description, assignment_type, due_date, max_score, is_published, quiz_data)
VALUES (
    'YOUR_COURSE_ID',
    'Examen Parcial - Fundamentos de Programación',
    'Evaluación de los conceptos básicos vistos en las primeras 4 semanas.',
    'exam',
    NOW() + INTERVAL '3 days',
    100,
    true,
    '{
        "title": "Examen Parcial",
        "time_limit_minutes": 45,
        "passing_score": 60,
        "shuffle_questions": true,
        "questions": [
            {
                "id": "q1",
                "type": "multiple_choice",
                "points": 20,
                "question": "¿Qué significa HTML?",
                "options": [
                    {"id": "a", "text": "Hyper Text Markup Language"},
                    {"id": "b", "text": "High Tech Modern Language"},
                    {"id": "c", "text": "Home Tool Markup Language"},
                    {"id": "d", "text": "Hyperlinks Text Mark Language"}
                ],
                "correct_answer": "a"
            },
            {
                "id": "q2",
                "type": "true_false",
                "points": 10,
                "question": "CSS se usa para dar estilo a páginas web.",
                "correct_answer": true
            }
        ]
    }'::jsonb
);
*/
