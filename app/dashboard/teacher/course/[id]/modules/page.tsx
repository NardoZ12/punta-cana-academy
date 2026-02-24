'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft, BookOpen, Plus, ChevronRight, GripVertical } from 'lucide-react';

interface CourseModule {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  course_id: string;
}

export default function CourseModulesPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user, loading: authLoading } = useAuthContext();
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    
    const supabase = createClient();
    async function load() {
      const [courseRes, modulesRes] = await Promise.all([
        supabase.from('courses').select('title').eq('id', courseId).single(),
        supabase.from('course_modules').select('*').eq('course_id', courseId).order('sort_order')
      ]);
      setCourseTitle(courseRes.data?.title || 'Curso');
      setModules(modulesRes.data || []);
      setLoading(false);
    }
    load();
  }, [authLoading, user, courseId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-40 bg-gray-800 rounded"></div>
        <div className="h-8 w-64 bg-gray-800 rounded"></div>
        {[1,2,3].map(i => (
          <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="h-5 w-48 bg-gray-800 rounded mb-2"></div>
            <div className="h-4 w-full bg-gray-800/50 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        href="/dashboard/teacher/manage-courses"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Mis Cursos
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Módulos</h1>
          <p className="text-gray-400 mt-1">{courseTitle}</p>
        </div>
        <Link
          href={`/dashboard/teacher/course/${courseId}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Gestionar en Editor
        </Link>
      </div>

      {modules.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin módulos aún</h3>
          <p className="text-gray-400 mb-6">Crea módulos para organizar el contenido de tu curso.</p>
          <Link
            href={`/dashboard/teacher/course/${courseId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Ir al Editor del Curso
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod, index) => (
            <div key={mod.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex items-center gap-4 hover:border-cyan-500/30 transition-colors">
              <GripVertical className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <div className="w-8 h-8 bg-cyan-600/20 text-cyan-400 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{mod.title}</h3>
                {mod.description && (
                  <p className="text-sm text-gray-400 truncate mt-1">{mod.description}</p>
                )}
              </div>
              <Link
                href={`/dashboard/teacher/course/${courseId}/edit`}
                className="text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
