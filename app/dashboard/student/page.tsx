'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { useStudentEnrollments, useStudentStats, useAllStudentAssignments, useAllStudentEvaluations } from '@/hooks/useCourses'
import { useRealtimeStudentDashboard } from '@/hooks/useRealtime'
import Link from 'next/link'
import { 
  BookOpen, 
  CheckCircle, 
  Target,
  Play,
  BarChart3,
  Trophy,
  Bell,
  AlertTriangle,
  ChevronRight,
  Calendar,
  Award,
  Clock,
  TrendingUp,
  ClipboardList,
  FileText
} from 'lucide-react'

export default function StudentDashboard() {
  const { profile } = useAuthContext()
  
  const { data: enrollments = [], isLoading: enrollmentsLoading, error: enrollmentsError } = useStudentEnrollments(profile?.id)
  const { data: stats, isLoading: statsLoading } = useStudentStats(profile?.id)
  const { data: assignments, isLoading: assignmentsLoading } = useAllStudentAssignments(profile?.id)
  const { data: evaluations, isLoading: evaluationsLoading } = useAllStudentEvaluations(profile?.id)
  const { courses: realtimeCourses = [], tasks: realtimeTasks = [], grades: realtimeGrades = [] } = useRealtimeStudentDashboard()

  const loading = enrollmentsLoading || statsLoading || assignmentsLoading || evaluationsLoading
  const displayName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Estudiante'
  const inProgressCourses = enrollments?.filter((e: any) => e.status === 'active' || e.status === 'in_progress') || []
  const completedCourses = enrollments?.filter((e: any) => e.status === 'completed') || []
  const overallProgress = (enrollments?.length || 0) > 0 
    ? Math.round((completedCourses.length / enrollments.length) * 100)
    : 0
    
  // Combinar tareas pendientes de hooks y realtime
  const pendingTasks = assignments?.pending || []
  const pendingExams = evaluations?.pending || []

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm">Cargando tu espacio de aprendizaje...</p>
        </div>
      </div>
    )
  }

  if (enrollmentsError) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="bg-[#0a0f1a] border border-gray-800 p-8 rounded-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error de conexión</h2>
          <p className="text-gray-400 mb-6 text-sm">No pudimos cargar tus datos. Verifica tu conexión.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-24">
        
        {/* HEADER */}
        <header className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-cyan-400 text-sm font-medium tracking-wide uppercase mb-1">Dashboard</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                Bienvenido, {displayName}
              </h1>
              <p className="text-gray-500 mt-2">Continúa donde lo dejaste</p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-3 flex-wrap">
              <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl px-5 py-4 min-w-[110px]">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-500">Cursos</span>
                </div>
                <p className="text-2xl font-bold text-white">{enrollments.length}</p>
              </div>
              <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl px-5 py-4 min-w-[110px]">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-500">Progreso</span>
                </div>
                <p className="text-2xl font-bold text-white">{overallProgress}%</p>
              </div>
              <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl px-5 py-4 min-w-[110px] hidden sm:block">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-500">Completados</span>
                </div>
                <p className="text-2xl font-bold text-white">{completedCourses.length}</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CURSOS EN PROGRESO */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-[#0a0f1a] border border-gray-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-cyan-400" />
                  Cursos en Progreso
                </h2>
                <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full font-medium">
                  {inProgressCourses.length} activos
                </span>
              </div>

              {inProgressCourses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-gray-300 font-medium mb-2">No tienes cursos activos</h3>
                  <p className="text-gray-500 text-sm mb-4">Explora nuestro catálogo y comienza a aprender</p>
                  <Link 
                    href="/cursos" 
                    className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Ver cursos <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {inProgressCourses.map((enrollment: any) => (
                    <Link 
                      key={enrollment.id} 
                      href={`/dashboard/student/course/${enrollment.course_id}/overview`}
                      className="block group"
                    >
                      <div className="bg-[#030712] border border-gray-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-white">
                              {enrollment.courses?.title?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                              {enrollment.courses?.title || 'Curso'}
                            </h3>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex-1">
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                                    style={{ width: `${enrollment.progress || 0}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs text-cyan-400 font-medium w-10">{enrollment.progress || 0}%</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* TAREAS PENDIENTES */}
            <section className="bg-[#0a0f1a] border border-gray-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Tareas Pendientes
                </h2>
                {pendingTasks.length > 0 && (
                  <span className="text-xs bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full">
                    {pendingTasks.length}
                  </span>
                )}
              </div>

              {pendingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                  </div>
                  <p className="text-gray-400 text-sm">¡Estás al día! No tienes tareas pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.slice(0, 5).map((task: any, idx: number) => (
                    <Link 
                      key={task.id || idx} 
                      href={`/dashboard/student/tasks/${task.id}`}
                      className="flex items-center gap-4 bg-[#030712] border border-gray-800 rounded-xl p-4 hover:border-orange-500/30 transition-colors"
                    >
                      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {task.courses?.title || 'Curso'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full font-medium">
                          {task.max_points} pts
                        </span>
                        {task.due_date && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* EVALUACIONES PENDIENTES */}
            <section className="bg-[#0a0f1a] border border-gray-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-purple-400" />
                  Exámenes Pendientes
                </h2>
                {pendingExams.length > 0 && (
                  <span className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full">
                    {pendingExams.length}
                  </span>
                )}
              </div>

              {pendingExams.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                  </div>
                  <p className="text-gray-400 text-sm">¡No tienes exámenes pendientes!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingExams.slice(0, 4).map((exam: any, idx: number) => (
                    <Link 
                      key={exam.id || idx} 
                      href={`/dashboard/student/exam/${exam.id}`}
                      className="flex items-center gap-4 bg-[#030712] border border-gray-800 rounded-xl p-4 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{exam.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {exam.courses?.title || 'Curso'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          exam.scope === 'topic_quiz' ? 'bg-blue-500/10 text-blue-400' :
                          exam.scope === 'unit_exam' ? 'bg-purple-500/10 text-purple-400' :
                          'bg-orange-500/10 text-orange-400'
                        }`}>
                          {exam.scope === 'topic_quiz' ? 'Quiz' :
                           exam.scope === 'unit_exam' ? 'Examen' : 'Final'}
                        </span>
                        {exam.time_limit_minutes && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {exam.time_limit_minutes} min
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-6">
            
            {/* ESTADÍSTICAS */}
            <section className="bg-[#0a0f1a] border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Estadísticas
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-800/50">
                  <span className="text-gray-400 text-sm">Promedio</span>
                  <span className="text-white font-semibold">{stats?.averageGrade || 85}%</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-800/50">
                  <span className="text-gray-400 text-sm">Lecciones</span>
                  <span className="text-white font-semibold">{stats?.completedLessons || 12}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-800/50">
                  <span className="text-gray-400 text-sm">Horas de estudio</span>
                  <span className="text-white font-semibold">{stats?.studyHours || 24}h</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400 text-sm">Racha</span>
                  <span className="text-cyan-400 font-semibold">🔥 {stats?.streak || 5} días</span>
                </div>
              </div>
            </section>

            {/* LOGROS */}
            <section className="bg-[#0a0f1a] border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Logros
              </h3>
              
              <div className="space-y-3">
                {completedCourses.length > 0 ? (
                  completedCourses.slice(0, 3).map((course: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 bg-[#030712] rounded-lg p-3 border border-gray-800/50">
                      <div className="w-9 h-9 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{course.courses?.title || 'Curso'}</p>
                        <p className="text-xs text-gray-500">Completado</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Completa cursos para logros</p>
                  </div>
                )}
              </div>
            </section>

            {/* NOTIFICACIONES */}
            <section className="bg-[#0a0f1a] border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                Notificaciones
              </h3>
              
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">Sin notificaciones</p>
              </div>
            </section>

          </aside>
        </div>

      </div>
    </div>
  )
}
