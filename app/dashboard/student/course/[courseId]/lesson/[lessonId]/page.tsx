import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/atoms/Button';
import { revalidatePath } from 'next/cache';

function getEmbedUrl(url: string | null) {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
  }
  return url;
}

async function markAsCompleted(lessonId: string, courseId: string) {
  'use server';
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

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

  const { data: completedLessons } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .eq('completed', true);

  const progress = totalLessons ? Math.round((completedLessons?.length || 0) / totalLessons.length * 100) : 0;

  // Actualizar enrollment
  await supabase
    .from('enrollments')
    .update({ progress })
    .eq('student_id', user.id)
    .eq('course_id', courseId);

  // Verificar si se completó un módulo entero para desbloquearlo
  const { data: courseModules } = await supabase
    .from('course_modules')
    .select('id, title, sort_order, course_lessons!inner(id)')
    .eq('course_id', courseId)
    .order('sort_order');

  if (courseModules) {
    let moduleCompleted = false;
    for (const module of courseModules) {
      const moduleLessons = module.course_lessons.map((l: any) => l.id);
      const { data: moduleProgress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('completed', true)
        .in('lesson_id', moduleLessons);

      const isModuleCompleted = moduleProgress && moduleProgress.length === moduleLessons.length;
      
      if (isModuleCompleted) {
        console.log(`🎉 ¡Módulo "${module.title}" completado! Siguiente módulo desbloqueado.`);
        moduleCompleted = true;
      }
    }
  }

  // Verificar qué lección se debe desbloquear a continuación
  const { data: courseLessons } = await supabase
    .from('course_lessons')
    .select('id, sort_order, course_modules!inner(course_id, sort_order)')
    .eq('course_modules.course_id', courseId)
    .order('course_modules.sort_order', { referencedTable: 'course_modules' })
    .order('sort_order');

  let nextUnlockedLessonId = null;
  
  if (courseLessons) {
    const currentIndex = courseLessons.findIndex(lesson => lesson.id === lessonId);
    const nextLesson = courseLessons[currentIndex + 1];
    
    if (nextLesson) {
      // Verificar si la siguiente lección debe estar desbloqueada
      const { data: nextLessonModule } = await supabase
        .from('course_lessons')
        .select('module_id, course_modules!inner(sort_order)')
        .eq('id', nextLesson.id)
        .single();

      const { data: currentLessonModule } = await supabase
        .from('course_lessons')
        .select('module_id, course_modules!inner(sort_order)')
        .eq('id', lessonId)
        .single();

      // Si es del mismo módulo, desbloquear la siguiente lección
      // Si es de diferente módulo, verificar que el módulo anterior esté completo
      if (nextLessonModule?.module_id === currentLessonModule?.module_id) {
        nextUnlockedLessonId = nextLesson.id;
      } else {
        // Es del siguiente módulo, verificar si se desbloqueó
        const currentModuleLessons = courseLessons.filter(l => 
          l.course_modules.sort_order === currentLessonModule?.course_modules.sort_order
        );
        
        const { data: currentModuleProgress } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('student_id', user.id)
          .eq('course_id', courseId)
          .eq('completed', true)
          .in('lesson_id', currentModuleLessons.map(l => l.id));

        if (currentModuleProgress && currentModuleProgress.length === currentModuleLessons.length) {
          nextUnlockedLessonId = nextLesson.id;
        }
      }
    }
  }

  // Revalidar páginas
  revalidatePath(`/dashboard/student/course/${courseId}/lesson/${lessonId}`);
  revalidatePath(`/dashboard/student/course/${courseId}`);
  
  // Redireccionar a la siguiente lección si está desbloqueada
  if (nextUnlockedLessonId) {
    const { redirect } = await import('next/navigation');
    redirect(`/dashboard/student/course/${courseId}/lesson/${nextUnlockedLessonId}`);
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { lessonId, courseId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (error || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-xl mb-2">🚫</p>
        <p>No pudimos cargar la lección.</p>
        <p className="text-xs mt-2 opacity-50">Error: {error?.message || 'ID incorrecto'}</p>
      </div>
    );
  }

  // Verificar si ya está completada
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('student_id', user?.id)
    .eq('lesson_id', lessonId)
    .single();

  const isCompleted = progress?.completed || false;
  const isYouTube = lesson.video_url?.includes('youtube') || lesson.video_url?.includes('youtu.be');
  const embedUrl = getEmbedUrl(lesson.video_url);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="w-full aspect-video bg-black flex items-center justify-center relative group border-b border-gray-800">
         {embedUrl ? (
            isYouTube ? (
              <iframe 
                src={embedUrl}
                className="w-full h-full"
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video controls className="w-full h-full object-contain" src={embedUrl} />
            )
         ) : (
            <div className="text-center text-gray-600">
               <span className="text-6xl block mb-4 opacity-50">📹</span>
               <p>Esta lección no tiene video asignado.</p>
            </div>
         )}
      </div>

      <div className="p-4 md:p-8 pb-20">
         <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-gray-800 pb-8 gap-4">
            <div>
               <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{lesson.title}</h1>
               <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>📅 {new Date(lesson.created_at).toLocaleDateString()}</span>
                  {lesson.duration > 0 && <span>⏱️ {lesson.duration} min</span>}
               </div>
            </div>
            
            <form action={markAsCompleted.bind(null, lessonId, courseId)}>
              <Button 
                type="submit"
                variant="primary" 
                className={`${
                  isCompleted 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-cyan-600 hover:bg-cyan-700'
                } border-none transition-colors`}
                disabled={isCompleted}
              >
                {isCompleted ? '✅ Completada' : '✓ Marcar como Vista'}
              </Button>
            </form>
         </div>
         
         <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📖 Notas de la Clase</h3>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
               {lesson.description || 'Sin descripción adicional.'}
            </div>
         </div>
      </div>
    </div>
  );
}