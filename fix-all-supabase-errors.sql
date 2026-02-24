-- =============================================
-- FIX ALL: RLS recursion + missing columns
-- Run this ONCE in Supabase SQL Editor
-- =============================================
-- Fixes:
-- 1. "infinite recursion detected in policy for relation courses"
-- 2. "infinite recursion detected in policy for relation enrollments"
-- 3. "column enrollments.progress does not exist"
-- =============================================

-- =============================================
-- PASO 1: Add missing columns to enrollments
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='progress' AND table_schema='public') THEN
        ALTER TABLE public.enrollments ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
        RAISE NOTICE 'Added column: enrollments.progress';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='grade' AND table_schema='public') THEN
        ALTER TABLE public.enrollments ADD COLUMN grade NUMERIC(5,2);
        RAISE NOTICE 'Added column: enrollments.grade';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='enrolled_at' AND table_schema='public') THEN
        ALTER TABLE public.enrollments ADD COLUMN enrolled_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added column: enrollments.enrolled_at';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='status' AND table_schema='public') THEN
        ALTER TABLE public.enrollments ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped'));
        RAISE NOTICE 'Added column: enrollments.status';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='last_accessed_at' AND table_schema='public') THEN
        ALTER TABLE public.enrollments ADD COLUMN last_accessed_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added column: enrollments.last_accessed_at';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='completed_at' AND table_schema='public') THEN
        ALTER TABLE public.enrollments ADD COLUMN completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added column: enrollments.completed_at';
    END IF;
END $$;

-- =============================================
-- PASO 2: Create SECURITY DEFINER helper functions
-- These bypass RLS to break the recursion cycle
-- =============================================

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

-- =============================================
-- PASO 3: DROP ALL old policies on courses
-- =============================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'courses' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.courses', pol.policyname);
        RAISE NOTICE 'Dropped policy on courses: %', pol.policyname;
    END LOOP;
END $$;

-- =============================================
-- PASO 4: DROP ALL old policies on enrollments
-- =============================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'enrollments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.enrollments', pol.policyname);
        RAISE NOTICE 'Dropped policy on enrollments: %', pol.policyname;
    END LOOP;
END $$;

-- =============================================
-- PASO 5: DROP ALL old policies on course_modules
-- =============================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'course_modules' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.course_modules', pol.policyname);
        RAISE NOTICE 'Dropped policy on course_modules: %', pol.policyname;
    END LOOP;
END $$;

-- =============================================
-- PASO 6: DROP ALL old policies on course_lessons
-- =============================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'course_lessons' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.course_lessons', pol.policyname);
        RAISE NOTICE 'Dropped policy on course_lessons: %', pol.policyname;
    END LOOP;
END $$;

-- =============================================
-- PASO 7: DROP ALL old policies on course_units, unit_topics, topic_resources
-- =============================================
DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['course_units', 'unit_topics', 'topic_resources']
    LOOP
        FOR pol IN 
            SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            RAISE NOTICE 'Dropped policy on %: %', tbl, pol.policyname;
        END LOOP;
    END LOOP;
END $$;

-- =============================================
-- PASO 8: DROP ALL old policies on assignments, submissions
-- =============================================
DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['assignments', 'submissions']
    LOOP
        FOR pol IN 
            SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            RAISE NOTICE 'Dropped policy on %: %', tbl, pol.policyname;
        END LOOP;
    END LOOP;
END $$;

-- =============================================
-- PASO 9: Enable RLS on all tables
-- =============================================
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unit_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.topic_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 10: CREATE NEW POLICIES — COURSES (no recursion!)
-- =============================================

-- Anyone can see published courses (marketing pages, course listings)
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (is_published = true);

-- Teachers see their own courses (draft or published)
CREATE POLICY "Instructors view own courses" ON courses
    FOR SELECT USING (instructor_id = auth.uid());

-- Enrolled students can see their course (even if unpublished)
CREATE POLICY "Enrolled students view their courses" ON courses
    FOR SELECT USING (
        is_enrolled_in_course(auth.uid(), id)
    );

-- Teachers can create courses
CREATE POLICY "Instructors can insert courses" ON courses
    FOR INSERT WITH CHECK (
        instructor_id = auth.uid()
        OR instructor_id IS NULL
    );

-- Teachers can update their own courses
CREATE POLICY "Instructors can update own courses" ON courses
    FOR UPDATE USING (instructor_id = auth.uid());

-- Teachers can delete their own courses
CREATE POLICY "Instructors can delete own courses" ON courses
    FOR DELETE USING (instructor_id = auth.uid());

-- =============================================
-- PASO 11: CREATE NEW POLICIES — ENROLLMENTS (no recursion!)
-- =============================================

-- Students can see their own enrollments
CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT USING (student_id = auth.uid());

-- Instructors can see enrollments for their courses
CREATE POLICY "Instructors can view enrollments for their courses" ON enrollments
    FOR SELECT USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- Students can enroll themselves
CREATE POLICY "Students can create enrollments" ON enrollments
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own enrollment (progress, etc)
CREATE POLICY "Students can update own enrollments" ON enrollments
    FOR UPDATE USING (student_id = auth.uid());

-- =============================================
-- PASO 12: CREATE NEW POLICIES — COURSE_MODULES
-- =============================================

CREATE POLICY "Anyone can view published modules" ON course_modules
    FOR SELECT USING (
        is_course_published(course_id)
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

CREATE POLICY "Teachers can manage course modules" ON course_modules
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- =============================================
-- PASO 13: CREATE NEW POLICIES — COURSE_LESSONS
-- =============================================

CREATE POLICY "Students can view lessons of enrolled courses" ON course_lessons
    FOR SELECT USING (
        is_course_published(course_id)
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

CREATE POLICY "Instructors can manage lessons of own courses" ON course_lessons
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- =============================================
-- PASO 14: CREATE NEW POLICIES — COURSE_UNITS
-- =============================================

CREATE POLICY "View units" ON course_units 
    FOR SELECT USING (
        (is_published = true AND is_course_published(course_id))
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

CREATE POLICY "Manage units" ON course_units 
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- =============================================
-- PASO 15: CREATE NEW POLICIES — UNIT_TOPICS
-- =============================================

CREATE POLICY "View topics" ON unit_topics 
    FOR SELECT USING (
        (is_published = true AND is_course_published(course_id))
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

CREATE POLICY "Manage topics" ON unit_topics 
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- =============================================
-- PASO 16: CREATE NEW POLICIES — TOPIC_RESOURCES
-- =============================================

CREATE POLICY "View resources" ON topic_resources 
    FOR SELECT USING (
        is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

CREATE POLICY "Manage resources" ON topic_resources 
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- =============================================
-- PASO 17: CREATE NEW POLICIES — ASSIGNMENTS
-- =============================================

CREATE POLICY "Students view assignments of enrolled courses" ON assignments
    FOR SELECT USING (
        is_enrolled_in_course(auth.uid(), course_id)
    );

CREATE POLICY "Instructors manage assignments of own courses" ON assignments
    FOR ALL USING (
        is_instructor_of_course(auth.uid(), course_id)
    );

-- =============================================
-- PASO 18: CREATE NEW POLICIES — SUBMISSIONS
-- =============================================

CREATE POLICY "Students view own submissions" ON submissions
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students create submissions" ON submissions
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Instructors view submissions for their assignments" ON submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a 
            WHERE a.id = submissions.assignment_id 
            AND is_instructor_of_course(auth.uid(), a.course_id)
        )
    );

CREATE POLICY "Instructors grade submissions" ON submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assignments a 
            WHERE a.id = submissions.assignment_id 
            AND is_instructor_of_course(auth.uid(), a.course_id)
        )
    );

-- =============================================
-- PASO 19: PROFILES policies (safe, no cross-table)
-- =============================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Anyone can view profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- =============================================
-- DONE! Verification query:
-- =============================================
-- Run this to see all active policies:
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
