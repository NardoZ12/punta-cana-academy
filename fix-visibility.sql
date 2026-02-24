-- =============================================
-- FIX: Make existing units & topics visible
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Publish ALL existing units (they were created with is_published = false)
UPDATE course_units SET is_published = true WHERE is_published = false;

-- 2. Publish ALL existing topics  
UPDATE unit_topics SET is_published = true WHERE is_published = false;

-- 3. Fix RLS: allow ANYONE to see units/topics of published courses
-- (needed for the public course detail page which uses anon key)

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "View units" ON course_units;
DROP POLICY IF EXISTS "View topics" ON unit_topics;
DROP POLICY IF EXISTS "View resources" ON topic_resources;

-- Recreate with public access for published courses
CREATE POLICY "View units" ON course_units 
    FOR SELECT USING (
        is_course_published(course_id)
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

CREATE POLICY "View topics" ON unit_topics 
    FOR SELECT USING (
        is_course_published(course_id)
        OR is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

CREATE POLICY "View resources" ON topic_resources 
    FOR SELECT USING (
        is_instructor_of_course(auth.uid(), course_id)
        OR is_enrolled_in_course(auth.uid(), course_id)
    );

-- 4. Force PostgREST to reload
NOTIFY pgrst, 'reload schema';

-- =============================================
-- DONE! Now:
-- - All existing units/topics are published
-- - Anyone can see units/topics of published courses
-- - Resources still require enrollment or instructor status
-- =============================================
