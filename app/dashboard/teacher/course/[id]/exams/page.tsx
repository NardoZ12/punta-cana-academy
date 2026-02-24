'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft, FileText, Plus, ChevronRight, Clock, CheckCircle } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string;
  course_id: string;
  time_limit_minutes: number | null;
  passing_score: number;
  is_published: boolean;
  created_at: string;
}

export default function CourseExamsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user, loading: authLoading } = useAuthContext();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const supabase = createClient();
    async function load() {
      const [courseRes, examsRes] = await Promise.all([
        supabase.from('courses').select('title').eq('id', courseId).single(),
        supabase.from('evaluations').select('*').eq('course_id', courseId).order('created_at', { ascending: false })
      ]);
      setCourseTitle(courseRes.data?.title || 'Curso');
      // If evaluations table doesn't exist yet, gracefully handle
      setExams(examsRes.data || []);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
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
          <h1 className="text-2xl font-bold text-white">Exámenes</h1>
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

      {exams.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin exámenes aún</h3>
          <p className="text-gray-400 mb-6">Crea evaluaciones para medir el progreso de tus estudiantes.</p>
          <Link
            href={`/dashboard/teacher/course/${courseId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Ir al Editor del Curso
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex items-center gap-4 hover:border-cyan-500/30 transition-colors">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{exam.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  {exam.time_limit_minutes && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exam.time_limit_minutes} min
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    Nota mínima: {exam.passing_score}%
                  </span>
                  {exam.is_published ? (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Publicado
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-500">Borrador</span>
                  )}
                </div>
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
