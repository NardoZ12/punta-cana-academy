'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url?: string;
  duration?: number;
  created_at: string;
  sort_order?: number;
}

export default function LessonPageRobust() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [dbStructure, setDbStructure] = useState<{
    lessonsTable: 'lessons' | 'course_lessons';
    progressTable: 'user_lesson_progress' | 'lesson_progress';
    progressIdField: 'user_id' | 'student_id';
  }>({
    lessonsTable: 'course_lessons',
    progressTable: 'lesson_progress', 
    progressIdField: 'student_id'
  });

  useEffect(() => {
    if (lessonId) {
      detectDatabaseStructure();
    }
  }, [lessonId]);

  const detectDatabaseStructure = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🔍 Detectando estructura de base de datos...');
      
      // Intentar con course_lessons primero
      const { data: courseLessonsData, error: courseLessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', lessonId)
        .limit(1);

      if (courseLessonsData && courseLessonsData.length > 0) {
        console.log('✅ Usando course_lessons');
        setDbStructure(prev => ({ ...prev, lessonsTable: 'course_lessons' }));
        
        // Verificar tabla de progreso
        const { data: lessonProgressData, error: lessonProgressError } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('student_id', user.id)
          .eq('lesson_id', lessonId)
          .limit(1);

        if (!lessonProgressError) {
          console.log('✅ Usando lesson_progress con student_id');
          setDbStructure(prev => ({ 
            ...prev, 
            progressTable: 'lesson_progress',
            progressIdField: 'student_id'
          }));
        } else {
          // Intentar con user_lesson_progress
          const { data: userProgressData, error: userProgressError } = await supabase
            .from('user_lesson_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .limit(1);
          
          if (!userProgressError) {
            console.log('✅ Usando user_lesson_progress con user_id');
            setDbStructure(prev => ({ 
              ...prev, 
              progressTable: 'user_lesson_progress',
              progressIdField: 'user_id'
            }));
          }
        }
        
        loadLessonWithStructure();
        return;
      }

      // Si course_lessons falla, intentar con lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .limit(1);

      if (lessonsData && lessonsData.length > 0) {
        console.log('✅ Usando lessons (estructura legacy)');
        setDbStructure(prev => ({ 
          ...prev, 
          lessonsTable: 'lessons',
          progressTable: 'user_lesson_progress',
          progressIdField: 'user_id'
        }));
        loadLessonWithStructure();
        return;
      }

      console.error('❌ No se pudo detectar la estructura de la base de datos');
      
    } catch (error) {
      console.error('Error detectando estructura:', error);
    }
  };

  const loadLessonWithStructure = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar inscripción si estamos usando course_lessons
      if (dbStructure.lessonsTable === 'course_lessons') {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (!enrollment) {
          console.error('Estudiante no inscrito en este curso');
          return;
        }

        // Cargar con verificaciones de seguridad
        const { data: lessonData, error } = await supabase
          .from('course_lessons')
          .select(`
            id, title, description, video_url, duration, sort_order, created_at,
            course_modules (
              id, course_id, is_published,
              courses (
                id, title, is_published
              )
            )
          `)
          .eq('id', lessonId)
          .single();

        if (error || !lessonData) {
          console.error('Error loading lesson:', error);
          return;
        }
        setLesson(lessonData);
      } else {
        // Estructura legacy
        const { data: lessonData, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (error || !lessonData) {
          console.error('Error loading lesson:', error);
          return;
        }
        setLesson(lessonData);
      }

      // Verificar progreso
      await checkProgressWithStructure();
      
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkProgressWithStructure = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const progressQuery = supabase
        .from(dbStructure.progressTable)
        .select('completed')
        .eq(dbStructure.progressIdField, user.id)
        .eq('lesson_id', lessonId);

      // Agregar course_id solo si estamos usando lesson_progress
      if (dbStructure.progressTable === 'lesson_progress') {
        progressQuery.eq('course_id', courseId);
      }

      const { data: progress } = await progressQuery.single();

      if (progress?.completed) {
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Error checking progress:', error);
    }
  };

  const markAsComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const progressData: any = {
        [dbStructure.progressIdField]: user.id,
        lesson_id: lessonId as string,
        completed: true,
        completed_at: new Date().toISOString(),
      };

      // Agregar course_id solo si estamos usando lesson_progress
      if (dbStructure.progressTable === 'lesson_progress') {
        progressData.course_id = courseId as string;
      }

      const { error } = await supabase
        .from(dbStructure.progressTable)
        .upsert(progressData);

      if (!error) {
        setIsCompleted(true);
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
    }
  };

  const getEmbedUrl = (videoUrl?: string) => {
    if (!videoUrl) return null;
    
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = videoUrl.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return videoUrl;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-gray-400">Cargando lección...</p>
        <p className="text-xs text-gray-500 mt-2">
          Estructura: {dbStructure.lessonsTable} + {dbStructure.progressTable}
        </p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-6xl">😕</div>
        <h2 className="text-xl font-bold text-white">Lección no encontrada</h2>
        <p className="text-gray-400 text-center max-w-md">
          No se pudo encontrar esta lección. Verifica que tengas acceso al curso o contacta con soporte.
        </p>
        <div className="text-xs text-gray-500 bg-gray-800 p-3 rounded">
          <p>Debug info:</p>
          <p>Lesson ID: {lessonId}</p>
          <p>Course ID: {courseId}</p>
          <p>DB Structure: {dbStructure.lessonsTable} + {dbStructure.progressTable}</p>
        </div>
        <Button 
          onClick={() => router.push(`/dashboard/student/course/${courseId}`)}
          variant="primary"
        >
          ← Volver al curso
        </Button>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(lesson.video_url);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="w-full aspect-video bg-black rounded-lg mb-6">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            title={lesson.title}
            allowFullScreen
            allow="autoplay; encrypted-media"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span>No hay video disponible</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
          <p className="text-gray-400">
            {lesson.duration && `${lesson.duration} min`}
          </p>
        </div>
        
        <Button
          onClick={markAsComplete}
          variant="primary"
          disabled={isCompleted}
        >
          {isCompleted ? '✅ Completada' : '✓ Completar'}
        </Button>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Descripción</h3>
        <p className="text-gray-300 whitespace-pre-wrap">
          {lesson.description || 'Sin descripción disponible'}
        </p>
      </div>

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-xs text-gray-500 bg-gray-800 p-3 rounded">
          <p>🔧 Debug - Estructura DB detectada:</p>
          <p>Lecciones: {dbStructure.lessonsTable}</p>
          <p>Progreso: {dbStructure.progressTable} ({dbStructure.progressIdField})</p>
        </div>
      )}

      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-4">¡Completada!</h2>
              <p className="text-gray-300 mb-6">¡Excelente trabajo! Has completado esta lección.</p>
              
              <Button
                onClick={() => {
                  setShowCompletionModal(false);
                  router.push(`/dashboard/student/course/${courseId}`);
                }}
                variant="primary"
                className="w-full"
              >
                Continuar al curso
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}