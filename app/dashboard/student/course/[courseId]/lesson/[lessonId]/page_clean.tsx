'use client';

import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Play, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Download, 
  Upload,
  Target,
  Clock,
  Book
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'class' | 'resources' | 'tasks' | 'evaluation'>('class');
  
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
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

  const tabs = [
    { id: 'class', label: 'Clase', icon: Play },
    { id: 'resources', label: 'Recursos', icon: FileText },
    { id: 'tasks', label: 'Tarea', icon: Upload },
    { id: 'evaluation', label: 'Evaluación', icon: Target }
  ] as const;

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <button 
              onClick={() => router.push(`/dashboard/student/course/${courseId}`)}
              className="hover:text-white transition-colors"
            >
              {lesson.course_modules.title}
            </button>
            <span>›</span>
            <span className="text-white">{lesson.title}</span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            
            <Button 
              onClick={handleManualComplete}
              variant={isCompleted ? "secondary" : "primary"}
              disabled={isCompleted}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completada
                </>
              ) : (
                'Marcar como Vista'
              )}
            </Button>

            <button className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors">
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Title */}
      <div className="bg-[#161b22] px-6 py-6 border-b border-[#30363d]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{lesson.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {lesson.duration > 0 ? `${lesson.duration} min` : 'Sin duración'}
            </span>
            <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
            {!isCompleted && (
              <div className="flex items-center gap-4 text-xs">
                <span>⏱️ {Math.floor(watchTime / 1000)}s</span>
                {hasScrolledToEnd && <span className="text-green-400">📖 Leído ✓</span>}
                {videoCompleted && <span className="text-green-400">🎥 Video ✓</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-[#161b22] px-6 border-b border-[#30363d]">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tab: Clase */}
        {activeTab === 'class' && (
          <div className="space-y-6">
            {/* Video Player */}
            <div className="bg-[#161b22] rounded-xl overflow-hidden border border-[#30363d]">
              <div className="w-full aspect-video bg-black flex items-center justify-center">
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
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Esta lección no tiene video asignado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#161b22] rounded-xl p-6 border border-[#30363d]">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Book className="w-5 h-5 text-cyan-400" />
                Notas de la Clase
              </h3>
              <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
                {lesson.description || 'Sin descripción adicional.'}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Recursos */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="bg-[#161b22] rounded-xl p-6 border border-[#30363d]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Recursos y Material de Apoyo
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[#21262d] rounded-lg border border-[#30363d] hover:border-cyan-400/30 transition-colors">
                  <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">Material de lectura complementario</h4>
                    <p className="text-sm text-gray-400">PDF · 2.3 MB</p>
                  </div>
                  <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Descargar
                  </button>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-[#21262d] rounded-lg border border-[#30363d] hover:border-cyan-400/30 transition-colors">
                  <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">Ejercicios prácticos</h4>
                    <p className="text-sm text-gray-400">DOCX · 1.1 MB</p>
                  </div>
                  <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Descargar
                  </button>
                </div>

                <div className="text-center text-gray-500 py-8 opacity-75">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay recursos adicionales disponibles para esta lección.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Tarea */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-[#161b22] rounded-xl p-6 border border-[#30363d]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-yellow-400" />
                Tarea de la Lección
              </h3>
              
              <div className="space-y-6">
                {/* Task Instructions */}
                <div className="bg-[#21262d] rounded-lg p-6 border border-[#30363d]">
                  <h4 className="font-medium text-white mb-3">Instrucciones:</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Completa los ejercicios basados en el contenido de esta lección. 
                    Asegúrate de revisar todo el material antes de enviar tu tarea.
                  </p>
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-[#30363d] rounded-lg p-8 text-center hover:border-cyan-400/50 transition-colors">
                  <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">Sube tu tarea</h4>
                  <p className="text-gray-400 mb-4">Arrastra y suelta archivos aquí o haz clic para seleccionar</p>
                  <Button variant="outline">
                    Seleccionar Archivo
                  </Button>
                </div>

                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">Formatos permitidos: PDF, DOC, DOCX, TXT (Máx. 10 MB)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Evaluación */}
        {activeTab === 'evaluation' && (
          <div className="space-y-6">
            <div className="bg-[#161b22] rounded-xl p-6 border border-[#30363d]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-400" />
                Evaluación de la Lección
              </h3>
              
              <div className="text-center py-12">
                <div className="bg-[#21262d] rounded-xl p-8 border border-[#30363d] max-w-md mx-auto">
                  <Target className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-3">Quiz de la Lección</h4>
                  <p className="text-gray-400 mb-6">
                    Evalúa tu comprensión del tema con un breve cuestionario.
                  </p>
                  <Button variant="primary">
                    Iniciar Evaluación
                  </Button>
                  <p className="text-sm text-gray-500 mt-3">
                    Tiempo estimado: 10 minutos
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Felicitaciones */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-4">¡Felicidades!</h2>
              
              {isLastLessonOfModule && nextModule ? (
                <div className="space-y-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-green-400 mb-2">🏆 ¡Módulo Completado!</h3>
                  </div>
                  <p className="text-gray-300 mb-6">¿Estás listo para el siguiente módulo?</p>
                  <Button 
                    onClick={handleNextModule}
                    variant="primary"
                  >
                    🚀 Continuar al siguiente módulo
                  </Button>
                </div>
              ) : nextLesson ? (
                <div className="space-y-4">
                  <p className="text-gray-300 mb-6">Ya puedes pasar a la siguiente lección</p>
                  <Button 
                    onClick={handleNextLesson}
                    variant="primary"
                  >
                    ➡️ Ir a la siguiente lección
                  </Button>
                </div>
              ) : isCourseCompleted ? (
                <div className="space-y-4">
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">🏅 ¡Curso Completado!</h3>
                  </div>
                  <p className="text-gray-300 mb-6">¡Has terminado todo el curso!</p>
                  <Button 
                    onClick={() => router.push('/dashboard/student')}
                    variant="primary"
                  >
                    🎓 Ir al Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-300 mb-6">¡Lección completada!</p>
                  <Button 
                    onClick={() => router.push(`/dashboard/student/course/${courseId}`)}
                    variant="primary"
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