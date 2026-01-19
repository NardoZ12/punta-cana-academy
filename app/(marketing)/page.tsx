'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client'; // Asegúrate que esta ruta sea correcta en tu proyecto
import { Button } from '@/components/atoms/Button';

export const FeaturedCourses = () => {
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      // Buscamos solo los cursos PUBLICADOS
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true) // <--- EL FILTRO CLAVE
        .order('created_at', { ascending: false })
        .limit(3); // Mostramos los 3 más recientes

      if (!error && data) {
        setCourses(data);
      }
      setLoading(false);
    }

    fetchCourses();
  }, []);

  // Si está cargando, mostramos un esqueleto o texto simple
  if (loading) {
    return (
      <section className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 animate-pulse">Cargando cursos disponibles...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Cursos <span className="text-cyan-400">Destacados</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Descubre nuestros programas más populares diseñados para impulsar tu carrera en Punta Cana. ¡Todos los cursos son completamente GRATUITOS! 🎉
          </p>
        </div>

        {/* LISTA DE CURSOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {courses.length > 0 ? (
            courses.map((course) => (
              <div key={course.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition duration-300 group flex flex-col">
                
                {/* Imagen del Curso */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-800">
                  {course.image_url ? (
                    <img 
                      src={course.image_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">📚</div>
                  )}
                  <div className="absolute top-4 left-4 bg-cyan-900/80 backdrop-blur-sm text-cyan-300 text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {course.modality || 'Online'}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition">
                    {course.title}
                  </h3>
                  
                  {/* Nivel y Detalles */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      📊 {course.level || 'Todos los niveles'}
                    </span>
                  </div>

                  {/* Descripción Corta (Truncada) */}
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1">
                    {course.description || 'Sin descripción disponible.'}
                  </p>

                  {/* Precio y Botón */}
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-800">
                    <div>
                      <span className="text-xs text-gray-500 block">Precio</span>
                      <span className="text-lg font-bold text-green-400">
                        GRATIS 🎉
                      </span>
                    </div>
                    <Link href={`/cursos`}> 
                    {/* Nota: Idealmente esto iría a /cursos/${course.id} en el futuro */}
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // ESTADO VACÍO (Si no hay cursos publicados)
            <div className="col-span-3 text-center py-10 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-400 text-lg">No hay cursos destacados en este momento.</p>
              <p className="text-gray-600 text-sm mt-2">¡Vuelve pronto para ver las novedades!</p>
            </div>
          )}

        </div>

        {/* Botón Ver Todos */}
        <div className="text-center mt-12">
          <Link href="/cursos">
            <button className="text-gray-400 hover:text-white flex items-center gap-2 mx-auto transition">
              Explorar todos los cursos <span>→</span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

// Componente principal de la página
export default function HomePage() {
  return <FeaturedCourses />;
}