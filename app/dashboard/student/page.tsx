'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { useStudentEnrollments, useStudentStats } from '@/hooks/useCourses'
import { useRealtimeStudentDashboard } from '@/hooks/useRealtime'
import { withAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { 
  TrendingUp, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Target,
  Play,
  BarChart3,
  Trophy,
  Star,
  Bell,
  AlertTriangle
} from 'lucide-react'

function StudentDashboard() {
  const { user, profile } = useAuthContext()
  
  // Usar los hooks para obtener datos
  // Agregamos fallback a [] por si el hook falla o devuelve undefined
  const { data: enrollments = [], isLoading: enrollmentsLoading, error: enrollmentsError } = useStudentEnrollments(profile?.id)
  const { data: stats, isLoading: statsLoading } = useStudentStats(profile?.id)
  
  // Hook en tiempo real
  const { courses: realtimeCourses = [], tasks: realtimeTasks = [], grades: realtimeGrades = [] } = useRealtimeStudentDashboard()

  const loading = enrollmentsLoading || statsLoading

  // LOGICA SEGURA: Extraer el primer nombre del full_name
  const displayName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Estudiante';

  // Cursos en progreso (Validamos que e.status exista)
  const inProgressCourses = enrollments?.filter(e => e.status === 'active' || e.status === 'in_progress') || []
  
  // Cursos completados
  const completedCourses = enrollments?.filter(e => e.status === 'completed') || []
  
  // Progreso general (Validación anti-crash división por cero)
  const overallProgress = (enrollments?.length || 0) > 0 
    ? Math.round((completedCourses.length / enrollments.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 animate-pulse">Cargando tu aprendizaje...</p>
        </div>
      </div>
    )
  }

  // Manejo de error si los hooks fallan
  if (enrollmentsError) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4"/>
                <h2 className="text-xl font-bold mb-2">Algo salió mal al cargar tus cursos</h2>
                <p className="text-gray-500 mb-6">No pudimos sincronizar tus datos. Verifica tu conexión.</p>
                <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Recargar Página
                </button>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Hola, {displayName}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido a tu dashboard de estudiante
              </p>
            </div>
            <div className="flex items-center space-x-4 bg-indigo-50 p-3 rounded-xl">
              <div className="text-right">
                <p className="text-sm text-gray-500">Progreso general</p>
                <p className="text-2xl font-bold text-indigo-600">{overallProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCourses || enrollments.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900">{stats?.completedCourses || completedCourses.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.inProgressCourses || inProgressCourses.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Cursos en Progreso */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Cursos en Progreso</h2>
                <Link href="/dashboard/student/courses" className="text-sm text-indigo-600 hover:underline">Ver todos</Link>
              </div>
              <div className="p-6">
                {inProgressCourses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes cursos en progreso
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Explora nuestros cursos disponibles y comienza tu aprendizaje
                    </p>
                    <Link 
                      href="/cursos"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      Explorar Cursos
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inProgressCourses.map((enrollment) => (
                      <div 
                        key={enrollment.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow gap-4"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {enrollment.course?.title || 'Curso sin título'}
                          </h3>
                          {/* CORRECCIÓN: Usamos full_name para el instructor y validamos existencia */}
                          <p className="text-sm text-gray-600 mt-1">
                            Instructor: {enrollment.course?.instructor?.full_name || 'Punta Cana Academy'}
                          </p>
                          
                          <div className="flex items-center mt-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3 max-w-[200px]">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full" 
                                style={{ width: `${enrollment.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {enrollment.progress || 0}%
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Link 
                            href={`/dashboard/student/course/${enrollment.course?.id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors w-full justify-center sm:w-auto"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Continuar
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Sidebar */}
          <div className="space-y-6">
            
            {/* Actividad en Tiempo Real (Simplificada para evitar crashes) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-indigo-600" />
                    Actividad Reciente
                    </h2>
                    <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>
                
                <div className="space-y-4">
                    {/* Tareas */}
                    <div className="bg-blue-50 rounded-lg p-3">
                        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Nuevas Tareas</h3>
                        {realtimeTasks && realtimeTasks.length > 0 ? (
                             realtimeTasks.slice(0,3).map((t, i) => (
                                <div key={i} className="text-sm text-blue-700 truncate">• {t.title}</div>
                             ))
                        ) : (
                            <p className="text-xs text-blue-500">No hay tareas pendientes</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link 
                  href="/cursos"
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3 group-hover:bg-indigo-200 transition-colors">
                     <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  Explorar Catálogo
                </Link>
                <Link 
                  href="/dashboard/student/courses"
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                   <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                     <BarChart3 className="h-5 w-5 text-green-600" />
                   </div>
                  Mis Cursos
                </Link>
                <Link 
                  href="/dashboard/student/settings"
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                   <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-gray-200 transition-colors">
                     <Target className="h-5 w-5 text-gray-600" />
                   </div>
                  Configuración
                </Link>
              </div>
            </div>

            {/* Logros (Simplificado) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos Logros</h2>
                {completedCourses.length > 0 ? (
                    completedCourses.slice(0,3).map((e, i) => (
                        <div key={i} className="flex items-center gap-3 mb-3">
                            <Star className="text-yellow-400 h-5 w-5" />
                            <span className="text-sm font-medium">{e.course?.title}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4">
                        <Trophy className="h-10 w-10 text-gray-300 mx-auto mb-2"/>
                        <p className="text-xs text-gray-400">Completa cursos para ganar insignias</p>
                    </div>
                )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// Exportar con protección
export default withAuth(StudentDashboard, { 
  requireAuth: true, 
  requireRole: 'student' 
})