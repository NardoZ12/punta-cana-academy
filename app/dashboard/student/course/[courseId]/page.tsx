import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function CourseRedirectPage({
  params,
}: {
  params: Promise<{ courseId: string }>; // <--- Promise
}) {
  const { courseId } = await params; // <--- AWAIT
  const supabase = await createClient();

  // Buscar el primer módulo y la primera lección
  const { data: firstLesson } = await supabase
    .from('course_lessons')
    .select('id, module_id, course_modules!inner(course_id)')
    .eq('course_modules.course_id', courseId)
    .order('sort_order', { ascending: true }) // Asegúrate de que esto ordene por módulo también
    .limit(1)
    .single();

  if (firstLesson) {
    redirect(`/dashboard/student/course/${courseId}/lesson/${firstLesson.id}`);
  }

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold">Curso sin contenido 😅</h1>
      <p className="text-gray-400 mt-2">El profesor aún no ha publicado lecciones en este curso.</p>
    </div>
  );
}