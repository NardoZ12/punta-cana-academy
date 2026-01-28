'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { useInstructorCourses } from '@/hooks/useCourses'
import UserMenu from '@/components/molecules/UserMenu'
import Link from 'next/link'
import { 
  Plus, 
  Edit3, 
  Eye, 
  Users, 
  PlayCircle,
  FileText,
  Settings,
  MoreVertical,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function ManageCoursesPage() {
  const { user, profile, isLoading: authLoading } = useAuthContext()
  const router = useRouter()
  const { data: courses = [], isLoading } = useInstructorCourses(profile?.id)
  const [filter, setFilter] = useState('all') // all, published, draft

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  const filteredCourses = courses.filter(course => {
    if (filter === 'published') return course.status === 'published'
    if (filter === 'draft') return course.status === 'draft'
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 className="h-4 w-4" />
      case 'draft': return <Clock className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/teacher"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Volver al Dashboard</span>
              </Link>
              <div className="border-l border-gray-200 h-6"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestionar Cursos
                </h1>
                <p className="text-gray-600 mt-1">
                  Administra todos tus cursos en un solo lugar
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/teacher/create-course"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Curso
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({courses.length})
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Publicados ({courses.filter(c => c.status === 'published').length})
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'draft' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Borradores ({courses.filter(c => c.status === 'draft').length})
              </button>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="space-y-4">
          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No tienes cursos creados' : `No tienes cursos ${filter === 'published' ? 'publicados' : 'en borrador'}`}
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primer curso y comienza a enseñar
              </p>
              <Link
                href="/dashboard/teacher/create-course"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Curso
              </Link>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {course.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                          {getStatusIcon(course.status)}
                          <span className="ml-1 capitalize">{course.status}</span>
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {course.description || 'Sin descripción'}
                      </p>
                      
                      {/* Stats */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>0 estudiantes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <PlayCircle className="h-4 w-4" />
                          <span>0 lecciones</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>0 módulos</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(course.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/dashboard/teacher/course/${course.id}`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Link>
                      <Link
                        href={`/dashboard/teacher/course/${course.id}/edit`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Course Content Structure */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Link
                        href={`/dashboard/teacher/course/${course.id}/modules`}
                        className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-blue-900">Módulos</p>
                          <p className="text-sm text-blue-600">Organizar contenido</p>
                        </div>
                      </Link>

                      <Link
                        href={`/dashboard/teacher/course/${course.id}/lessons`}
                        className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <PlayCircle className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-green-900">Lecciones</p>
                          <p className="text-sm text-green-600">Videos y contenido</p>
                        </div>
                      </Link>

                      <Link
                        href={`/dashboard/teacher/course/${course.id}/exams`}
                        className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-purple-600 mr-3" />
                        <div>
                          <p className="font-medium text-purple-900">Exámenes</p>
                          <p className="text-sm text-purple-600">Evaluaciones</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function ManageCourses() {
  return <ManageCoursesPage />
}