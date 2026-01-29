'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { 
  Play, 
  FileText, 
  ClipboardList, 
  CheckCircle,
  Download,
  ExternalLink,
  Upload,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Award
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url?: string;
  duration?: number;
  created_at: string;
  sort_order?: number;
  module_id?: string;
}

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'file';
  url: string;
  description?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  max_points: number;
  submission?: {
    id: string;
    status: string;
    grade?: number;
    feedback?: string;
    submitted_at: string;
  };
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  time_limit_minutes: number;
  max_attempts: number;
  passing_score: number;
  submission?: {
    id: string;
    score: number;
    status: string;
    submitted_at: string;
  };
}

type TabType = 'video' | 'resources' | 'assignments' | 'quiz';

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Adjacent lessons for navigation
  const [prevLesson, setPrevLesson] = useState<{ id: string; title: string } | null>(null);
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (lessonId && courseId) {
      loadLessonData();
    }
  }, [lessonId, courseId]);

  const loadLessonData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Check/create enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) {
        // Auto-enroll
        await supabase.from('enrollments').insert({
          student_id: user.id,
          course_id: courseId as string,
          progress: 0,
          status: 'active',
          enrolled_at: new Date().toISOString()
        });
      }

      // Load lesson - try course_lessons first, then lessons
      let lessonData = null;
      
      const { data: courseLessonData, error: courseLessonError } = await supabase
        .from('course_lessons')
        .select(`
          id, title, description, video_url, duration, sort_order, module_id, created_at
        `)
        .eq('id', lessonId)
        .single();

      if (courseLessonData && !courseLessonError) {
        lessonData = courseLessonData;
      } else {
        // Try legacy lessons table
        const { data: legacyLesson } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();
        
        if (legacyLesson) {
          lessonData = legacyLesson;
        }
      }

      if (!lessonData) {
        setLesson(null);
        setLoading(false);
        return;
      }

      setLesson(lessonData);

      // Load adjacent lessons for navigation
      const { data: allLessons } = await supabase
        .from('course_lessons')
        .select('id, title, sort_order, module_id')
        .eq('module_id', lessonData.module_id)
        .order('sort_order', { ascending: true });

      if (allLessons) {
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        if (currentIndex > 0) {
          setPrevLesson(allLessons[currentIndex - 1]);
        }
        if (currentIndex < allLessons.length - 1) {
          setNextLesson(allLessons[currentIndex + 1]);
        }
      }

      // Check lesson progress
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('completed')
        .eq('student_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

      setIsCompleted(progress?.completed || false);

      // Load assignments for this lesson/course
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          id, title, description, due_date, max_points,
          assignment_submissions!left (
            id, status, grade, feedback, submitted_at
          )
        `)
        .eq('course_id', courseId)
        .eq('is_published', true);

      if (assignmentsData) {
        const formattedAssignments = assignmentsData.map(a => ({
          ...a,
          submission: a.assignment_submissions?.find((s: { id: string }) => s.id) || null
        }));
        setAssignments(formattedAssignments);
      }

      // Load exams for this course
      const { data: examsData } = await supabase
        .from('exams')
        .select(`
          id, title, description, time_limit_minutes, max_attempts, passing_score,
          exam_submissions!left (
            id, score, status, submitted_at
          )
        `)
        .eq('course_id', courseId)
        .eq('is_published', true);

      if (examsData) {
        const formattedExams = examsData.map(e => ({
          ...e,
          submission: e.exam_submissions?.find((s: { student_id: string }) => s.student_id === user.id) || null
        }));
        setExams(formattedExams);
      }

      // Mock resources (in production, this would come from a resources table)
      setResources([
        { id: '1', title: 'Material de apoyo', type: 'pdf', url: '#', description: 'Descarga el PDF con el contenido de la leccion' },
        { id: '2', title: 'Recursos adicionales', type: 'link', url: '#', description: 'Enlaces externos recomendados' },
      ]);

    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          student_id: userId,
          lesson_id: lessonId as string,
          course_id: courseId as string,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (!error) {
        setIsCompleted(true);
        setShowCompletionModal(true);

        // Update overall course progress
        await updateCourseProgress();
      }
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
    }
  };

  const updateCourseProgress = async () => {
    if (!userId) return;

    try {
      // Get total lessons in course
      const { count: totalLessons } = await supabase
        .from('course_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      // Get completed lessons
      const { count: completedLessons } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true);

      if (totalLessons && completedLessons !== null) {
        const progress = Math.round((completedLessons / totalLessons) * 100);
        
        await supabase
          .from('enrollments')
          .update({ progress })
          .eq('student_id', userId)
          .eq('course_id', courseId);
      }
    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  const submitAssignment = async (assignmentId: string) => {
    if (!userId || (!submissionText && !submissionUrl)) return;

    setSubmittingAssignment(assignmentId);

    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: userId,
          submission_text: submissionText || null,
          file_url: submissionUrl || null,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        });

      if (!error) {
        setSubmissionText('');
        setSubmissionUrl('');
        loadLessonData(); // Reload to get updated submission
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
    } finally {
      setSubmittingAssignment(null);
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

  const tabs = [
    { id: 'video' as TabType, label: 'Video', icon: Play },
    { id: 'resources' as TabType, label: 'Recursos', icon: FileText },
    { id: 'assignments' as TabType, label: 'Tareas', icon: ClipboardList },
    { id: 'quiz' as TabType, label: 'Examenes', icon: Award },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-[#8b949e]">Cargando leccion...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <BookOpen className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Leccion no encontrada</h2>
          <p className="text-[#8b949e] mb-6">
            No se pudo encontrar esta leccion. Verifica que tengas acceso al curso.
          </p>
          <Link 
            href={`/dashboard/student/course/${courseId}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al curso
          </Link>
        </div>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(lesson.video_url);

  return (
    <div className="min-h-screen bg-[#0f1115]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={`/dashboard/student/course/${courseId}`}
            className="inline-flex items-center text-[#8b949e] hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver al curso
          </Link>
          
          <div className="flex items-center gap-2">
            {isCompleted && (
              <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completada
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] mb-6">
          <div className="flex border-b border-[#30363d] overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-cyan-500 text-cyan-400 bg-[#21262d]'
                    : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Video Tab */}
            {activeTab === 'video' && (
              <div>
                <div className="w-full aspect-video bg-black rounded-lg mb-6 overflow-hidden">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      title={lesson.title}
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#8b949e]">
                      <div className="text-center">
                        <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No hay video disponible para esta leccion</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{lesson.title}</h1>
                    {lesson.duration && (
                      <p className="text-[#8b949e] flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {lesson.duration} minutos
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={markAsComplete}
                    disabled={isCompleted}
                    className={`inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isCompleted
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : 'bg-cyan-500 text-white hover:bg-cyan-600'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isCompleted ? 'Completada' : 'Marcar como completada'}
                  </button>
                </div>

                <div className="bg-[#21262d] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Descripcion</h3>
                  <p className="text-[#c9d1d9] whitespace-pre-wrap leading-relaxed">
                    {lesson.description || 'Sin descripcion disponible para esta leccion.'}
                  </p>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Recursos de la Leccion</h2>
                
                {resources.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Sin recursos disponibles</h3>
                    <p className="text-[#8b949e]">
                      El instructor no ha agregado recursos para esta leccion.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {resources.map((resource) => (
                      <div 
                        key={resource.id}
                        className="flex items-center justify-between p-4 bg-[#21262d] rounded-lg border border-[#30363d] hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className={`p-3 rounded-lg mr-4 ${
                            resource.type === 'pdf' 
                              ? 'bg-red-500/20 text-red-400'
                              : resource.type === 'link'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            {resource.type === 'pdf' ? (
                              <FileText className="h-5 w-5" />
                            ) : resource.type === 'link' ? (
                              <ExternalLink className="h-5 w-5" />
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{resource.title}</h4>
                            {resource.description && (
                              <p className="text-sm text-[#8b949e]">{resource.description}</p>
                            )}
                          </div>
                        </div>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                        >
                          {resource.type === 'link' ? 'Abrir' : 'Descargar'}
                          {resource.type === 'link' ? (
                            <ExternalLink className="h-4 w-4 ml-2" />
                          ) : (
                            <Download className="h-4 w-4 ml-2" />
                          )}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Tareas del Curso</h2>
                
                {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Sin tareas pendientes</h3>
                    <p className="text-[#8b949e]">
                      No hay tareas asignadas para este curso actualmente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {assignments.map((assignment) => (
                      <div 
                        key={assignment.id}
                        className="bg-[#21262d] rounded-lg border border-[#30363d] overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                              <p className="text-sm text-[#8b949e] mt-1">
                                {assignment.max_points} puntos
                                {assignment.due_date && (
                                  <span className="ml-3">
                                    Fecha limite: {new Date(assignment.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </p>
                            </div>
                            {assignment.submission ? (
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                assignment.submission.status === 'graded'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {assignment.submission.status === 'graded' 
                                  ? `Calificado: ${assignment.submission.grade}/${assignment.max_points}`
                                  : 'Enviado'
                                }
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#30363d] text-[#8b949e]">
                                Pendiente
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[#c9d1d9] mb-4">{assignment.description}</p>

                          {assignment.submission?.feedback && (
                            <div className="p-4 bg-[#161b22] rounded-lg mb-4 border-l-4 border-cyan-500">
                              <p className="text-sm font-medium text-white mb-1">Retroalimentacion del instructor:</p>
                              <p className="text-sm text-[#c9d1d9]">{assignment.submission.feedback}</p>
                            </div>
                          )}

                          {!assignment.submission && (
                            <div className="border-t border-[#30363d] pt-4 mt-4">
                              <h4 className="text-sm font-medium text-white mb-3">Entregar tarea</h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm text-[#8b949e] mb-1">
                                    Respuesta (texto)
                                  </label>
                                  <textarea
                                    rows={4}
                                    placeholder="Escribe tu respuesta aqui..."
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-lg text-white placeholder-[#8b949e] focus:outline-none focus:border-cyan-500 resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-[#8b949e] mb-1">
                                    O enlace a archivo (Google Drive, Dropbox, etc.)
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://..."
                                    value={submissionUrl}
                                    onChange={(e) => setSubmissionUrl(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-lg text-white placeholder-[#8b949e] focus:outline-none focus:border-cyan-500"
                                  />
                                </div>
                                <button
                                  onClick={() => submitAssignment(assignment.id)}
                                  disabled={submittingAssignment === assignment.id || (!submissionText && !submissionUrl)}
                                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {submittingAssignment === assignment.id ? 'Enviando...' : 'Enviar tarea'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quiz Tab */}
            {activeTab === 'quiz' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Examenes del Curso</h2>
                
                {exams.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Sin examenes disponibles</h3>
                    <p className="text-[#8b949e]">
                      No hay examenes asignados para este curso actualmente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exams.map((exam) => (
                      <div 
                        key={exam.id}
                        className="flex items-center justify-between p-6 bg-[#21262d] rounded-lg border border-[#30363d] hover:border-cyan-500/50 transition-colors"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{exam.title}</h3>
                          {exam.description && (
                            <p className="text-sm text-[#8b949e] mb-2">{exam.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-[#8b949e]">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {exam.time_limit_minutes} min
                            </span>
                            <span>Intentos: {exam.max_attempts}</span>
                            <span>Aprobacion: {exam.passing_score}%</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {exam.submission ? (
                            <div>
                              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-2 ${
                                exam.submission.score >= exam.passing_score
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {exam.submission.score}%
                              </span>
                              <p className="text-xs text-[#8b949e]">
                                {exam.submission.score >= exam.passing_score ? 'Aprobado' : 'No aprobado'}
                              </p>
                            </div>
                          ) : (
                            <Link
                              href={`/dashboard/student/exam/${exam.id}`}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
                            >
                              Iniciar examen
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {prevLesson ? (
            <Link
              href={`/dashboard/student/course/${courseId}/lesson/${prevLesson.id}`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Anterior: </span>
              <span className="truncate max-w-[150px]">{prevLesson.title}</span>
            </Link>
          ) : (
            <div />
          )}
          
          {nextLesson ? (
            <Link
              href={`/dashboard/student/course/${courseId}/lesson/${nextLesson.id}`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
            >
              <span className="hidden sm:inline">Siguiente: </span>
              <span className="truncate max-w-[150px]">{nextLesson.title}</span>
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          ) : (
            <Link
              href={`/dashboard/student/course/${courseId}`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-500 hover:bg-green-600 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar modulo
            </Link>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] p-8 rounded-2xl max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Leccion completada!</h2>
              <p className="text-[#8b949e] mb-6">
                Excelente trabajo! Has completado esta leccion.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium rounded-lg text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] transition-colors"
                >
                  Continuar aqui
                </button>
                {nextLesson ? (
                  <Link
                    href={`/dashboard/student/course/${courseId}/lesson/${nextLesson.id}`}
                    onClick={() => setShowCompletionModal(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors text-center"
                  >
                    Siguiente leccion
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/student/course/${courseId}`}
                    onClick={() => setShowCompletionModal(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors text-center"
                  >
                    Volver al curso
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
