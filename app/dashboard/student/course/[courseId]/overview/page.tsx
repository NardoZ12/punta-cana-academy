'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  BookOpen,
  Clock,
  FileText,
  Play,
  CheckCircle,
  TrendingUp,
  Rocket,
  GraduationCap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface CourseInfo {
  title: string;
  description: string;
  image_url: string | null;
  instructor_name: string | null;
}

interface TopicInfo {
  id: string;
  title: string;
  unit_id: string;
  estimated_minutes: number;
  order_index: number;
}

interface UnitInfo {
  id: string;
  title: string;
  order_index: number;
}

interface ResumeInfo {
  topicId: string;
  topicTitle: string;
  unitTitle: string;
}

export default function StudentCourseOverview() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [unitCount, setUnitCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const supabase = createClient();

  const loadCourseInfo = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const token = session?.access_token || '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': key,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch course
      const courseRes = await fetch(
        `${url}/rest/v1/courses?id=eq.${courseId}&select=title,description,image_url,instructor_id`,
        { headers }
      );
      const courseArr = courseRes.ok ? await courseRes.json() : [];
      const courseData = courseArr?.[0];

      if (courseData) {
        let instructorName = null;
        if (courseData.instructor_id) {
          try {
            const profRes = await fetch(
              `${url}/rest/v1/profiles?id=eq.${courseData.instructor_id}&select=full_name`,
              { headers }
            );
            const profArr = profRes.ok ? await profRes.json() : [];
            instructorName = profArr?.[0]?.full_name || null;
          } catch { /* silent */ }
        }
        setCourse({
          title: courseData.title,
          description: courseData.description,
          image_url: courseData.image_url,
          instructor_name: instructorName,
        });
      }

      // Fetch units
      const unitsRes = await fetch(
        `${url}/rest/v1/course_units?course_id=eq.${courseId}&order=order_index.asc&select=id,title,order_index`,
        { headers }
      );
      const units: UnitInfo[] = unitsRes.ok ? await unitsRes.json() : [];
      setUnitCount(units.length);

      // Fetch topics
      const topicsRes = await fetch(
        `${url}/rest/v1/unit_topics?course_id=eq.${courseId}&order=order_index.asc&select=id,title,order_index,estimated_minutes,unit_id`,
        { headers }
      );
      const topics: TopicInfo[] = topicsRes.ok ? await topicsRes.json() : [];
      setTotalCount(topics.length);
      const estMinutes = topics.reduce((s, t) => s + (t.estimated_minutes || 30), 0);
      setTotalHours(Math.ceil(estMinutes / 60));

      // Fetch progress
      let completedIds = new Set<string>();
      let lastTopicId: string | null = null;
      if (userId) {
        try {
          const progRes = await fetch(
            `${url}/rest/v1/topic_progress?course_id=eq.${courseId}&student_id=eq.${userId}&completed=eq.true&select=topic_id`,
            { headers }
          );
          const progArr = progRes.ok ? await progRes.json() : [];
          completedIds = new Set((progArr || []).map((p: any) => p.topic_id));
        } catch { /* silent */ }

        try {
          const lastRes = await fetch(
            `${url}/rest/v1/topic_progress?course_id=eq.${courseId}&student_id=eq.${userId}&order=updated_at.desc&limit=1&select=topic_id`,
            { headers }
          );
          const lastArr = lastRes.ok ? await lastRes.json() : [];
          lastTopicId = lastArr?.[0]?.topic_id || null;
        } catch { /* silent */ }
      }

      setCompletedCount(completedIds.size);
      const total = topics.length;
      const pct = total > 0 ? Math.round((completedIds.size / total) * 100) : 0;
      setProgressPercent(pct);
      setHasStarted(completedIds.size > 0);
      setAllCompleted(total > 0 && completedIds.size === total);

      // Find resume topic
      let resume: ResumeInfo | null = null;

      // Priority 1: last accessed incomplete topic
      if (lastTopicId && !completedIds.has(lastTopicId)) {
        const topic = topics.find(t => t.id === lastTopicId);
        const unit = topic ? units.find(u => u.id === topic.unit_id) : null;
        if (topic && unit) {
          resume = { topicId: topic.id, topicTitle: topic.title, unitTitle: unit.title };
        }
      }

      // Priority 2: first incomplete topic
      if (!resume) {
        for (const topic of topics) {
          if (!completedIds.has(topic.id)) {
            const unit = units.find(u => u.id === topic.unit_id);
            resume = {
              topicId: topic.id,
              topicTitle: topic.title,
              unitTitle: unit?.title || '',
            };
            break;
          }
        }
      }

      // Priority 3: first topic (all completed)
      if (!resume && topics.length > 0) {
        const unit = units.find(u => u.id === topics[0].unit_id);
        resume = {
          topicId: topics[0].id,
          topicTitle: topics[0].title,
          unitTitle: unit?.title || '',
        };
      }

      setResumeInfo(resume);
    } catch (err) {
      console.error('[CourseOverview] Error loading:', err);
    } finally {
      setLoaded(true);
    }
  }, [courseId, supabase]);

  useEffect(() => {
    loadCourseInfo();
  }, [loadCourseInfo]);

  /* ------------------------------------------------------------------ */
  /*  Loading state                                                     */
  /* ------------------------------------------------------------------ */
  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin" />
          </div>
          <p className="text-gray-400 text-sm">Cargando curso...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Main view — always renders (no error state blocks the page)       */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* ===== Course Cover / Hero ===== */}
        <section className="relative rounded-2xl overflow-hidden border border-gray-800 bg-[#0a0f1a] mb-8">
          {/* Cover image */}
          {course?.image_url ? (
            <div className="relative">
              <img
                src={course.image_url}
                alt={course?.title || 'Curso'}
                className="w-full h-48 sm:h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/40 to-transparent" />
            </div>
          ) : (
            <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-cyan-900/30 via-blue-900/20 to-[#0a0f1a] flex items-center justify-center">
              <GraduationCap className="w-20 h-20 text-cyan-500/30" />
            </div>
          )}

          {/* Course info overlay */}
          <div className="p-6 sm:p-8 -mt-16 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
              {course?.title || 'Curso'}
            </h1>

            {course?.description && (
              <p className="text-gray-300 text-sm sm:text-base mb-5 leading-relaxed max-w-2xl">
                {course.description}
              </p>
            )}

            {/* Stats pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400 mb-6">
              {unitCount > 0 && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700/50">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  {unitCount} {unitCount === 1 ? 'unidad' : 'unidades'}
                </span>
              )}
              {totalCount > 0 && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700/50">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  {totalCount} temas
                </span>
              )}
              {totalHours > 0 && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700/50">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  ~{totalHours}h
                </span>
              )}
              {course?.instructor_name && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700/50">
                  <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                  {course.instructor_name}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-gray-300">
                      {completedCount} de {totalCount} temas completados
                    </span>
                  </div>
                  <span className="text-lg font-bold text-white">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===== CTA: Start / Continue / Completed ===== */}
        {resumeInfo && (
          <section className="mb-8">
            <Link
              href={`/dashboard/student/course/${courseId}/topic/${resumeInfo.topicId}`}
              className="group block bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/25 rounded-2xl p-6 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                  {allCompleted ? (
                    <CheckCircle className="w-7 h-7 text-white" />
                  ) : hasStarted ? (
                    <Play className="w-7 h-7 text-white" />
                  ) : (
                    <Rocket className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-white mb-0.5">
                    {allCompleted
                      ? '¡Curso completado!'
                      : hasStarted
                      ? 'Continuar donde lo dejaste'
                      : '¡Comienza tu aprendizaje!'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {allCompleted ? (
                      'Has terminado todos los temas. Puedes revisarlos cuando quieras.'
                    ) : (
                      <>
                        <span className="text-cyan-300">{resumeInfo.unitTitle}</span>
                        {' → '}
                        {resumeInfo.topicTitle}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all whitespace-nowrap">
                  {allCompleted ? 'Revisar' : hasStarted ? 'Continuar' : 'Comenzar'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ===== Guidance: Select from sidebar ===== */}
        <section className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <Sparkles className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            Selecciona un tema para comenzar
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
            Usa el panel de <span className="text-cyan-300 font-medium">Contenido del Curso</span> en
            el lateral derecho para navegar entre las unidades y temas disponibles.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <BookOpen className="w-4 h-4" />
            <span>Cada tema incluye material de lectura, videos y evaluaciones</span>
          </div>
        </section>

      </div>
    </div>
  );
}
