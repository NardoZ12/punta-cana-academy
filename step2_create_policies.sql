-- =====================================================
-- PASO 2: CREAR POLÍTICAS RLS
-- Ejecutar DESPUÉS del PASO 1
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para NOTIFICATION_SETTINGS
DROP POLICY IF EXISTS "Users can manage own notification settings" ON notification_settings;
CREATE POLICY "Users can manage own notification settings" ON notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para COURSES
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (is_published = true OR auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;
CREATE POLICY "Instructors can manage own courses" ON courses
    FOR ALL USING (auth.uid() = instructor_id);

-- Políticas para COURSE_LESSONS
DROP POLICY IF EXISTS "Students can view lessons of enrolled courses" ON course_lessons;
CREATE POLICY "Students can view lessons of enrolled courses" ON course_lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.student_id = auth.uid() 
            AND enrollments.course_id = course_lessons.course_id
            AND enrollments.status = 'active'
        )
        OR 
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_lessons.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Instructors can manage lessons of own courses" ON course_lessons;
CREATE POLICY "Instructors can manage lessons of own courses" ON course_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_lessons.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para ENROLLMENTS
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;
CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create enrollments" ON enrollments;
CREATE POLICY "Students can create enrollments" ON enrollments
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own enrollments" ON enrollments;
CREATE POLICY "Students can update own enrollments" ON enrollments
    FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON enrollments;
CREATE POLICY "Instructors can view enrollments for their courses" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = enrollments.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para LESSON_PROGRESS
DROP POLICY IF EXISTS "Students can manage own lesson progress" ON lesson_progress;
CREATE POLICY "Students can manage own lesson progress" ON lesson_progress
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view lesson progress for their courses" ON lesson_progress;
CREATE POLICY "Instructors can view lesson progress for their courses" ON lesson_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = lesson_progress.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para ASSIGNMENTS
DROP POLICY IF EXISTS "Students can view assignments for enrolled courses" ON assignments;
CREATE POLICY "Students can view assignments for enrolled courses" ON assignments
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.student_id = auth.uid() 
            AND enrollments.course_id = assignments.course_id
            AND enrollments.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Instructors can manage assignments for own courses" ON assignments;
CREATE POLICY "Instructors can manage assignments for own courses" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = assignments.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para ASSIGNMENT_SUBMISSIONS
DROP POLICY IF EXISTS "Students can manage own assignment submissions" ON assignment_submissions;
CREATE POLICY "Students can manage own assignment submissions" ON assignment_submissions
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view submissions for their course assignments" ON assignment_submissions;
CREATE POLICY "Instructors can view submissions for their course assignments" ON assignment_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON c.id = a.course_id
            WHERE a.id = assignment_submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Instructors can update submissions for their course assignments" ON assignment_submissions;
CREATE POLICY "Instructors can update submissions for their course assignments" ON assignment_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON c.id = a.course_id
            WHERE a.id = assignment_submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );

-- Políticas para EXAMS
DROP POLICY IF EXISTS "Students can view published exams for enrolled courses" ON exams;
CREATE POLICY "Students can view published exams for enrolled courses" ON exams
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.student_id = auth.uid() 
            AND enrollments.course_id = exams.course_id
            AND enrollments.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Instructors can manage exams for own courses" ON exams;
CREATE POLICY "Instructors can manage exams for own courses" ON exams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = exams.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Políticas para EXAM_QUESTIONS
DROP POLICY IF EXISTS "Students can view questions for accessible exams" ON exam_questions;
CREATE POLICY "Students can view questions for accessible exams" ON exam_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exams e
            JOIN courses c ON c.id = e.course_id
            JOIN enrollments en ON en.course_id = c.id
            WHERE e.id = exam_questions.exam_id
            AND e.is_published = true
            AND en.student_id = auth.uid()
            AND en.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Instructors can manage questions for own exams" ON exam_questions;
CREATE POLICY "Instructors can manage questions for own exams" ON exam_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM exams e
            JOIN courses c ON c.id = e.course_id
            WHERE e.id = exam_questions.exam_id
            AND c.instructor_id = auth.uid()
        )
    );

-- Políticas para EXAM_SUBMISSIONS
DROP POLICY IF EXISTS "Students can manage own exam submissions" ON exam_submissions;
CREATE POLICY "Students can manage own exam submissions" ON exam_submissions
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view submissions for their course exams" ON exam_submissions;
CREATE POLICY "Instructors can view submissions for their course exams" ON exam_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exams e
            JOIN courses c ON c.id = e.course_id
            WHERE e.id = exam_submissions.exam_id
            AND c.instructor_id = auth.uid()
        )
    );

-- =====================================================
-- VERIFICACIÓN DE POLÍTICAS CREADAS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ PASO 2 COMPLETADO - Políticas RLS configuradas';
    RAISE NOTICE '🔒 Seguridad por filas implementada en todas las tablas';
    RAISE NOTICE '🔄 Ejecutar PASO 3: step3_insert_sample_data.sql';
END $$;