'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { useInstructorCourses, useTeacherStats } from '@/hooks/useCourses'
import { useRealtimeStudents, useRealtimeTasks, useRealtimeCourses } from '@/hooks/useRealtime'
import { withAuth } from '@/contexts/AuthContext'
import UserMenu from '@/components/molecules/UserMenu'
import Link from 'next/link'
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Calendar,
  Target,
  Plus,
  Trophy,
  Star,
  Edit,
  Eye,
  Settings,
  Bell
} from 'lucide-react'

function TeacherDashboard() {
  const { user, profile, loading: authLoading } = useAuthContext()
  
  // Verificar que el perfil esté disponible antes de hacer las consultas
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useInstructorCourses(profile?.id)
  const { data: stats, isLoading: statsLoading, error: statsError } = useTeacherStats(profile?.id)
  
  // Hooks en tiempo real
  const { students: realtimeStudents } = useRealtimeStudents()
  const { tasks: realtimeTasks, grades: realtimeGrades } = useRealtimeTasks()
  const { courses: realtimeCourses } = useRealtimeCourses()

  const loading = authLoading || coursesLoading || statsLoading

  // Cursos activos y en borrador
  const activeCourses = courses.filter(c => c.status === 'published')
  const draftCourses = courses.filter(c => c.status === 'draft')

  // Mostrar error si no se puede obtener el perfil
  if (!authLoading && (!user || !profile)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Perfil</h2>
          <p className="text-gray-600 mb-4">
            No se pudo cargar tu perfil de profesor. Esto puede ser un problema de permisos en la base de datos.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Reintentar
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Usuario: {user?.email || 'No disponible'}
          </p>
        </div>
      </div>
    )
  }

  // Mostrar errores específicos de datos
  if (coursesError || statsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Base de Datos</h2>
          <p className="text-gray-600 mb-4">
            Error al cargar los datos del dashboard. Verifica las políticas RLS.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            {coursesError && <p>Courses Error: {coursesError.message}</p>}
            {statsError && <p>Stats Error: {statsError.message}</p>}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Perfil: {profile?.full_name || 'Cargando...'}</p>
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
                Dashboard de Instructor
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido, {profile?.full_name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/teacher/create-course"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Curso
              </Link>
              <UserMenu />
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
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                  {realtimeStudents.length > 0 && (
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                      <span className="text-xs">+{realtimeStudents.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cursos Activos</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeCourses || 0}</p>
                  {realtimeCourses.length > 0 && (
                    <div className="flex items-center text-blue-600">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-1"></div>
                      <span className="text-xs">actualizaciones</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Borrador</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.draftCourses || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nuevas métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nuevos estudiantes</p>
                <p className="text-3xl font-bold text-green-600">+{stats?.newStudents || 12}</p>
                <p className="text-sm text-gray-500">Esta semana</p>
              </div>
              <div className="text-green-500">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cursos completados</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.completedCourses || 8}</p>
                <p className="text-sm text-gray-500">Este mes</p>
              </div>
              <div className="text-blue-500">
                <Trophy className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Calificación promedio</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.averageRating || 4.8}/5</p>
                <p className="text-sm text-gray-500">De estudiantes</p>
              </div>
              <div className="text-yellow-500">
                <Star className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Actividad en Tiempo Real */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-indigo-600" />
              Actividad en Tiempo Real
            </h2>
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm">En vivo</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Nuevos estudiantes */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Nuevos Estudiantes</h3>
              <div className="space-y-2">
                {realtimeStudents.slice(0, 3).map((student, index) => (
                  <div key={index} className="flex items-center text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="flex-1">Se inscribió {student.student_name}</span>
                    <span className="text-xs text-green-600">
                      {new Date(student.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {realtimeStudents.length === 0 && (
                  <p className="text-sm text-green-600">Sin nuevas inscripciones</p>
                )}
              </div>
            </div>

            {/* Tareas recientes */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Tareas Recientes</h3>
              <div className="space-y-2">
                {realtimeTasks.slice(0, 3).map((task, index) => (
                  <div key={index} className="flex items-center text-sm text-blue-700">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    <span className="flex-1">Nueva tarea: {task.title}</span>
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
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">Calificaciones</h3>
              <div className="space-y-2">
                {realtimeGrades.slice(0, 3).map((grade, index) => (
                  <div key={index} className="flex items-center text-sm text-purple-700">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    <span className="flex-1">Calificación: {grade.score}/100</span>
                    <span className="text-xs text-purple-600">
                      {new Date(grade.updated_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {realtimeGrades.length === 0 && (
                  <p className="text-sm text-purple-600">Sin calificaciones nuevas</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mis Cursos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Mis Cursos</h2>
                <Link 
                  href="/dashboard/teacher/courses"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Ver todos
                </Link>
              </div>
              <div className="p-6">
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes cursos creados
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Crea tu primer curso y comienza a enseñar
                    </p>
                    <Link 
                      href="/dashboard/teacher/create-course"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Curso
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.slice(0, 4).map((course) => (
                      <div 
                        key={course.id} 
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="font-semibold text-gray-900">
                              {course.title}
                            </h3>
                            <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                              course.status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {course.status === 'published' ? 'Publicado' : 'Borrador'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {course.description?.substring(0, 100)}...
                          </p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            <span className="mr-4">{course.enrolled_students || 0} estudiantes</span>
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Creado {new Date(course.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="ml-6 flex items-center space-x-2">
                          <Link 
                            href={`/dashboard/teacher/course/${course.id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Link>
                          <Link 
                            href={`/dashboard/teacher/course/${course.id}/edit`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
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
                  href="/dashboard/teacher/create-course"
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Crear Nuevo Curso
                </Link>
                <Link 
                  href="/dashboard/teacher/manage-courses"
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <BookOpen className="h-5 w-5 mr-3 text-gray-400" />
                  Gestionar Cursos
                </Link>
                <Link 
                  href="/dashboard/teacher/student"
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Users className="h-5 w-5 mr-3 text-gray-400" />
                  Ver Estudiantes
                </Link>
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Resumen Semanal</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nuevos estudiantes</span>
                    <span className="font-semibold text-green-600">+12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cursos completados</span>
                    <span className="font-semibold text-blue-600">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Calificación promedio</span>
                    <span className="font-semibold text-yellow-600">4.8/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Próximas tareas */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recordatorios</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Revisar tareas pendientes
                      </p>
                      <p className="text-xs text-gray-500">5 tareas sin calificar</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Actualizar contenido
                      </p>
                      <p className="text-xs text-gray-500">Curso "JavaScript Avanzado"</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Reunión con estudiantes
                      </p>
                      <p className="text-xs text-gray-500">Mañana a las 10:00 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Exportar con protección de autenticación
export default withAuth(TeacherDashboard, ['teacher', 'admin'])