'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';

export default function CoursesPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    // Consultamos TODOS los cursos que estén publicados
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (data) setCourses(data);
    setLoading(false);
  }

  // Filtramos los cursos según lo que escribas en el buscador
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-4">
      
      {/* HEADER + BUSCADOR */}
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Explora nuestros <span className="text-cyan-400">Cursos</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Formación técnica y de idiomas diseñada para el mercado laboral de Punta Cana. ¡Todos nuestros cursos son completamente GRATUITOS! 🎉
        </p>
        
        {/* Barra de Búsqueda */}
        <div className="max-w-xl mx-auto relative">
          <input 
            type="text" 
            placeholder="🔍 ¿Qué quieres aprender hoy?" 
            className="w-full px-6 py-4 rounded-full bg-gray-900 border border-gray-800 text-white focus:border-cyan-500 outline-none transition shadow-lg shadow-cyan-900/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTA DE CURSOS */}
      <div className="max-w-6xl mx-auto">
        
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse">Cargando catálogo...</div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500 transition duration-300 group flex flex-col hover:-translate-y-1">
                
                {/* Imagen */}
                <div className="relative h-56 w-full bg-gray-800 overflow-hidden">
                  {course.image_url ? (
                    <img 
                      src={course.image_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-5xl">📚</div>
                  )}
                  {/* Badge de Modalidad */}
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-gray-700 uppercase tracking-wide">
                    {course.modality || 'Online'}
                  </div>
                </div>

                {/* Información */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">
                       {course.title}
                     </h3>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-1">
                    {course.description || 'Sin descripción disponible.'}
                  </p>

                  <div className="pt-4 border-t border-gray-800 flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Precio</p>
                      <p className="text-xl font-bold text-green-400">
                        GRATIS 🎉
                      </p>
                    </div>
                    <Link href={`/cursos/${course.id}`}> {/* Enlace preparado para el futuro detalle */}
                      <Button variant="primary" size="sm">Ver Curso</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // ESTADO VACÍO
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
            <div className="text-5xl mb-4">🕵️‍♂️</div>
            <h3 className="text-xl font-bold text-white mb-2">No encontramos resultados</h3>
            <p className="text-gray-400">Intenta con otra palabra clave o revisa más tarde.</p>
          </div>
        )}
      </div>
    </div>
  );
}