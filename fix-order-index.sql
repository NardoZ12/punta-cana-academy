-- =============================================
-- FIX: Arreglar order_index duplicados en unit_topics
-- =============================================

-- Primero, temporalmente eliminar la constraint que bloquea
ALTER TABLE unit_topics DROP CONSTRAINT IF EXISTS unique_topic_order_per_unit;

-- Re-indexar todos los topics secuencialmente (0, 1, 2...)
WITH reindexed AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY unit_id ORDER BY created_at ASC) - 1 as new_index
  FROM unit_topics
)
UPDATE unit_topics 
SET order_index = reindexed.new_index
FROM reindexed
WHERE unit_topics.id = reindexed.id;

-- Re-indexar todas las units también
WITH reindexed AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at ASC) - 1 as new_index
  FROM course_units
)
UPDATE course_units 
SET order_index = reindexed.new_index
FROM reindexed
WHERE course_units.id = reindexed.id;

-- Volver a crear la constraint
ALTER TABLE unit_topics 
ADD CONSTRAINT unique_topic_order_per_unit UNIQUE (unit_id, order_index);

-- Verificar resultado
SELECT 
  cu.title as unit_title, cu.order_index as unit_order,
  ut.title as topic_title, ut.order_index as topic_order
FROM course_units cu
LEFT JOIN unit_topics ut ON ut.unit_id = cu.id
ORDER BY cu.course_id, cu.order_index, ut.order_index;
