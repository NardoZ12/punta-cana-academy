-- =============================================
-- FIX: Clean up duplicate topics and fix order_index gaps
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Show all topics with potential duplicates (same title + unit_id)
SELECT 
  ut.id, ut.unit_id, ut.title, ut.order_index, ut.created_at,
  cu.title as unit_title
FROM unit_topics ut
JOIN course_units cu ON ut.unit_id = cu.id
ORDER BY ut.unit_id, ut.order_index;

-- 2. Delete duplicate topics (keep the first one created)
-- This deletes topics where same title exists in same unit
DELETE FROM topic_resources 
WHERE topic_id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY unit_id, title ORDER BY created_at ASC) as rn
    FROM unit_topics
  ) sub WHERE rn > 1
);

DELETE FROM unit_topics 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY unit_id, title ORDER BY created_at ASC) as rn
    FROM unit_topics
  ) sub WHERE rn > 1
);

-- 3. Re-index order_index to be sequential (0, 1, 2, ...)
WITH reindexed AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY unit_id ORDER BY order_index, created_at) - 1 as new_index
  FROM unit_topics
)
UPDATE unit_topics 
SET order_index = reindexed.new_index
FROM reindexed
WHERE unit_topics.id = reindexed.id;

-- 4. Do the same for course_units
WITH reindexed AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY order_index, created_at) - 1 as new_index
  FROM course_units
)
UPDATE course_units 
SET order_index = reindexed.new_index
FROM reindexed
WHERE course_units.id = reindexed.id;

-- 5. Verify final state
SELECT 
  cu.title as unit_title, cu.order_index as unit_order,
  ut.title as topic_title, ut.order_index as topic_order
FROM course_units cu
LEFT JOIN unit_topics ut ON ut.unit_id = cu.id
ORDER BY cu.course_id, cu.order_index, ut.order_index;
