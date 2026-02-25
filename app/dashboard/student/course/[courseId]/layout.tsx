'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { supabaseGet } from '@/utils/supabase/fetch';
import { createClient } from '@/utils/supabase/client';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Play,
  Menu,
  X
} from 'lucide-react';

interface UnitData {
  id: string;
  title: string;
  order_index: number;
  topics: TopicData[];
  isCompleted: boolean;
  completedTopics: number;
  totalTopics: number;
}

interface TopicData {
  id: string;
  title: string;
  order_index: number;
  estimated_minutes: number;
  unit_id: string;
}

export default function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const [courseId, setCourseId] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [units, setUnits] = useState<UnitData[]>([]);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);

  const supabase = createClient();

  const loadCourseData = useCallback(async (cId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      // Load course title
      const courseArr = await supabaseGet(`courses?id=eq.${cId}&select=title`);
      if (courseArr?.[0]) setCourseTitle(courseArr[0].title);

      // Load units
      const unitsData = await supabaseGet(
        `course_units?course_id=eq.${cId}&order=order_index.asc&select=*`
      );

      // Load topics
      const topicsData = await supabaseGet(
        `unit_topics?course_id=eq.${cId}&order=order_index.asc&select=id,title,order_index,estimated_minutes,unit_id`
      );

      // Load progress
      const progressData = await supabaseGet(
        `topic_progress?course_id=eq.${cId}&student_id=eq.${userId}&completed=eq.true&select=topic_id`
      ).catch(() => []);

      const completedIds = new Set<string>((progressData || []).map((p: any) => p.topic_id));
      setCompletedTopicIds(completedIds);

      // Build hierarchical structure
      const builtUnits: UnitData[] = (unitsData || []).map((unit: any) => {
        const unitTopics = (topicsData || []).filter((t: any) => t.unit_id === unit.id);
        const completedCount = unitTopics.filter((t: any) => completedIds.has(t.id)).length;
        return {
          id: unit.id,
          title: unit.title,
          order_index: unit.order_index,
          topics: unitTopics,
          isCompleted: unitTopics.length > 0 && completedCount === unitTopics.length,
          completedTopics: completedCount,
          totalTopics: unitTopics.length,
        };
      });

      setUnits(builtUnits);

      // Expand first incomplete unit by default
      const firstIncomplete = builtUnits.find(u => !u.isCompleted);
      if (firstIncomplete) {
        setExpandedUnits(new Set([firstIncomplete.id]));
      } else if (builtUnits.length > 0) {
        setExpandedUnits(new Set([builtUnits[0].id]));
      }

      setLoading(false);
    } catch (error) {
      console.error('[CourseLayout] Error loading course data:', error);
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const resolvedParams = await params;
      const cId = resolvedParams.courseId;
      setCourseId(cId);
      await loadCourseData(cId);
    }
    init();
  }, [params, loadCourseData]);

  // Reload progress periodically
  useEffect(() => {
    if (!courseId) return;

    const reloadProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        const progressData = await supabaseGet(
          `topic_progress?course_id=eq.${courseId}&student_id=eq.${userId}&completed=eq.true&select=topic_id`
        ).catch(() => []);

        const completedIds = new Set<string>((progressData || []).map((p: any) => p.topic_id));
        setCompletedTopicIds(completedIds);

        setUnits(prev => prev.map(unit => {
          const completedCount = unit.topics.filter(t => completedIds.has(t.id)).length;
          return {
            ...unit,
            isCompleted: unit.topics.length > 0 && completedCount === unit.topics.length,
            completedTopics: completedCount,
          };
        }));
      } catch {
        // Silent fail for progress reload
      }
    };

    const handleVisibility = () => { if (!document.hidden) reloadProgress(); };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', reloadProgress);
    const interval = setInterval(() => { if (!document.hidden) reloadProgress(); }, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', reloadProgress);
      clearInterval(interval);
    };
  }, [courseId, supabase]);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm">Cargando curso...</p>
        </div>
      </div>
    );
  }

  const totalTopics = units.reduce((sum, u) => sum + u.totalTopics, 0);
  const totalCompleted = units.reduce((sum, u) => sum + u.completedTopics, 0);
  const progressPercent = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-bold text-gray-200 text-sm mb-2">Contenido del Curso</h2>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-cyan-400 font-medium">{progressPercent}%</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{totalCompleted}/{totalTopics} temas</p>
      </div>

      <div className="pb-10 overflow-y-auto flex-1">
        {units.map((unit, index) => (
          <div key={unit.id}>
            <button
              onClick={() => toggleUnit(unit.id)}
              className="w-full px-4 py-3 bg-[#0a0f1a]/50 text-xs font-bold uppercase tracking-wider border-b border-gray-800 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-gray-400 truncate flex-1 text-left">
                {index + 1}. {unit.title}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {unit.isCompleted ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <span className="text-gray-500 text-xs">
                    {unit.completedTopics}/{unit.totalTopics}
                  </span>
                )}
                {expandedUnits.has(unit.id)
                  ? <ChevronDown className="w-4 h-4 text-gray-500" />
                  : <ChevronRight className="w-4 h-4 text-gray-500" />
                }
              </div>
            </button>

            {expandedUnits.has(unit.id) && (
              <div className="bg-[#030712]/50">
                {unit.topics.length === 0 ? (
                  <p className="text-gray-600 text-xs text-center py-4">Sin temas</p>
                ) : (
                  unit.topics.map((topic) => {
                    const isCompleted = completedTopicIds.has(topic.id);
                    return (
                      <Link
                        key={topic.id}
                        href={`/dashboard/student/course/${courseId}/topic/${topic.id}`}
                        onClick={() => setMobileOpen(false)}
                        className={`block px-4 py-3 border-b border-gray-800/50 transition-colors hover:bg-gray-800/30 ${
                          isCompleted ? 'bg-green-900/10' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <Play className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm ${isCompleted ? 'text-green-300' : 'text-gray-300'}`}>
                              {topic.title}
                            </span>
                            <p className="text-xs text-gray-600 mt-0.5">{topic.estimated_minutes || 30} min</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-[#030712] text-white overflow-hidden">
      <header className="h-14 border-b border-gray-800 flex items-center px-4 md:px-6 bg-[#0a0f1a] shrink-0 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/student" className="text-gray-400 hover:text-white transition text-sm whitespace-nowrap">
            ← Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700"></div>
          <h1 className="font-bold text-sm md:text-base truncate">{courseTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs text-gray-500">{progressPercent}% completado</span>
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white transition bg-gray-800 rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Desktop sidebar */}
        <aside className="w-80 bg-[#0a0f1a] border-l border-gray-800 hidden md:flex flex-col shrink-0 overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-[#0a0f1a] border-l border-gray-800 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <span className="font-bold text-gray-200 text-sm">Contenido</span>
                <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
