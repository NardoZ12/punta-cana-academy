'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';

export default function CourseDetailsPage() {
  const params = useParams();
  const supabase = createClient();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchCourse() {
      const courseId = params?.id as string;
      if (!courseId) return;

      const { data, error } = await supabase
        .from('courses')
        .select(`*, course_modules (*, course_lessons (*))`)
        .eq('id', courseId)
        .single();

      if (error) {
        console.error("Error:", error.message);
      } else {
        // Ordenar módulos y lecciones
        if (data.course_modules) {
          data.course_modules.sort((a: any, b: any) => a.sort_order - b.sort_order);
          data.course_modules.forEach((mod: any) => {
            if (mod.course_lessons) {
              mod.course_lessons.sort((a: any, b: any) => a.sort_order - b.sort_order);
            }
          });
        }
        setCourse(data);
      }
      setLoading(false);
    }
    fetchCourse();
  }, [params]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando...</div>;

  if (!course) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-4">Curso no encontrado 🤒</h1>
        <Link href="/cursos"><Button variant="outline">Volver al catálogo</Button></Link>
      </div>
    );
  }

  return (
    // CAMBIO 1: Quitamos el pt-24 para que no haya espacio negro arriba
    <div className="min-h-screen bg-black text-white pb-20">
      
      {/* PORTADA HERO (Ahora más alta y pegada al techo) */}
      <div className="relative w-full h-[65vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        
        {/* Imagen de Fondo */}
        {course.image_url && (
           <div className="absolute inset-0 z-0">
             {/* Gradiente para oscurecer la imagen y que el texto se lea bien */}
             <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black z-10" />
             <img 
               src={course.image_url} 
               alt={course.title} 
               className="w-full h-full object-cover opacity-80" 
             />
           </div>
        )}

        {/* Contenido Central */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-10">
          <span className="inline-block py-1 px-3 rounded-full bg-cyan-500/20 text-cyan-300 text-sm font-bold uppercase tracking-wider mb-6 border border-cyan-500/30">
            {course.modality || 'Online'}
          </span>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white drop-shadow-lg leading-tight">
            {course.title}
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-200 max-w-3xl mx-auto mb-10 font-light leading-relaxed">
            {course.description}
          </p>
          
          {/* Caja de Precio y Botón (Estilo flotante) */}
          <div className="inline-flex flex-col md:flex-row items-center gap-6 bg-white/10 backdrop-blur-md p-2 pr-2 pl-8 rounded-full border border-white/20 shadow-2xl">
             <div className="text-left">
               <p className="text-xs text-gray-300 uppercase tracking-widest font-semibold">Precio</p>
               <div className="flex items-baseline gap-1">
                 <span className="text-xl font-bold text-green-400">Acceso Gratuito</span>
                 <span className="text-sm text-gray-300">🎉</span>
               </div>
             </div>
             <Button variant="primary" size="lg" className="rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-cyan-500/50 transition-all">
               ¡Acceso Gratuito!
             </Button>
          </div>
        </div>
      </div>

      {/* SECCIÓN DEL TEMARIO (Contenido) */}
      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-30">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span>📚</span> Plan de Estudios
          </h2>
          
          <div className="space-y-4">
            {course.course_modules?.map((mod: any, index: number) => (
              <div key={mod.id} className="group border border-gray-800 bg-black/40 rounded-xl overflow-hidden hover:border-gray-700 transition">
                <div className="p-5 flex justify-between items-center cursor-default">
                   <h3 className="font-bold text-lg text-gray-200">
                     <span className="text-cyan-500 mr-3 opacity-70">0{index + 1}.</span> 
                     {mod.title}
                   </h3>
                </div>
                {/* Lista de lecciones (con diseño más limpio) */}
                <div className="border-t border-gray-800/50">
                  {mod.course_lessons?.map((lesson: any) => (
                    <div key={lesson.id} className="px-6 py-3 flex gap-4 items-center text-gray-400 hover:text-white hover:bg-white/5 transition text-sm">
                      <span className="text-lg opacity-50">‣</span> 
                      {lesson.title}
                    </div>
                  ))}
                  {(!mod.course_lessons || mod.course_lessons.length === 0) && (
                    <div className="px-6 py-3 text-gray-600 italic text-xs">Contenido en preparación...</div>
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