'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft, PlayCircle, Plus, ChevronRight, Video, FileText, LayoutList } from 'lucide-react';

export default function CourseLessonsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user, loading: authLoading } = useAuthContext();
  const [units, setUnits] = useState<any[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const supabase = createClient();
    async function load() {
      // Leemos la NUEVA estructura: course_units -> unit_topics -> topic_resources
      const [courseRes, unitsRes] = await Promise.all([
        supabase.from('courses').select('title').eq('id', courseId).single(),
        supabase.from('course_units').select(`
          id, title, order_index,
          topics:unit_topics(
            id, title, estimated_minutes, is_published, order_index,
            resources:topic_resources(video_url, pdf_url)
          )
        `).eq('course_id', courseId).order('order_index')
      ]);
      
      setCourseTitle(courseRes.data?.title || 'Curso');
      
      // Ordenar los temas numéricamente
      const loadedUnits = unitsRes.data || [];
      loadedUnits.forEach(u => {
        if (u.topics) {
          u.topics.sort((a: any, b: any) => a.order_index - b.order_index);
        }
      });
      
      setUnits(loadedUnits);
      setLoading(false);
    }
    load();
  }, [authLoading, user, courseId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
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

  const totalTopics = units.reduce((acc, u) => acc + (u.topics?.length || 0), 0);

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
          <h1 className="text-2xl font-bold text-white">Temario del Curso</h1>
          <p className="text-gray-400 mt-1">{courseTitle} • {totalTopics} temas en total</p>
        </div>
        <Link
          href={`/dashboard/teacher/course/${courseId}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Editar Temario
        </Link>
      </div>

      {units.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
          <LayoutList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin contenido aún</h3>
          <p className="text-gray-400 mb-6">Usa el editor del curso para crear unidades y temas.</p>
          <Link
            href={`/dashboard/teacher/course/${courseId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Ir al Editor del Curso
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {units.map((unit, uIndex) => (
            <div key={unit.id} className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
              <div className="bg-gray-900/50 p-4 border-b border-[#30363d] flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-900/50 text-cyan-400 rounded-lg flex items-center justify-center font-bold text-sm">
                  {uIndex + 1}
                </div>
                <h2 className="text-lg font-semibold text-white">{unit.title}</h2>
              </div>
              
              <div className="divide-y divide-[#30363d]">
                {!unit.topics || unit.topics.length === 0 ? (
                  <div className="p-4 text-gray-500 text-sm text-center">No hay temas en esta unidad</div>
                ) : (
                  unit.topics.map((topic: any, tIndex: number) => {
                    // Detectar qué tipo de recursos tiene
                    const hasVideo = topic.resources && Array.isArray(topic.resources) ? topic.resources[0]?.video_url : topic.resources?.video_url;
                    const hasPdf = topic.resources && Array.isArray(topic.resources) ? topic.resources[0]?.pdf_url : topic.resources?.pdf_url;
                    
                    return (
                      <div key={topic.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                        <div className="text-gray-500 text-sm font-medium w-6 text-center">
                          {uIndex + 1}.{tIndex + 1}
                        </div>
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          {hasVideo ? (
                            <Video className="w-5 h-5 text-cyan-400" />
                          ) : hasPdf ? (
                            <FileText className="w-5 h-5 text-orange-400" />
                          ) : (
                            <PlayCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{topic.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              {topic.estimated_minutes || 30} min
                            </span>
                            {hasVideo && <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">Video</span>}
                            {hasPdf && <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">PDF</span>}
                            {!topic.is_published && <span className="text-xs text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded">Borrador</span>}
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/teacher/course/${courseId}/edit`}
                          className="text-gray-500 hover:text-cyan-400 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
