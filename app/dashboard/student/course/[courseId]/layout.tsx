'use client';

import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const [courseId, setCourseId] = useState<string>('');
  const [course, setCourse] = useState<any>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadCourseData() {
      const resolvedParams = await params;
      const courseIdValue = resolvedParams.courseId;
      setCourseId(courseIdValue);

      // Obtener curso y datos del usuario
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: courseData } = await supabase
        .from('courses')
        .select('title, course_modules(*, course_lessons(*))')
        .eq('id', courseIdValue)
        .single();

      if (!courseData) {
        redirect('/dashboard/student');
        return;
      }

      setCourse(courseData);

      // Obtener progreso del estudiante para este curso
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('student_id', user?.id)
        .eq('course_id', courseIdValue)
        .single();

      setEnrollment(enrollmentData);

      // Obtener lecciones completadas
      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('student_id', user?.id)
        .eq('completed', true);

      setCompletedLessonIds(completedLessons?.map(l => l.lesson_id) || []);
      setLoading(false);
    }

    loadCourseData();
  }, []);

  // Agregar useEffect para actualizar cuando se marca una lección como completada
  useEffect(() => {
    const handleStorageChange = () => {
      // Recargar datos cuando hay cambios
      window.location.reload();
    };

    // Escuchar cambios en el localStorage (opcional)
    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar cambios de focus para actualizar cuando se regresa a la pestaña
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [completedLessonIds]);

  const toggleMobileMenu = () => {
    const sidebar = document.getElementById('mobile-sidebar');
    sidebar?.classList.toggle('translate-x-full');
  };

  const closeMobileMenu = () => {
    const sidebar = document.getElementById('mobile-sidebar');
    sidebar?.classList.add('translate-x-full');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p>Cargando curso...</p>
    </div>;
  }

  if (!course) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p>Curso no encontrado</p>
    </div>;
  }

  const modules = course.course_modules?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((mod: any, moduleIndex: number) => {
    const sortedLessons = mod.course_lessons.sort((a: any, b: any) => a.sort_order - b.sort_order);
    
    // Verificar si el módulo anterior está completo (para desbloquearlo)
    let isUnlocked = moduleIndex === 0; // El primer módulo siempre está desbloqueado
    
    if (moduleIndex > 0) {
      // Obtener el módulo anterior del array ya ordenado
      const previousModuleIndex = moduleIndex - 1;
      const sortedModules = course.course_modules.sort((a: any, b: any) => a.sort_order - b.sort_order);
      const previousModule = sortedModules[previousModuleIndex];
      
      if (previousModule) {
        const previousModuleLessons = previousModule.course_lessons;
        const previousModuleCompleted = previousModuleLessons.every((lesson: any) => 
          completedLessonIds.includes(lesson.id)
        );
        isUnlocked = previousModuleCompleted;
      }
    }

    const completedLessonsCount = sortedLessons.filter((lesson: any) => completedLessonIds.includes(lesson.id)).length;
    const isModuleCompleted = completedLessonsCount === sortedLessons.length && sortedLessons.length > 0;

    return {
      ...mod,
      course_lessons: sortedLessons,
      isUnlocked,
      isCompleted: isModuleCompleted,
      completedLessons: completedLessonsCount,
      totalLessons: sortedLessons.length
    };
  });

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <header className="h-16 border-b border-gray-800 flex items-center px-4 md:px-6 bg-gray-900 shrink-0 justify-between">
        <div className="flex items-center gap-2 md:gap-4">
           <Link href="/dashboard/student" className="text-gray-400 hover:text-white transition text-sm md:text-base">← Dashboard</Link>
           <div className="h-6 w-px bg-gray-700 mx-1 md:mx-2"></div>
           <h1 className="font-bold text-sm md:text-lg truncate max-w-xs md:max-w-xl">{course.title}</h1>
        </div>
        
        {/* BOTÓN MENÚ MÓVIL */}
        <button 
          id="mobile-menu-btn"
          className="md:hidden p-2 text-gray-400 hover:text-white transition bg-gray-800 rounded-lg"
          onClick={toggleMobileMenu}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="hidden md:block">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Modo Aula</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto bg-black relative">{children}</main>
        
        {/* SIDEBAR DESKTOP */}
        <aside className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto hidden md:block shrink-0">
           <div className="p-4 border-b border-gray-800"><h2 className="font-bold text-gray-200">Contenido del Curso</h2></div>
           <div className="pb-10">
              {modules?.map((mod: any, index: number) => (
                <div key={mod.id} className={`${!mod.isUnlocked ? 'opacity-50' : ''}`}>
                   <div className="px-4 py-3 bg-gray-800/50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 sticky top-0 flex items-center justify-between">
                      <span>Módulo {index + 1}: {mod.title}</span>
                      {mod.isCompleted ? (
                        <span className="text-green-400 text-xs flex items-center gap-1">
                          {mod.completedLessons}/{mod.totalLessons} ✓ Completado
                        </span>
                      ) : mod.isUnlocked ? (
                        <span className="text-blue-400 text-xs">
                          {mod.completedLessons}/{mod.totalLessons} 📚
                        </span>
                      ) : (
                        <span className="text-yellow-400 text-xs">🔒 Bloqueado</span>
                      )}
                   </div>
                   <div>
                      {mod.course_lessons.map((lesson: any, lessonIndex: number) => {
                        const isCompleted = completedLessonIds.includes(lesson.id);
                        const isModuleLocked = !mod.isUnlocked;
                        
                        // Lógica de desbloqueo de lecciones secuenciales
                        let isLessonLocked = isModuleLocked;
                        if (!isModuleLocked && lessonIndex > 0) {
                          const previousLesson = mod.course_lessons[lessonIndex - 1];
                          isLessonLocked = !completedLessonIds.includes(previousLesson.id);
                        }
                        
                        return (
                          <Link 
                            key={lesson.id} 
                            href={isLessonLocked ? '#' : `/dashboard/student/course/${courseId}/lesson/${lesson.id}`}
                            className={`block px-4 py-3 border-b border-gray-800 transition group ${
                              isLessonLocked 
                                ? 'cursor-not-allowed opacity-60' 
                                : 'hover:bg-gray-800'
                            } ${isCompleted ? 'bg-green-900/20' : ''}`}
                          >
                             <div className="flex items-start gap-3">
                                <div className="mt-0.5 min-w-[16px]">
                                  {isCompleted ? (
                                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  ) : isLessonLocked ? (
                                    <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-xs">🔒</div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-gray-600 group-hover:border-white transition"></div>
                                  )}
                                </div>
                                <div className={`text-sm transition ${
                                  isLessonLocked ? 'text-gray-500' : 'text-gray-300 group-hover:text-white'
                                } ${isCompleted ? 'text-green-300' : ''}`}>
                                  {lesson.title}
                                </div>
                             </div>
                          </Link>
                        );
                      })}
                   </div>
                </div>
              ))}
           </div>
        </aside>

        {/* SIDEBAR MÓVIL (OVERLAY) */}
        <div 
          id="mobile-sidebar"
          className="md:hidden fixed inset-0 z-50 transform translate-x-full transition-transform duration-300 ease-in-out"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={closeMobileMenu}
          ></div>
          
          {/* Sidebar content */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-gray-900 border-l border-gray-800 overflow-y-auto">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-bold text-gray-200">Contenido del Curso</h2>
              <button 
                className="text-gray-400 hover:text-white transition p-1"
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="pb-10">
              {modules?.map((mod: any, index: number) => (
                <div key={mod.id} className={`${!mod.isUnlocked ? 'opacity-50' : ''}`}>
                   <div className="px-4 py-3 bg-gray-800/50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 flex items-center justify-between">
                      <span>Módulo {index + 1}: {mod.title}</span>
                      {mod.isCompleted ? (
                        <span className="text-green-400 text-xs flex items-center gap-1">
                          {mod.completedLessons}/{mod.totalLessons} ✓ Completado
                        </span>
                      ) : mod.isUnlocked ? (
                        <span className="text-blue-400 text-xs">
                          {mod.completedLessons}/{mod.totalLessons} 📚
                        </span>
                      ) : (
                        <span className="text-yellow-400 text-xs">🔒 Bloqueado</span>
                      )}
                   </div>
                   <div>
                      {mod.course_lessons.map((lesson: any, lessonIndex: number) => {
                        const isCompleted = completedLessonIds.includes(lesson.id);
                        const isModuleLocked = !mod.isUnlocked;
                        
                        // Lógica de desbloqueo de lecciones secuenciales (versión móvil)
                        let isLessonLocked = isModuleLocked;
                        if (!isModuleLocked && lessonIndex > 0) {
                          const previousLesson = mod.course_lessons[lessonIndex - 1];
                          isLessonLocked = !completedLessonIds.includes(previousLesson.id);
                        }
                        
                        return (
                          <Link 
                            key={lesson.id} 
                            href={isLessonLocked ? '#' : `/dashboard/student/course/${courseId}/lesson/${lesson.id}`}
                            className={`block px-4 py-3 border-b border-gray-800 transition group ${
                              isLessonLocked 
                                ? 'cursor-not-allowed opacity-60' 
                                : 'hover:bg-gray-800'
                            } ${isCompleted ? 'bg-green-900/20' : ''}`}
                            onClick={!isLessonLocked ? closeMobileMenu : undefined}
                          >
                             <div className="flex items-start gap-3">
                                <div className="mt-0.5 min-w-[16px]">
                                  {isCompleted ? (
                                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  ) : isLessonLocked ? (
                                    <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-xs">🔒</div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-gray-600 group-hover:border-white transition"></div>
                                  )}
                                </div>
                                <div className={`text-sm transition ${
                                  isLessonLocked ? 'text-gray-500' : 'text-gray-300 group-hover:text-white'
                                } ${isCompleted ? 'text-green-300' : ''}`}>
                                  {lesson.title}
                                </div>
                             </div>
                          </Link>
                        );
                      })}
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* SCRIPT PARA INTERACTIVIDAD MÓVIL */}
      <script dangerouslySetInnerHTML={{
        __html: `
          function toggleMobileSidebar() {
            document.getElementById('mobile-sidebar').classList.toggle('translate-x-full');
          }
          
          document.addEventListener('DOMContentLoaded', function() {
            const mobileBtn = document.getElementById('mobile-menu-btn');
            if (mobileBtn) {
              mobileBtn.addEventListener('click', toggleMobileSidebar);
            }
          });
        `
      }} />
    </div>
  );
}