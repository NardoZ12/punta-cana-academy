'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '../atoms/Button';

export const FeaturedCourses = () => {
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      // 1. Buscamos cursos PUBLICADOS en Supabase
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) setCourses(data);
      setLoading(false);
    }
    fetchCourses();
  }, []);

  if (loading) return <div className="py-20 text-center text-white">Cargando cursos...</div>;

  return (
    <section className="py-20 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Cursos <span className="text-cyan-400">Destacados</span>
          </h2>
          <p className="text-gray-400">Programas actualizados desde nuestra plataforma.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div key={course.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500 transition group flex flex-col">
                {/* Imagen */}
                <div className="h-48 w-full bg-gray-800 relative">
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">📚</div>
                  )}
                </div>
                {/* Texto */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <div className="mt-auto pt-4 border-t border-gray-800 flex justify-center">
                    <Link href="/cursos"><Button variant="outline" size="sm">Ver Detalles</Button></Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10 border border-dashed border-gray-700 rounded-xl">
              <p className="text-gray-400">No hay cursos publicados todavía.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};