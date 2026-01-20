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
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  
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
        const result = await response.json();
        console.log('Completion result:', result);
        
        setIsCompleted(true);
        
        // Actualizar siguiente lección y módulo basado en la respuesta del API
        setNextLesson(result.nextLesson);
        setIsLastLessonOfModule(result.isLastLessonOfModule);
        setNextModule(result.nextModule);
        
        // Determinar si el curso está completado (no hay siguiente lección ni módulo)
        const courseIsCompleted = !result.nextLesson && !result.nextModule;
        setIsCourseCompleted(courseIsCompleted);
        console.log('Course is completed:', courseIsCompleted);
        
        setShowCompletionModal(true);
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
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Manual completion result:', result);
        
        setIsCompleted(true);
        
        // Actualizar siguiente lección y módulo basado en la respuesta del API  
        setNextLesson(result.nextLesson);
        setIsLastLessonOfModule(result.isLastLessonOfModule);
        setNextModule(result.nextModule);
        
        // Determinar si el curso está completado (no hay siguiente lección ni módulo)
        const courseIsCompleted = !result.nextLesson && !result.nextModule;
        setIsCourseCompleted(courseIsCompleted);
        console.log('Course is completed:', courseIsCompleted);
        
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error('Error completando lección manualmente:', error);
    }
  };

  // Solicitar permisos de notificación (opcional)
  // useEffect(() => {
  //   if ('Notification' in window && Notification.permission === 'default') {
  //     Notification.requestPermission();
  //   }
  // }, []);

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

      {/* Modal de Felicitaciones Simplificado */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-4">¡Felicidades!</h2>
              
              {isLastLessonOfModule && nextModule ? (
                // Última lección del módulo
                <div className="space-y-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-green-400 mb-2">🏆 ¡Módulo Completado!</h3>
                  </div>
                  <p className="text-gray-300 mb-6">¿Estás listo para el siguiente módulo?</p>
                  <Button 
                    onClick={handleNextModule}
                    variant="primary"
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                  >
                    🚀 Continuar al siguiente módulo
                  </Button>
                </div>
              ) : nextLesson ? (
                // Lección normal - siguiente lección disponible
                <div className="space-y-4">
                  <p className="text-gray-300 mb-6">Ya puedes pasar a la siguiente lección</p>
                  <Button 
                    onClick={handleNextLesson}
                    variant="primary"
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-lg py-3"
                  >
                    ➡️ Ir a la siguiente lección
                  </Button>
                </div>
              ) : isCourseCompleted ? (
                // Última lección del curso - curso realmente completado
                <div className="space-y-4">
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">🏅 ¡Curso Completado!</h3>
                  </div>
                  <p className="text-gray-300 mb-6">¡Has terminado todo el curso!</p>
                  <Button 
                    onClick={() => router.push('/dashboard/student')}
                    variant="primary"
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-lg py-3"
                  >
                    🎓 Ir al Dashboard
                  </Button>
                </div>
              ) : (
                // Error o estado inesperado
                <div className="space-y-4">
                  <p className="text-gray-300 mb-6">¡Lección completada!</p>
                  <Button 
                    onClick={() => router.push(`/dashboard/student/course/${courseId}`)}
                    variant="primary"
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-lg py-3"
                  >
                    📚 Volver al Curso
                  </Button>
                </div>
              )}
              
              <button 
                onClick={handleStayHere}
                className="mt-4 text-gray-400 hover:text-gray-300 text-sm underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}