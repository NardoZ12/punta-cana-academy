'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client';

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('Profesor');
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    
    async function loadTeacherData() {
      try {
        // 1. Obtener usuario con timeout
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (userError || !user) {
           window.location.href = '/login';
           return;
        }

        // 2. Cargar perfil y cursos en paralelo para mayor velocidad
        const [profileResult, coursesResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, user_type') 
            .eq('id', user.id)
            .single(),
          supabase
            .from('courses')
            .select('id, title, description, image_url, is_published, created_at')
            .eq('instructor_id', user.id)
            .order('created_at', { ascending: false })
        ]);

        if (!mounted) return;

        // Verificar perfil
        if (profileResult.error) {
          setError(`Error obteniendo perfil: ${profileResult.error.message}`);
          setLoading(false);
          return;
        }
        
        if (profileResult.data?.user_type !== 'teacher') {
           setError(`No tienes permisos de profesor. Tu rol es: ${profileResult.data?.user_type || 'desconocido'}`);
           setLoading(false);
           return;
        }

        setTeacherName(profileResult.data.full_name || 'Profesor');
        setCourses(coursesResult.data || []);

      } catch (err: any) {
        if (mounted) {
          setError(`Error inesperado: ${err.message}`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTeacherData();

    return () => {
      mounted = false;
    };
  }, []);

  // --- RENDERIZADO ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-gray-400 text-sm">Cargando panel de profesor...</p>
        <p className="text-gray-600 text-xs mt-2">Esto puede tardar unos segundos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center text-white p-4">
        <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Error de Acceso</h1>
        <p className="text-gray-400 mb-6 text-center">{error}</p>
        <div className="text-xs text-gray-600 font-mono mb-6">
           (Asegúrate de que tu usuario tenga user_type = 'teacher' en la base de datos)
        </div>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
           <div>
             <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
               Panel de Profesor
             </h1>
             <p className="text-gray-400 mt-1">Bienvenido, {teacherName}</p>
           </div>
           <Link href="/dashboard/teacher/create-course">
             <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">
               + Crear Nuevo Curso
             </Button>
           </Link>
        </div>

        {/* Lista de Cursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {courses.length === 0 ? (
             <div className="col-span-full py-16 text-center border border-dashed border-gray-800 rounded-2xl bg-[#161b22]">
                <p className="text-gray-400 mb-4">Aún no has creado ningún curso.</p>
                <Link href="/dashboard/teacher/create-course">
                  <Button variant="outline">Comenzar ahora</Button>
                </Link>
             </div>
           ) : (
             courses.map(course => (
               <div key={course.id} className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden hover:border-cyan-500/30 transition shadow-lg">
                  <div className="h-40 bg-gray-800 relative">
                    {course.image_url ? (
                      <img src={course.image_url} alt={course.title} className="w-full h-full object-cover"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4">{course.description}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                       <span className={`text-xs px-2 py-1 rounded ${course.is_published ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                         {course.is_published ? 'Publicado' : 'Borrador'}
                       </span>
                       <Link href={`/dashboard/teacher/course/${course.id}/edit`}>
                         <span className="text-cyan-400 text-sm hover:underline cursor-pointer">Gestionar →</span>
                       </Link>
                    </div>
                  </div>
               </div>
             ))
           )}
        </div>

      </div>
    </div>
  );
}