'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import UserMenu from '@/components/molecules/UserMenu'
import Link from 'next/link'
import { 
  Users, 
  ArrowLeft,
  Eye,
  MessageSquare,
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  email: string
  full_name: string
  created_at: string
  enrollments: {
    course_id: string
    enrolled_at: string
    progress: number
    status: 'active' | 'completed' | 'paused'
    course: {
      title: string
      description: string
    }
  }[]
}

function StudentsPage() {
  const { user, profile, isLoading: authLoading } = useAuthContext()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, completed

  // Mock data para demostración - posteriormente se conectará con Supabase
  useEffect(() => {
    const mockStudents: Student[] = [
      {
        id: '1',
        email: 'maria@example.com',
        full_name: 'María García',
        created_at: '2026-01-15T10:00:00Z',
        enrollments: [
          {
            course_id: '1',
            enrolled_at: '2026-01-20T10:00:00Z',
            progress: 75,
            status: 'active',
            course: {
              title: 'Introducción a React',
              description: 'Aprende los fundamentos de React'
            }
          }
        ]
      },
      {
        id: '2',
        email: 'carlos@example.com',
        full_name: 'Carlos Rodríguez',
        created_at: '2026-01-10T10:00:00Z',
        enrollments: [
          {
            course_id: '1',
            enrolled_at: '2026-01-18T10:00:00Z',
            progress: 100,
            status: 'completed',
            course: {
              title: 'Introducción a React',
              description: 'Aprende los fundamentos de React'
            }
          },
          {
            course_id: '2',
            enrolled_at: '2026-01-25T10:00:00Z',
            progress: 25,
            status: 'active',
            course: {
              title: 'JavaScript Avanzado',
              description: 'Conceptos avanzados de JavaScript'
            }
          }
        ]
      },
      {
        id: '3',
        email: 'ana@example.com',
        full_name: 'Ana López',
        created_at: '2026-01-05T10:00:00Z',
        enrollments: [
          {
            course_id: '2',
            enrolled_at: '2026-01-22T10:00:00Z',
            progress: 50,
            status: 'paused',
            course: {
              title: 'JavaScript Avanzado',
              description: 'Conceptos avanzados de JavaScript'
            }
          }
        ]
      }
    ]
    setStudents(mockStudents)
    setIsLoading(false)
  }, [])

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estudiantes...</p>
        </div>
      </div>
    )
  }

  const filteredStudents = students.filter(student => {
    if (filter === 'active') {
      return student.enrollments.some(e => e.status === 'active')
    }
    if (filter === 'completed') {
      return student.enrollments.some(e => e.status === 'completed')
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'paused': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-blue-500'
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
                  Mis Estudiantes
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona y supervisa el progreso de tus estudiantes
                </p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Filtrar Estudiantes</h2>
              <p className="text-sm text-gray-600">Filtra por estado de progreso</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ 
                  filter === 'all' 
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({students.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ 
                  filter === 'active' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Activos ({students.filter(s => s.enrollments.some(e => e.status === 'active')).length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ 
                  filter === 'completed' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completados ({students.filter(s => s.enrollments.some(e => e.status === 'completed')).length})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Estudiantes */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Estudiantes ({filteredStudents.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay estudiantes
                </h3>
                <p className="text-gray-500">
                  No se encontraron estudiantes con los filtros seleccionados
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {student.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <p className="text-xs text-gray-500">
                            Registrado: {new Date(student.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Cursos inscritos */}
                      <div className="space-y-3">
                        {student.enrollments.map((enrollment, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-gray-900">{enrollment.course.title}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                                  {getStatusIcon(enrollment.status)}
                                  {enrollment.status === 'active' ? 'Activo' : 
                                   enrollment.status === 'completed' ? 'Completado' : 'Pausado'}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">{enrollment.progress}%</span>
                            </div>
                            
                            {/* Barra de progreso */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${getProgressColor(enrollment.progress)}`}
                                style={{ width: `${enrollment.progress}%` }}
                              ></div>
                            </div>
                            
                            <p className="text-xs text-gray-600">{enrollment.course.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Inscrito: {new Date(enrollment.enrolled_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/dashboard/teacher/student/${student.id}`}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Perfil
                      </Link>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Contactar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentsPage