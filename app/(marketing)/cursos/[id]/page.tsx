import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/atoms/Button';
import EnrollButton from './EnrollButton';

// Revalidar cada 60 segundos para mantener datos frescos
export const revalidate = 60;

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  // Fetch del curso en el servidor - instantáneo para el usuario
  const { data: course, error } = await supabase
    .from('courses')
    .select(`*, course_modules (*, course_lessons (*))`)
    .eq('id', courseId)
    .single();

  if (error || !course) {
    notFound();
  }

  // Ordenar módulos y lecciones en el servidor
  if (course.course_modules) {
    course.course_modules.sort((a: any, b: any) => a.sort_order - b.sort_order);
    course.course_modules.forEach((mod: any) => {
      if (mod.course_lessons) mod.course_lessons.sort((a: any, b: any) => a.sort_order - b.sort_order);
    });
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      
      {/* PORTADA HERO (-mt-20 para transparencia) */}
      <div className="relative w-full h-[75vh] min-h-[550px] flex items-center justify-center overflow-hidden -mt-20">
        
        {/* Fondo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black z-10" />
          <img 
            src={course.image_url || '/images/logos/thumbnail-ingles-principiantes.png'} 
            alt={course.title} 
            className="w-full h-full object-cover opacity-90" 
          />
        </div>

        {/* Info Central */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-20">
          <span className="inline-block py-1 px-3 rounded-full bg-cyan-500/20 text-cyan-300 text-sm font-bold uppercase tracking-wider mb-6 border border-cyan-500/30 backdrop-blur-md">
            {course.modality || 'Online'}
          </span>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white drop-shadow-2xl leading-tight">
            {course.title}
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-100 max-w-3xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md">
            {course.description}
          </p>
          
          {/* BOTÓN DE ACCIÓN FLOTANTE */}
          <div className="inline-flex flex-col md:flex-row items-center gap-4 md:gap-6 bg-white/10 backdrop-blur-xl p-3 md:p-2 md:pr-2 md:pl-8 rounded-2xl md:rounded-full border border-white/20 shadow-2xl transition hover:bg-white/15 max-w-sm md:max-w-none mx-auto">
             <div className="text-center md:text-left">
               <p className="text-xs text-gray-300 uppercase tracking-widest font-semibold">Precio</p>
               <div className="flex items-baseline gap-1 justify-center md:justify-start">
                 <span className="text-xl font-bold text-green-400">Acceso Gratuito a Classroom</span>
                 <span className="text-sm text-gray-300">🎉</span>
               </div>
             </div>
             
             <EnrollButton courseId={courseId} />
          </div>
        </div>
      </div>

      {/* TEMARIO */}
      <div className="max-w-4xl mx-auto px-4 mt-20 relative z-30">
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8 shadow-2xl shadow-black">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-800">
             <span className="text-4xl">📚</span>
             <div>
                <h2 className="text-2xl font-bold text-white">Plan de Estudios</h2>
                <p className="text-gray-400 text-sm">Lo que aprenderás paso a paso</p>
             </div>
          </div>
          
          <div className="space-y-4">
            {course.course_modules?.map((mod: any, index: number) => (
              <div key={mod.id} className="group border border-gray-800 bg-gray-900/50 rounded-xl overflow-hidden hover:border-cyan-900/50 transition duration-300">
                <div className="p-5 flex justify-between items-center cursor-default bg-gray-900">
                   <h3 className="font-bold text-lg text-gray-200 group-hover:text-cyan-400 transition">
                     <span className="text-cyan-600 mr-3 opacity-50 font-mono">0{index + 1}</span> 
                     {mod.title}
                   </h3>
                </div>
                <div className="divide-y divide-gray-800/50">
                  {mod.course_lessons?.map((lesson: any) => (
                    <div key={lesson.id} className="px-6 py-4 flex gap-4 items-center text-gray-400 hover:text-white hover:bg-white/5 transition text-sm">
                      <div className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-xs text-gray-600">▶</div>
                      {lesson.title}
                    </div>
                  ))}
                  {(!mod.course_lessons || mod.course_lessons.length === 0) && (
                    <div className="px-6 py-4 text-gray-600 italic text-xs">Contenido próximamente...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}