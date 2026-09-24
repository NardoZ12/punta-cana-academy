'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { useStudentEnrollments, useStudentStats, useAllStudentAssignments, useAllStudentEvaluations } from '@/hooks/useCourses'
import { useRealtimeStudentDashboard } from '@/hooks/useRealtime'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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

interface DashboardNotification {
  id: string
  title: string
  message: string
  is_read: boolean
  type: string
  link: string | null
  created_at: string
}

export default function StudentDashboard() {
  const { profile } = useAuthContext()
  const [sidebarNotifications, setSidebarNotifications] = useState<DashboardNotification[]>([])
  const [notifsLoading, setNotifsLoading] = useState(true)
  
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

  // Cargar notificaciones reales desde la BD
  useEffect(() => {
    if (!profile?.id) return
    const loadNotifications = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const res = await fetch(
          `${supabaseUrl}/rest/v1/notifications?user_id=eq.${profile.id}&order=created_at.desc&limit=5`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setSidebarNotifications(data)
        }
      } catch (e) {
        console.error('Error loading sidebar notifications:', e)
      } finally {
        setNotifsLoading(false)
      }
    }
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [profile?.id])

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Skeleton header */}
        <div>
          <div className="h-4 w-24 bg-gray-800 rounded animate-pulse mb-2"></div>
          <div className="h-8 w-72 bg-gray-800 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-56 bg-gray-800/50 rounded animate-pulse"></div>
        </div>
        {/* Skeleton stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl p-5">
              <div className="h-4 w-20 bg-gray-800 rounded animate-pulse mb-3"></div>
              <div className="h-7 w-12 bg-gray-800 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        {/* Skeleton courses */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl p-5">
              <div className="h-5 w-40 bg-gray-800 rounded animate-pulse mb-3"></div>
              <div className="h-4 w-full bg-gray-800/50 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-800/50 rounded animate-pulse"></div>
            </div>
          ))}
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,180,255,0.12),_transparent_25%),linear-gradient(180deg,#071421_0%,#091a2b_48%,#071421_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6">
        <header className="mb-8 rounded-[28px] border border-cyan-400/20 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(8,19,33,0.4)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Dashboard</p>
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Bienvenido, {displayName}
              </h1>
              <p className="mt-2 text-sm text-slate-300">Continúa tu camino de aprendizaje con claridad y foco.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="min-w-[120px] rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-300">
                  <BookOpen className="h-4 w-4 text-cyan-300" />
                  Cursos
                </div>
                <div className="text-2xl font-black text-white">{enrollments.length}</div>
              </div>

              <div className="min-w-[120px] rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-300">
                  <TrendingUp className="h-4 w-4 text-cyan-300" />
                  Progreso
                </div>
                <div className="text-2xl font-black text-white">{overallProgress}%</div>
              </div>

              <div className="hidden min-w-[120px] rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 sm:block">
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                  Completados
                </div>
                <div className="text-2xl font-black text-white">{completedCourses.length}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-[28px] border border-cyan-400/20 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(8,19,33,0.35)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                    <Play className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Tu aprendizaje</h2>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                  {inProgressCourses.length} activos
                </span>
              </div>

              {inProgressCourses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/80 text-slate-400">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Aún no tienes cursos activos</h3>
                  <p className="mt-2 text-sm text-slate-400">Explora el catálogo y empieza con tu primer curso.</p>
                  <Link href="/dashboard/student/courses" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-2.5 text-sm font-bold text-slate-950">
                    Ver cursos <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {inProgressCourses.map((enrollment: any) => (
                    <Link key={enrollment.id} href={`/dashboard/student/course/${enrollment.course_id}/overview`} className="block group">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-cyan-400/30 hover:bg-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 font-black text-slate-950">
                            {enrollment.courses?.title?.charAt(0) || 'C'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-base font-semibold text-white group-hover:text-cyan-300">
                              {enrollment.courses?.title || 'Curso'}
                            </h3>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                                  style={{ width: `${enrollment.progress || 0}%` }}
                                />
                              </div>
                              <span className="w-10 text-right text-xs font-semibold text-cyan-300">{enrollment.progress || 0}%</span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-500 transition group-hover:text-cyan-300" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-orange-400/20 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(8,19,33,0.35)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
                    <Target className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Tareas pendientes</h2>
                </div>
                {pendingTasks.length > 0 && (
                  <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
                    {pendingTasks.length}
                  </span>
                )}
              </div>

              {pendingTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                    <CheckCircle className="h-7 w-7" />
                  </div>
                  <p className="text-sm text-slate-300">¡Todo está en orden! No tienes tareas pendientes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.slice(0, 4).map((task: any, idx: number) => (
                    <Link key={task.id || idx} href={`/dashboard/student/tasks/${task.id}`} className="block">
                      <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-orange-400/30 hover:bg-slate-900">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white">{task.title}</div>
                          <div className="mt-1 text-xs text-slate-400">{task.courses?.title || 'Curso'}</div>
                        </div>
                        <div className="text-right">
                          <div className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold text-orange-300">{task.max_points} pts</div>
                          {task.due_date && (
                            <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                              <Clock className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-violet-400/20 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(8,19,33,0.35)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Exámenes</h2>
                </div>
                {pendingExams.length > 0 && (
                  <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                    {pendingExams.length}
                  </span>
                )}
              </div>

              {pendingExams.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                    <CheckCircle className="h-7 w-7" />
                  </div>
                  <p className="text-sm text-slate-300">No tienes evaluaciones pendientes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingExams.slice(0, 4).map((exam: any, idx: number) => (
                    <Link key={exam.id || idx} href={`/dashboard/student/exam/${exam.id}`} className="block">
                      <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-violet-400/30 hover:bg-slate-900">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white">{exam.title}</div>
                          <div className="mt-1 text-xs text-slate-400">{exam.courses?.title || 'Curso'}</div>
                        </div>
                        <div className="text-right">
                          <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${exam.scope === 'topic_quiz' ? 'bg-blue-500/10 text-blue-300' : exam.scope === 'unit_exam' ? 'bg-violet-500/10 text-violet-300' : 'bg-orange-500/10 text-orange-300'}`}>
                            {exam.scope === 'topic_quiz' ? 'Quiz' : exam.scope === 'unit_exam' ? 'Examen' : 'Final'}
                          </div>
                          {exam.time_limit_minutes && (
                            <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                              <Clock className="h-3 w-3" />
                              {exam.time_limit_minutes} min
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-cyan-400/20 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(8,19,33,0.35)] backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Estadísticas</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <span className="text-sm text-slate-400">Promedio</span>
                  <span className="text-base font-bold text-white">{stats?.averageGrade || 85}%</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <span className="text-sm text-slate-400">Lecciones</span>
                  <span className="text-base font-bold text-white">{stats?.completedLessons || 12}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <span className="text-sm text-slate-400">Horas</span>
                  <span className="text-base font-bold text-white">{stats?.studyHours || 24}h</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <span className="text-sm text-slate-400">Racha</span>
                  <span className="text-base font-bold text-cyan-300">🔥 {stats?.streak || 5} días</span>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-yellow-400/20 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(8,19,33,0.35)] backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-300">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Logros</h3>
              </div>

              <div className="space-y-3">
                {completedCourses.length > 0 ? (
                  completedCourses.slice(0, 3).map((course: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-300">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{course.courses?.title || 'Curso'}</div>
                        <div className="text-xs text-slate-400">Completado</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-10 text-center">
                    <Trophy className="mx-auto mb-2 h-10 w-10 text-slate-500" />
                    <p className="text-sm text-slate-400">Completa cursos para desbloquear logros.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-700 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(8,19,33,0.35)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                    <Bell className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Notificaciones</h3>
                </div>
                {sidebarNotifications.filter((n) => !n.is_read).length > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                    {sidebarNotifications.filter((n) => !n.is_read).length}
                  </span>
                )}
              </div>

              {notifsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-800/60" />
                  ))}
                </div>
              ) : sidebarNotifications.length > 0 ? (
                <div className="space-y-3">
                  {sidebarNotifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.link || '/dashboard/student/tasks'}
                      className={`block rounded-2xl border p-3 transition ${notif.is_read ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-900' : 'border-cyan-400/25 bg-cyan-500/5 hover:bg-cyan-500/10'}`}
                    >
                      <div className={`text-sm font-semibold ${notif.is_read ? 'text-slate-300' : 'text-white'}`}>{notif.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{notif.message}</div>
                      <div className="mt-2 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                        {new Date(notif.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-10 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-slate-500" />
                  <p className="text-sm text-slate-400">Sin notificaciones por ahora.</p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
