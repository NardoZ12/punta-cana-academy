import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const { courseId } = await request.json();
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que no esté ya completada
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('completed')
      .eq('student_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    if (existing?.completed) {
      return NextResponse.json({ success: true, message: 'Ya completada' });
    }

    // Marcar lección como completada
    await supabase.from('lesson_progress').upsert({
      student_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      completed: true,
      completed_at: new Date().toISOString()
    });

    // Actualizar progreso general del curso
    const { data: totalLessons } = await supabase
      .from('course_lessons')
      .select('id, course_modules!inner(course_id)')
      .eq('course_modules.course_id', courseId);

    console.log('Total lessons found:', totalLessons?.length);
    console.log('Course ID:', courseId);

    const { data: completedLessons } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .eq('completed', true);

    console.log('Completed lessons:', completedLessons?.length);

    const progress = totalLessons ? Math.round((completedLessons?.length || 0) / totalLessons.length * 100) : 0;

    // Actualizar enrollment
    await supabase
      .from('enrollments')
      .update({ progress })
      .eq('student_id', user.id)
      .eq('course_id', courseId);

    // Verificar si se completó un módulo entero
    const { data: courseModules } = await supabase
      .from('course_modules')
      .select('id, title, sort_order, course_lessons!inner(id)')
      .eq('course_id', courseId)
      .order('sort_order');

    console.log('Course modules found:', courseModules?.length);
    console.log('Modules data:', courseModules);

    let moduleCompleted = null;
    if (courseModules) {
      for (const module of courseModules) {
        const moduleLessons = module.course_lessons.map((l: any) => l.id);
        console.log(`Module ${module.title} has lessons:`, moduleLessons);
        
        const { data: moduleProgress } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('student_id', user.id)
          .eq('course_id', courseId)
          .eq('completed', true)
          .in('lesson_id', moduleLessons);

        console.log(`Completed lessons in module ${module.title}:`, moduleProgress?.length);
        const isModuleCompleted = moduleProgress && moduleProgress.length === moduleLessons.length;
        
        if (isModuleCompleted) {
          moduleCompleted = module.title;
          console.log('Module completed:', moduleCompleted);
          break;
        }
      }
    }

    // Obtener información sobre la siguiente lección y módulo
    const { data: courseLessons } = await supabase
      .from('course_lessons')
      .select('id, title, sort_order, course_modules!inner(course_id, sort_order, title)')
      .eq('course_modules.course_id', courseId)
      .order('course_modules.sort_order', { referencedTable: 'course_modules' })
      .order('sort_order');

    console.log('All course lessons found:', courseLessons?.length);
    console.log('Course lessons:', courseLessons);
    console.log('Current lesson ID:', lessonId);

    let nextLesson = null;
    let isLastLessonOfModule = false;
    let nextModule = null;

    if (courseLessons) {
      const currentIndex = courseLessons.findIndex(lesson => lesson.id === lessonId);
      console.log('Current lesson index:', currentIndex);
      
      const nextLessonData = courseLessons[currentIndex + 1];
      console.log('Next lesson data:', nextLessonData);
      
      if (nextLessonData) {
        const moduleData = Array.isArray(nextLessonData.course_modules) 
          ? nextLessonData.course_modules[0] 
          : nextLessonData.course_modules;
        nextLesson = {
          id: nextLessonData.id,
          title: nextLessonData.title,
          module: moduleData?.title || ''
        };
      }

      // Verificar si es la última lección del módulo actual
      const { data: currentLessonData } = await supabase
        .from('course_lessons')
        .select('course_modules!inner(id, sort_order)')
        .eq('id', lessonId)
        .single();

      if (currentLessonData && courseLessons) {
        const currentModuleData = Array.isArray(currentLessonData.course_modules) 
          ? currentLessonData.course_modules[0] 
          : currentLessonData.course_modules;
        const currentModuleSort = currentModuleData?.sort_order;
        const currentModuleLessons = courseLessons.filter(l => {
          const moduleData = Array.isArray(l.course_modules) ? l.course_modules[0] : l.course_modules;
          return moduleData?.sort_order === currentModuleSort;
        });
        
        isLastLessonOfModule = currentModuleLessons[currentModuleLessons.length - 1]?.id === lessonId;

        console.log('Is last lesson of module:', isLastLessonOfModule);
        console.log('Current module lessons:', currentModuleLessons.length);

        // Si es la última del módulo y hay siguiente lección, esa es del siguiente módulo
        if (isLastLessonOfModule && nextLessonData) {
          const nextModuleData = Array.isArray(nextLessonData.course_modules) 
            ? nextLessonData.course_modules[0] 
            : nextLessonData.course_modules;
          nextModule = {
            id: nextModuleData?.id || '',
            title: nextModuleData?.title || '',
            firstLessonId: nextLessonData.id
          };
          console.log('Next module:', nextModule);
        }
      }
    }

    const responseData = { 
      success: true, 
      progress,
      moduleCompleted,
      nextLesson,
      isLastLessonOfModule,
      nextModule
    };

    console.log('API Response:', responseData);
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error completando lección:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}