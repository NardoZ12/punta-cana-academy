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
  Calendar,
  Target,
  Play,
  BarChart3,
  Trophy,
  Star,
  Bell
} from 'lucide-react'

function StudentDashboard() {
  const { user, profile } = useAuthContext()
  
  // Usar los hooks para obtener datos
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useStudentEnrollments(profile?.id)
  const { data: stats, isLoading: statsLoading } = useStudentStats(profile?.id)
  
  // Hook en tiempo real para el dashboard del estudiante
  const { courses: realtimeCourses, tasks: realtimeTasks, grades: realtimeGrades } = useRealtimeStudentDashboard()

  const loading = enrollmentsLoading || statsLoading

  // Cursos en progreso
  const inProgressCourses = enrollments.filter(e => e.status === 'active')
  
  // Cursos completados
  const completedCourses = enrollments.filter(e => e.status === 'completed')
  
  // Progreso general
  const overallProgress = enrollments.length > 0 
    ? Math.round((completedCourses.length / enrollments.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Hola, {profile?.first_name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido a tu dashboard de estudiante
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Progreso general</p>
                <p className="text-2xl font-bold text-indigo-600">{overallProgress}%</p>
              </div>
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Trophy className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCourses || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900">{stats?.completedCourses || 0}</p>
                  {realtimeCourses.filter(c => c.status === 'completed').length > 0 && (
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                      <span className="text-xs">nuevo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.inProgressCourses || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Calificaciones</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900">85%</p>
                  {realtimeGrades.length > 0 && (
                    <div className="flex items-center text-purple-600">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse mr-1"></div>
                      <span className="text-xs">+{realtimeGrades.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actividad en Tiempo Real */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-indigo-600" />
              Actualizaciones en Tiempo Real
            </h2>
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm">En vivo</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nuevas tareas */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Nuevas Tareas</h3>
              <div className="space-y-2">
                {realtimeTasks.slice(0, 4).map((task, index) => (
                  <div key={index} className="flex items-center text-sm text-blue-700">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    <span className="flex-1">{task.title}</span>
                    <span className="text-xs text-blue-600">
                      {new Date(task.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {realtimeTasks.length === 0 && (
                  <p className="text-sm text-blue-600">Sin tareas nuevas</p>
                )}
              </div>
            </div>

            {/* Calificaciones actualizadas */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Calificaciones Recientes</h3>
              <div className="space-y-2">
                {realtimeGrades.slice(0, 4).map((grade, index) => (
                  <div key={index} className="flex items-center text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="flex-1">Calificación: {grade.score}/100</span>
                    <span className="text-xs text-green-600">
                      {new Date(grade.updated_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {realtimeGrades.length === 0 && (
                  <p className="text-sm text-green-600">Sin calificaciones nuevas</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cursos en Progreso */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Cursos en Progreso</h2>
              </div>
              <div className="p-6">
                {inProgressCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {enrollment.course.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Instructor: {enrollment.course.instructor?.first_name} {enrollment.course.instructor?.last_name}
                          </p>
                          <div className="flex items-center mt-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
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
                        <div className="ml-6">
                          <Link 
                            href={`/dashboard/student/course/${enrollment.course.id}`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                          >
                            <Play className="h-4 w-4 mr-1" />
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Acciones Rápidas */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
              </div>
              <div className="p-6 space-y-3">
                <Link 
                  href="/cursos"
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <BookOpen className="h-5 w-5 mr-3 text-gray-400" />
                  Explorar Cursos
                </Link>
                <Link 
                  href="/dashboard/student/courses"
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <BarChart3 className="h-5 w-5 mr-3 text-gray-400" />
                  Mis Cursos
                </Link>
                <Link 
                  href="/dashboard/student/settings"
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Target className="h-5 w-5 mr-3 text-gray-400" />
                  Configuración
                </Link>
              </div>
            </div>

            {/* Logros Recientes */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Logros Recientes</h2>
              </div>
              <div className="p-6">
                {completedCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Aún no tienes logros. ¡Completa tu primer curso!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedCourses.slice(0, 3).map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {enrollment.course.title}
                          </p>
                          <p className="text-xs text-gray-500">Completado</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Exportar con protección de autenticación
export default withAuth(StudentDashboard, ['student'])