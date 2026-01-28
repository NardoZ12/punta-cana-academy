/**
 * Script de debugging para verificar estructura de BD y RLS
 * Ejecutar desde el navegador en la consola de las herramientas de desarrollador
 */

import { createClient } from '@/utils/supabase/client';

export async function debugDatabase(lessonId = '1499891d-b906-4c66-8430-38438f073428', courseId = 'eb943375-f0ca-4139-b155-bdf5a14a916c') {
  const supabase = createClient();
  
  console.log('🔍 Iniciando debugging de base de datos...');
  
  // 1. Verificar usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('👤 Usuario autenticado:', user?.id, authError ? 'ERROR: ' + authError.message : 'OK');
  
  if (!user) return;

  // 2. Verificar inscripción
  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', user.id)
    .eq('course_id', courseId);
  
  console.log('📋 Inscripción:', enrollment, enrollError ? 'ERROR: ' + enrollError.message : 'OK');

  // 3. Verificar tablas disponibles (intentar ambas)
  console.log('🔍 Probando tabla "lessons"...');
  const { data: lessonsTable, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId);
  
  console.log('📚 Tabla lessons:', lessonsTable, lessonsError ? 'ERROR: ' + lessonsError.message : 'OK');

  console.log('🔍 Probando tabla "course_lessons"...');
  const { data: courseLessonsTable, error: courseLessonsError } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('id', lessonId);
  
  console.log('📚 Tabla course_lessons:', courseLessonsTable, courseLessonsError ? 'ERROR: ' + courseLessonsError.message : 'OK');

  // 4. Verificar con estructura completa
  console.log('🔍 Probando query completa con course_lessons...');
  const { data: fullQuery, error: fullError } = await supabase
    .from('course_lessons')
    .select(`
      id, title, description, video_url, duration, sort_order, created_at,
      course_modules!inner (
        id, course_id, is_published,
        courses!inner (
          id, title, is_published
        )
      )
    `)
    .eq('id', lessonId)
    .eq('course_modules.course_id', courseId);

  console.log('🔍 Query completa:', fullQuery, fullError ? 'ERROR: ' + fullError.message : 'OK');

  // 5. Verificar progreso con ambas tablas
  console.log('🔍 Probando tabla "user_lesson_progress"...');
  const { data: userProgress, error: userProgressError } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId);
  
  console.log('📈 user_lesson_progress:', userProgress, userProgressError ? 'ERROR: ' + userProgressError.message : 'OK');

  console.log('🔍 Probando tabla "lesson_progress"...');
  const { data: lessonProgress, error: lessonProgressError } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId);
  
  console.log('📈 lesson_progress:', lessonProgress, lessonProgressError ? 'ERROR: ' + lessonProgressError.message : 'OK');

  // 6. Verificar estructura del curso
  console.log('🔍 Verificando estructura del curso...');
  const { data: courseStructure, error: courseStructureError } = await supabase
    .from('courses')
    .select(`
      id, title, is_published,
      course_modules (
        id, title, is_published, sort_order,
        course_lessons (
          id, title, video_url, sort_order
        )
      )
    `)
    .eq('id', courseId);

  console.log('🏗️ Estructura del curso:', courseStructure, courseStructureError ? 'ERROR: ' + courseStructureError.message : 'OK');

  return {
    user: user?.id,
    enrollment,
    lessonsTable,
    courseLessonsTable,
    fullQuery,
    userProgress,
    lessonProgress,
    courseStructure
  };
}