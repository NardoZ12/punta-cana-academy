'use client';

import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

function getEmbedUrl(url: string | null) {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&enablejsapi=1`;
  }
  return url;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.lessonId as string;
  const courseId = params?.courseId as string;
  
  const [lesson, setLesson] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [isLastLessonOfModule, setIsLastLessonOfModule] = useState(false);
  const [nextModule, setNextModule] = useState<any>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadLessonData() {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: lessonData, error } = await supabase
        .from('course_lessons')
        .select('*, course_modules!inner(id, title, sort_order, course_id)')
        .eq('id', lessonId)
        .single();

      if (error || !lessonData) {
        setLesson(null);
        setLoading(false);
        return;
      }

      setLesson(lessonData);

      // Verificar si ya está completada
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('completed')
        .eq('student_id', user?.id)
        .eq('lesson_id', lessonId)
        .single();

      setIsCompleted(progress?.completed || false);

      // Obtener todas las lecciones del curso ordenadas
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id, title, sort_order, course_modules!inner(course_id, sort_order, title)')
        .eq('course_modules.course_id', courseId)
        .order('course_modules.sort_order', { referencedTable: 'course_modules' })
        .order('sort_order');

      if (courseLessons) {
        const currentIndex = courseLessons.findIndex(lesson => lesson.id === lessonId);
        const nextLessonData = courseLessons[currentIndex + 1];
        
        if (nextLessonData) {
          setNextLesson(nextLessonData);
        }

        // Verificar si es la última lección del módulo
        const currentModuleId = lessonData.course_modules.id;
        const currentModuleLessons = courseLessons.filter(l => 
          l.course_modules.sort_order === lessonData.course_modules.sort_order
        );
        
        const isLastInModule = currentModuleLessons[currentModuleLessons.length - 1]?.id === lessonId;
        setIsLastLessonOfModule(isLastInModule);

        // Si es la última del módulo, obtener el siguiente módulo
        if (isLastInModule && nextLessonData) {
          const nextModuleData = {
            id: nextLessonData.course_modules.id,
            title: nextLessonData.course_modules.title,
            firstLessonId: nextLessonData.id
          };
          setNextModule(nextModuleData);
        }
      }

      setLoading(false);
    }

    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId, supabase, courseId]);

  // Auto-tracking logic
  useEffect(() => {
    if (isCompleted || !lesson) return;

    let startTime = Date.now();
    let timeTracker: NodeJS.Timeout;

    // Rastrear tiempo en la página
    timeTracker = setInterval(() => {
      setWatchTime(Date.now() - startTime);
    }, 1000);

    // Rastrear scroll hasta el final
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setHasScrolledToEnd(true);
      }
    };

    // Rastrear finalización de video de YouTube
    const handleYouTubeMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'video-ended' || (data.info && data.info.playerState === 0)) {
          setVideoCompleted(true);
        }
      } catch (e) {
        // Ignorar errores de parsing
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('message', handleYouTubeMessage);

    return () => {
      clearInterval(timeTracker);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('message', handleYouTubeMessage);
    };
  }, [isCompleted, lesson]);

  // Auto-completar cuando se cumplen los criterios
  useEffect(() => {
    if (isCompleted || !lesson) return;

    const shouldAutoComplete = (
      videoCompleted || // Video completado
      (watchTime > 30000 && hasScrolledToEnd) || // 30 segundos + scroll completo
      watchTime > 120000 // 2 minutos mínimo (para lecciones largas sin video)
    );

    if (shouldAutoComplete) {
      handleAutoComplete();
    }
  }, [videoCompleted, watchTime, hasScrolledToEnd, isCompleted, lesson]);

  const handleAutoComplete = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });

      if (response.ok) {
        setIsCompleted(true);
        setShowCompletionModal(true);
        
        // Mostrar notificación de éxito
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('¡Lección completada! ✅', {
            body: 'Has terminado esta lección exitosamente',
            icon: '/favicon.ico'
          });
        }
      }
    } catch (error) {
      console.error('Error auto-completando lección:', error);
    }
  };

  const handleNextLesson = () => {
    setShowCompletionModal(false);
    if (nextLesson) {
      router.push(`/dashboard/student/course/${courseId}/lesson/${nextLesson.id}`);
    } else {
      router.push(`/dashboard/student/course/${courseId}`);
    }
  };

  const handleNextModule = () => {
    setShowCompletionModal(false);
    if (nextModule) {
      router.push(`/dashboard/student/course/${courseId}/lesson/${nextModule.firstLessonId}`);
    } else {
      router.push(`/dashboard/student/course/${courseId}`);
    }
  };

  const handleStayHere = () => {
    setShowCompletionModal(false);
  };

  const handleManualComplete = async () => {
    await handleAutoComplete();
  };

  // Solicitar permisos de notificación
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>Cargando lección...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-xl mb-2">🚫</p>
        <p>No pudimos cargar la lección.</p>
      </div>
    );
  }

  const isYouTube = lesson.video_url?.includes('youtube') || lesson.video_url?.includes('youtu.be');
  const embedUrl = getEmbedUrl(lesson.video_url);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="w-full aspect-video bg-black flex items-center justify-center relative group border-b border-gray-800">
         {embedUrl ? (
            isYouTube ? (
              <iframe 
                src={embedUrl}
                className="w-full h-full"
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video 
                controls 
                className="w-full h-full object-contain" 
                src={embedUrl}
                onEnded={() => setVideoCompleted(true)}
              />
            )
         ) : (
            <div className="text-center text-gray-600">
               <span className="text-6xl block mb-4 opacity-50">📹</span>
               <p>Esta lección no tiene video asignado.</p>
            </div>
         )}
      </div>

      <div className="p-4 md:p-8 pb-20">
         <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-gray-800 pb-8 gap-4">
            <div>
               <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{lesson.title}</h1>
               <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>📅 {new Date(lesson.created_at).toLocaleDateString()}</span>
                  {lesson.duration > 0 && <span>⏱️ {lesson.duration} min</span>}
               </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleManualComplete}
                variant="primary" 
                className={`${
                  isCompleted 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-cyan-600 hover:bg-cyan-700'
                } border-none transition-colors`}
                disabled={isCompleted}
              >
                {isCompleted ? '✅ Completada' : '✓ Marcar como Vista'}
              </Button>
              
              {!isCompleted && (
                <div className="text-xs text-gray-500 text-right space-y-1">
                  <div>⏱️ {Math.floor(watchTime / 1000)}s en la lección</div>
                  {hasScrolledToEnd && <div className="text-green-400">📖 Contenido leído ✓</div>}
                  {videoCompleted && <div className="text-green-400">🎥 Video completado ✓</div>}
                  {(watchTime > 30000 && hasScrolledToEnd) && <div className="text-yellow-400">⚡ Completando automáticamente...</div>}
                </div>
              )}
            </div>
         </div>
         
         <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📖 Notas de la Clase</h3>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
               {lesson.description || 'Sin descripción adicional.'}
            </div>
         </div>
      </div>

      {/* Modal de Felicitaciones */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-2">¡Felicidades!</h2>
              <p className="text-gray-300 mb-6">Has completado exitosamente esta lección.</p>
              
              {isLastLessonOfModule ? (
                // Última lección del módulo
                nextModule ? (
                  <div className="space-y-4">
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-green-400 mb-2">
                        🏆 ¡Módulo Completado!
                      </h3>
                      <p className="text-sm text-green-200">
                        Has terminado todas las lecciones de este módulo.
                      </p>
                    </div>
                    
                    <p className="text-gray-300 mb-4">
                      ¿Estás listo para continuar con el siguiente módulo?
                    </p>
                    
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-6">
                      <p className="text-blue-300 text-sm">
                        <span className="font-semibold">Siguiente:</span> {nextModule.title}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={handleNextModule}
                        variant="primary"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        🚀 Sí, continuar al siguiente módulo
                      </Button>
                      <Button 
                        onClick={handleStayHere}
                        variant="outline"
                        className="flex-1"
                      >
                        📖 Revisar esta lección
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Última lección del curso
                  <div className="space-y-4">
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                        🏅 ¡Curso Completado!
                      </h3>
                      <p className="text-sm text-yellow-200">
                        ¡Has terminado todas las lecciones de este curso!
                      </p>
                    </div>

                    <Button 
                      onClick={() => router.push('/dashboard/student')}
                      variant="primary"
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      🎓 Ir al Dashboard
                    </Button>
                  </div>
                )
              ) : (
                // Lección normal
                nextLesson && (
                  <div className="space-y-4">
                    <p className="text-gray-300 mb-4">
                      ¡Excelente progreso! Ahora pasemos a la siguiente lección.
                    </p>
                    
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 mb-6">
                      <p className="text-cyan-300 text-sm">
                        <span className="font-semibold">Siguiente:</span> {nextLesson.title}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={handleNextLesson}
                        variant="primary"
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                      >
                        ➡️ Continuar a la siguiente lección
                      </Button>
                      <Button 
                        onClick={handleStayHere}
                        variant="outline"
                        className="flex-1"
                      >
                        📖 Revisar esta lección
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}