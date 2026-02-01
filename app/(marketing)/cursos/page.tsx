'use client'

import { useState } from 'react'
import { useCourses } from '@/hooks/useCourses'
import { useAuthContext } from '@/contexts/AuthContext'
import { useEnrollStudent } from '@/hooks/useCourses'
import Link from 'next/link'
import { 
  Search, 
  Clock, 
  Users, 
  Star,
  BookOpen,
  Filter,
  ChevronRight,
  Play,
  Check
} from 'lucide-react'

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const { data: courses = [], isLoading } = useCourses()
  const { isAuthenticated, profile } = useAuthContext()
  const enrollMutation = useEnrollStudent()

  // Filtrar cursos publicados
  const publishedCourses = courses.filter(course => course.status === 'published')

  // Filtrar por búsqueda y categoría
  const filteredCourses = publishedCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Categorías disponibles
  const categories = [
    { value: 'all', label: 'Todos los Cursos' },
    { value: 'programming', label: 'Programación' },
    { value: 'languages', label: 'Idiomas' },
    { value: 'business', label: 'Negocios' },
    { value: 'design', label: 'Diseño' },
  ]

  const handleEnroll = async (courseId: string) => {
    if (!profile) return
    
    try {
      await enrollMutation.mutateAsync({ 
        courseId, 
        studentId: profile.id 
      })
      alert('¡Te has inscrito exitosamente en el curso!')
    } catch (error) {
      alert('Error al inscribirse en el curso')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Explora nuestros <span className="text-cyan-400">Cursos</span>
          </h1>
          <p className="text-gray-200 text-lg max-w-2xl mx-auto mb-10">
            Formación técnica y de idiomas diseñada para el mercado laboral de Punta Cana. 
            ¡Todos nuestros cursos son completamente GRATUITOS! 🎉
          </p>
          
          {/* Barra de Búsqueda */}
          <div className="max-w-xl mx-auto relative">
            <div className="flex">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-l-lg border-0 focus:ring-2 focus:ring-cyan-400 text-gray-900"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 rounded-r-lg border-0 focus:ring-2 focus:ring-cyan-400 text-gray-900"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cursos */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Stats */}
        <div className="mb-12 text-center">
          <p className="text-gray-600">
            {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} disponible{filteredCourses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No se encontraron cursos
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta ajustar tus filtros o términos de búsqueda
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Ver todos los cursos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div 
                key={course.id} 
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                {/* Imagen del curso */}
                <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-white opacity-80" />
                </div>
                
                <div className="p-6">
                  {/* Categoría */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                      {course.category || 'General'}
                    </span>
                  </div>
                  
                  {/* Título y descripción */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  {/* Instructor */}
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-600">
                        {course.instructor?.full_name ? course.instructor.full_name.charAt(0).toUpperCase() : 'I'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {course.instructor?.full_name || 'Instructor'}
                      </p>
                      <p className="text-xs text-gray-500">Instructor</p>
                    </div>
                  </div>
                  
                  {/* Estadísticas */}
                  <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{course.enrolled_students || 0} estudiantes</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{course.duration || 'Por definir'}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-400" />
                      <span>4.8</span>
                    </div>
                  </div>
                  
                  {/* Precio */}
                  <div className="mb-6">
                    <span className="text-2xl font-bold text-green-600">GRATIS</span>
                    <span className="text-sm text-gray-500 ml-2 line-through">$299</span>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex space-x-3">
                    <Link 
                      href={`/cursos/${course.id}`}
                      className="flex-1 text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Ver Detalles
                    </Link>
                    
                    {isAuthenticated && profile?.user_type === 'student' ? (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollMutation.isPending}
                        className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {enrollMutation.isPending ? 'Inscribiendo...' : 'Inscribirse'}
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        className="flex-1 text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                      >
                        Iniciar Sesión
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* CTA Section */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-gray-600 mb-6">
            Contáctanos y cuéntanos qué te gustaría aprender. Estamos constantemente creando nuevos cursos.
          </p>
          <Link 
            href="/contacto"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Contactar
            <ChevronRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}