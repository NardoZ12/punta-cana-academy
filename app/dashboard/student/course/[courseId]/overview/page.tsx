'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  useCourseStructure, 
  useStudentAssignments, 
  useStudentEvaluations,
  useStudentCourseProgress 
} from '@/hooks/useCourses';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Play,
  CheckCircle,
  AlertCircle,
  Target,
  Award,
  Calendar,
  Video,
  File,
  Lock,
  TrendingUp,
  ClipboardList
} from 'lucide-react';
import { useState } from 'react';

export default function StudentCourseOverview() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { profile } = useAuthContext();
  
  const { data: course, isLoading: courseLoading } = useCourseStructure(courseId);
  const { data: assignments, isLoading: assignmentsLoading } = useStudentAssignments(courseId, profile?.id);
  const { data: evaluations, isLoading: evaluationsLoading } = useStudentEvaluations(courseId, profile?.id);
  const { data: progress, isLoading: progressLoading } = useStudentCourseProgress(courseId, profile?.id);
  
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'content' | 'assignments' | 'exams'>('content');

  const loading = courseLoading || assignmentsLoading || evaluationsLoading || progressLoading;

  const toggleUnit = (unitId: string) => {
    const newSet = new Set(expandedUnits);
    if (newSet.has(unitId)) {
      newSet.delete(unitId);
    } else {
      newSet.add(unitId);
    }
    setExpandedUnits(newSet);
  };

  // Verificar si un tema está completado
  const isTopicCompleted = (topicId: string) => {
    return progress?.topicProgress?.find(t => t.topic_id === topicId)?.completed || false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm">Cargando contenido del curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="bg-[#0a0f1a] border border-gray-800 p-8 rounded-2xl text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Curso no encontrado</h2>
          <p className="text-gray-400 mb-6">No pudimos encontrar el curso solicitado.</p>
          <Link href="/dashboard/student" className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2.5 rounded-lg font-medium">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'content' as const, label: 'Contenido', icon: BookOpen, count: course.totalTopics },
    { id: 'assignments' as const, label: 'Tareas', icon: Target, count: assignments?.pending?.length || 0 },
    { id: 'exams' as const, label: 'Evaluaciones', icon: ClipboardList, count: evaluations?.pending?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-24">
        
        {/* Header */}
        <header className="mb-8">
          <Link 
            href="/dashboard/student" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{course.title}</h1>
              <p className="text-gray-400 text-sm mb-4">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {course.totalUnits} unidades
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {course.totalTopics} temas
                </span>
                {course.profiles && (
                  <span className="flex items-center gap-1.5">
                    Instructor: {course.profiles.full_name}
                  </span>
                )}
              </div>
            </div>
            
            {/* Progress Card */}
            <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-5 min-w-[200px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{progress?.overallProgress || 0}%</p>
                  <p className="text-xs text-gray-500">Progreso</p>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                  style={{ width: `${progress?.overallProgress || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {progress?.completedTopics || 0} de {progress?.totalTopics || 0} temas completados
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {course.units?.length === 0 ? (
              <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">Sin contenido disponible</h3>
                <p className="text-gray-500 text-sm">El profesor aún no ha publicado contenido para este curso.</p>
              </div>
            ) : (
              course.units?.map((unit: any, unitIndex: number) => (
                <div key={unit.id} className="bg-[#0a0f1a] border border-gray-800 rounded-xl overflow-hidden">
                  {/* Unit Header */}
                  <button
                    onClick={() => toggleUnit(unit.id)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-gray-900/30 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{unitIndex + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{unit.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {unit.topics?.length || 0} temas · {unit.estimated_hours || 0}h estimadas
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Unit Progress */}
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ 
                              width: `${
                                unit.topics?.length > 0 
                                  ? (unit.topics.filter((t: any) => isTopicCompleted(t.id)).length / unit.topics.length) * 100
                                  : 0
                              }%` 
                            }}
                          />
                        </div>
                      </div>
                      {expandedUnits.has(unit.id) 
                        ? <ChevronDown className="w-5 h-5 text-gray-400" />
                        : <ChevronRight className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                  </button>

                  {/* Topics List */}
                  {expandedUnits.has(unit.id) && (
                    <div className="border-t border-gray-800 bg-[#030712]/50">
                      {unit.topics?.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-6">Sin temas publicados</p>
                      ) : (
                        unit.topics?.map((topic: any, topicIndex: number) => {
                          const completed = isTopicCompleted(topic.id);
                          return (
                            <Link
                              key={topic.id}
                              href={`/dashboard/student/course/${courseId}/topic/${topic.id}`}
                              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-900/50 transition-colors border-b border-gray-800/50 last:border-b-0"
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                completed 
                                  ? 'bg-green-500/10 text-green-400' 
                                  : 'bg-gray-800 text-gray-400'
                              }`}>
                                {completed ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white truncate">{topic.title}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {topic.estimated_minutes || 30} min
                                  </span>
                                  {topic.resources?.video_url && (
                                    <span className="flex items-center gap-1">
                                      <Video className="w-3 h-3" />
                                      Video
                                    </span>
                                  )}
                                  {topic.resources?.pdf_url && (
                                    <span className="flex items-center gap-1">
                                      <File className="w-3 h-3" />
                                      PDF
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* Pending Assignments */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Tareas Pendientes
                <span className="bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full text-xs">
                  {assignments?.pending?.length || 0}
                </span>
              </h3>
              
              {!assignments?.pending?.length ? (
                <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-400">¡No tienes tareas pendientes!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.pending.map((assignment: any) => (
                    <Link
                      key={assignment.id}
                      href={`/dashboard/student/tasks/${assignment.id}`}
                      className="block bg-[#0a0f1a] border border-gray-800 hover:border-yellow-500/30 rounded-xl p-5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">{assignment.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{assignment.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs">
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <Award className="w-3.5 h-3.5" />
                              {assignment.max_points} pts
                            </span>
                            {assignment.due_date && (
                              <span className="flex items-center gap-1.5 text-yellow-400">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(assignment.due_date).toLocaleDateString('es-ES')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium">
                          Pendiente
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Submitted Assignments */}
            {assignments?.submitted && assignments.submitted.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  En revisión
                </h3>
                <div className="space-y-3">
                  {assignments.submitted.map((assignment: any) => (
                    <div key={assignment.id} className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{assignment.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Enviado: {new Date(assignment.submission?.submitted_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs">
                          En revisión
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graded Assignments */}
            {assignments?.graded && assignments.graded.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Calificadas
                </h3>
                <div className="space-y-3">
                  {assignments.graded.map((assignment: any) => (
                    <div key={assignment.id} className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{assignment.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {assignment.submission?.instructor_feedback || 'Sin comentarios'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${
                            (assignment.submission?.score || 0) >= 70 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {assignment.submission?.score || 0}/{assignment.max_points}
                          </span>
                          <p className="text-xs text-gray-500">puntos</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            {/* Pending Evaluations */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-400" />
                Evaluaciones Pendientes
                <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full text-xs">
                  {evaluations?.pending?.length || 0}
                </span>
              </h3>
              
              {!evaluations?.pending?.length ? (
                <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-400">¡No tienes evaluaciones pendientes!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluations.pending.map((evaluation: any) => (
                    <Link
                      key={evaluation.id}
                      href={`/dashboard/student/exam/${evaluation.id}`}
                      className="block bg-[#0a0f1a] border border-gray-800 hover:border-purple-500/30 rounded-xl p-5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              evaluation.scope === 'topic_quiz' ? 'bg-blue-500/10 text-blue-400' :
                              evaluation.scope === 'unit_exam' ? 'bg-purple-500/10 text-purple-400' :
                              'bg-orange-500/10 text-orange-400'
                            }`}>
                              {evaluation.scope === 'topic_quiz' ? 'Quiz' :
                               evaluation.scope === 'unit_exam' ? 'Examen' : 'Final'}
                            </span>
                          </div>
                          <h4 className="font-medium text-white mb-1">{evaluation.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {evaluation.time_limit_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {evaluation.time_limit_minutes} min
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Target className="w-3.5 h-3.5" />
                              {evaluation.passing_score}% para aprobar
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              {evaluation.max_attempts} intento(s)
                            </span>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-medium transition-colors">
                          Comenzar
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Evaluations */}
            {evaluations?.completed && evaluations.completed.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Evaluaciones Completadas
                </h3>
                <div className="space-y-3">
                  {evaluations.completed.map((evaluation: any) => (
                    <div key={evaluation.id} className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{evaluation.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {evaluation.attemptsUsed} de {evaluation.max_attempts} intentos usados
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${
                            evaluation.passed ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {evaluation.bestScore || 0}%
                          </span>
                          <p className="text-xs text-gray-500">
                            {evaluation.passed ? 'Aprobado' : 'No aprobado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
