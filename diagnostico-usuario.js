/**
 * Script de diagnóstico y reparación para usuario específico
 * Ejecutar en el navegador (Consola de desarrollador)
 */

// Configuración del usuario y curso
const USER_EMAIL = 'nardo2736@gmail.com';
const COURSE_NAME = 'Inglés Educativo';
const LESSON_ID = '1499891d-b906-4c66-8430-38438f073428'; // ID de la lección que no carga

import { createClient } from '@/utils/supabase/client';

export async function diagnosticarYRepararUsuario() {
  const supabase = createClient();
  
  console.log('🔍 Iniciando diagnóstico para:', USER_EMAIL);
  
  try {
    // 1. Verificar usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Usuario autenticado:', user?.email);
    
    if (user?.email !== USER_EMAIL) {
      console.log('⚠️ El usuario autenticado no coincide. Necesitas estar logueado como', USER_EMAIL);
      return;
    }

    // 2. Buscar el curso "Inglés Educativo"
    console.log('🔍 Buscando curso:', COURSE_NAME);
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .ilike('title', `%${COURSE_NAME}%`);
    
    if (courseError) {
      console.error('❌ Error buscando curso:', courseError);
      return;
    }
    
    if (!courses || courses.length === 0) {
      console.error('❌ No se encontró el curso:', COURSE_NAME);
      return;
    }
    
    const course = courses[0];
    console.log('✅ Curso encontrado:', course.title, '| ID:', course.id);

    // 3. Verificar inscripción
    console.log('🔍 Verificando inscripción...');
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .single();
    
    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
      console.error('❌ Error verificando inscripción:', enrollmentError);
      return;
    }
    
    if (!enrollment) {
      console.log('⚠️ No existe inscripción. Creando...');
      
      const { data: newEnrollment, error: createEnrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: course.id,
          progress: 0,
          grade: null,
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createEnrollmentError) {
        console.error('❌ Error creando inscripción:', createEnrollmentError);
        return;
      }
      
      console.log('✅ Inscripción creada:', newEnrollment);
    } else {
      console.log('✅ Inscripción existe:', enrollment);
    }

    // 4. Verificar acceso a la lección
    console.log('🔍 Verificando acceso a lección...');
    
    // Intentar con course_lessons
    const { data: courseLesson, error: courseLessonError } = await supabase
      .from('course_lessons')
      .select(`
        id, title, description, video_url,
        course_modules (
          id, course_id, title, is_published,
          courses (
            id, title, is_published
          )
        )
      `)
      .eq('id', LESSON_ID);
    
    if (courseLesson && courseLesson.length > 0) {
      console.log('✅ Lección encontrada en course_lessons:', courseLesson[0]);
      
      // Verificar que pertenece al curso correcto
      const lessonCourse = courseLesson[0].course_modules?.courses;
      if (lessonCourse?.id === course.id) {
        console.log('✅ La lección pertenece al curso correcto');
      } else {
        console.log('⚠️ La lección NO pertenece al curso esperado');
        console.log('Curso de la lección:', lessonCourse);
        console.log('Curso esperado:', course.id);
      }
    } else {
      console.log('❌ Lección no encontrada en course_lessons');
      
      // Intentar con tabla lessons
      const { data: legacyLesson, error: legacyError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', LESSON_ID);
      
      if (legacyLesson && legacyLesson.length > 0) {
        console.log('✅ Lección encontrada en tabla legacy "lessons":', legacyLesson[0]);
      } else {
        console.error('❌ Lección no encontrada en ninguna tabla');
      }
    }

    // 5. Verificar progreso de lección
    console.log('🔍 Verificando progreso de lección...');
    
    // Intentar con lesson_progress
    const { data: progressData, error: progressError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('lesson_id', LESSON_ID);
    
    if (progressData && progressData.length > 0) {
      console.log('✅ Progreso encontrado en lesson_progress:', progressData);
    } else {
      console.log('⚠️ No hay progreso en lesson_progress');
      
      // Intentar con user_lesson_progress
      const { data: userProgress, error: userProgressError } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', LESSON_ID);
      
      if (userProgress && userProgress.length > 0) {
        console.log('✅ Progreso encontrado en user_lesson_progress:', userProgress);
      } else {
        console.log('ℹ️ No hay progreso registrado (esto es normal para lecciones no vistas)');
      }
    }

    // 6. Listar todas las lecciones del curso
    console.log('🔍 Listando todas las lecciones del curso...');
    const { data: allLessons, error: allLessonsError } = await supabase
      .from('course_lessons')
      .select(`
        id, title, sort_order,
        course_modules!inner (
          id, title, course_id
        )
      `)
      .eq('course_modules.course_id', course.id)
      .order('course_modules.sort_order')
      .order('sort_order');
    
    if (allLessons) {
      console.log('📚 Lecciones del curso:');
      allLessons.forEach((lesson, index) => {
        const isTarget = lesson.id === LESSON_ID;
        console.log(`${isTarget ? '👉' : '  '} ${index + 1}. ${lesson.title} (${lesson.id})`);
      });
    }

    // 7. REPARACIÓN: Crear inscripción si no existe
    if (!enrollment) {
      console.log('🔧 REPARACIÓN COMPLETADA: Inscripción creada');
    }

    return {
      user: user.id,
      course: course.id,
      enrollment: !!enrollment,
      lessonFound: !!courseLesson,
      progressExists: !!progressData,
      totalLessons: allLessons?.length || 0
    };

  } catch (error) {
    console.error('💥 Error en diagnóstico:', error);
  }
}

// Ejecutar automáticamente
// diagnosticarYRepararUsuario();