-- =============================================
-- FIX: Infinite recursion in RLS policies
-- =============================================
-- Problem: courses policies check enrollments, enrollments policies check courses → infinite loop
-- Solution: SECURITY DEFINER functions that bypass RLS to break the cycle
-- =============================================

-- STEP 1: Create helper functions (SECURITY DEFINER = bypasses RLS)

CREATE OR REPLACE FUNCTION is_enrolled_in_course(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM enrollments
        WHERE student_id = p_user_id
        AND course_id = p_course_id
        AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION is_instructor_of_course(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM courses
        WHERE id = p_course_id
        AND instructor_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION is_course_published(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM courses
        WHERE id = p_course_id
        AND is_published = true
    );
$$;

-- STEP 2: Fix COURSES policies

DROP POLICY IF EXISTS "Enrolled students view their courses" ON courses;
CREATE POLICY "Enrolled students view their courses" ON courses
    FOR SELECT USING (
        is_enrolled_in_course(auth.uid(), id)
    );

-- STEP 3: Fix ENROLLMENTS policies

DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON enrollments;
CREATE POLICY "Instructors can view enrollments for their courses" ON enrollments
    FOR SELECT USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- STEP 4: Fix COURSE_MODULES policies

DROP POLICY IF EXISTS "Anyone can view published modules" ON course_modules;
CREATE POLICY "Anyone can view published modules" ON course_modules
    FOR SELECT USING (
        is_course_published(course_id)
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Teachers can manage course modules" ON course_modules;
CREATE POLICY "Teachers can manage course modules" ON course_modules
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- STEP 5: Fix COURSE_LESSONS policies

DROP POLICY IF EXISTS "Students can view lessons of enrolled courses" ON course_lessons;
CREATE POLICY "Students can view lessons of enrolled courses" ON course_lessons
    FOR SELECT USING (
        is_course_published(course_id)
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Instructors can manage lessons of own courses" ON course_lessons;
CREATE POLICY "Instructors can manage lessons of own courses" ON course_lessons
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- STEP 6: Fix COURSE_UNITS policies

DROP POLICY IF EXISTS "View units" ON course_units;
CREATE POLICY "View units" ON course_units 
    FOR SELECT USING (
        (is_published = true AND is_course_published(course_id))
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Manage units" ON course_units;
CREATE POLICY "Manage units" ON course_units 
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- STEP 7: Fix UNIT_TOPICS policies

DROP POLICY IF EXISTS "View topics" ON unit_topics;
CREATE POLICY "View topics" ON unit_topics 
    FOR SELECT USING (
        (is_published = true AND is_course_published(course_id))
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Manage topics" ON unit_topics;
CREATE POLICY "Manage topics" ON unit_topics 
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- STEP 8: Fix TOPIC_RESOURCES policies

DROP POLICY IF EXISTS "View resources" ON topic_resources;
CREATE POLICY "View resources" ON topic_resources 
    FOR SELECT USING (
        is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

DROP POLICY IF EXISTS "Manage resources" ON topic_resources;
CREATE POLICY "Manage resources" ON topic_resources 
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- DONE! The recursion cycle is broken because:
-- 1. courses policies now call is_enrolled_in_course() which uses SECURITY DEFINER (bypasses enrollments RLS)
-- 2. enrollments policies now call is_instructor_of_course() which uses SECURITY DEFINER (bypasses courses RLS)
-- 3. All child table policies use the same helper functions instead of direct subqueries
