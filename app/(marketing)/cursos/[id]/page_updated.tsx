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
    <div className="min-h-screen bg-black text-white pb-20">
      
      {/* TRUCO DE DISEÑO:
          Agregamos '-mt-24' para subir la imagen 96px y eliminar completamente la línea negra.
          Esto hace que la imagen quede perfectamente detrás del menú transparente.
      */}
      <div className="relative w-full h-[75vh] min-h-[550px] flex items-center justify-center overflow-hidden -mt-24">
        
        {/* Imagen de Fondo */}
        {course.image_url && (
           <div className="absolute inset-0 z-0">
             {/* Gradiente reforzado arriba para que el menú se lea bien sobre la foto */}
             <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black z-10" />
             <img 
               src={course.image_url} 
               alt={course.title} 
               className="w-full h-full object-cover opacity-90" 
             />
           </div>
        )}

        {/* Contenido Central (Con padding-top extra para compensar la subida) */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-24">
          <span className="inline-block py-1 px-3 rounded-full bg-cyan-500/20 text-cyan-300 text-sm font-bold uppercase tracking-wider mb-6 border border-cyan-500/30 backdrop-blur-md">
            {course.modality || 'Online'}
          </span>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white drop-shadow-2xl leading-tight">
            {course.title}
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-100 max-w-3xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md">
            {course.description}
          </p>
          
          {/* Caja de Precio Flotante */}
          <div className="inline-flex flex-col md:flex-row items-center gap-6 bg-white/10 backdrop-blur-xl p-2 pr-2 pl-8 rounded-full border border-white/20 shadow-2xl transition hover:bg-white/15">
             <div className="text-left">
               <p className="text-xs text-gray-300 uppercase tracking-widest font-semibold">Precio</p>
               <div className="flex items-baseline gap-1">
                 <span className="text-xl font-bold text-green-400">Acceso Gratuito</span>
                 <span className="text-sm text-gray-300">🎉</span>
               </div>
             </div>
             <Button variant="primary" size="lg" className="rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-cyan-500/50 transition-all transform hover:-translate-y-1">
               ¡Acceso Gratuito!
             </Button>
          </div>
        </div>
      </div>

      {/* SECCIÓN DEL TEMARIO */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-30">
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
                      <div className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-xs text-gray-600">
                        ▶
                      </div>
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

      {/* Botones de Acción Adicional */}
      <div className="max-w-4xl mx-auto px-4 mt-10">
        <div className="flex space-x-3">
          <Button variant="secondary">Asignar Tarea</Button>
          <Button>Crear Examen</Button>
        </div>
      </div>

    </div>
  );
}