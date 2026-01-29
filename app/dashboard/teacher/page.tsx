'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { useInstructorCourses, useTeacherStats } from '@/hooks/useCourses'
import { withAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Calendar,
  Plus,
  Trophy,
  Star,
  Edit,
  Eye,
  Bell,
  TrendingUp,
  FileText,
  GraduationCap,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react'

interface StudentProgress {
  id: string
  student_id: string
  student_name: string
  student_email: string
  course_id: string
  course_title: string
  progress: number
  enrolled_at: string
  last_activity?: string
  exam_score?: number
  assignments_completed: number
  total_assignments: number
}

function TeacherDashboard() {
  const { profile, loading: authLoading } = useAuthContext()
  const supabase = createClient()
  
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useInstructorCourses(profile?.id)
  const { data: stats, isLoading: statsLoading, error: statsError } = useTeacherStats(profile?.id)

  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'courses'>('overview')

  const loading = authLoading || coursesLoading || statsLoading

  // Fetch student progress data
  useEffect(() => {
    async function fetchStudentProgress() {
      if (!profile?.id) return
      
      try {
        // Get all courses by this instructor
        const { data: instructorCourses } = await supabase
          .from('courses')
          .select('id, title')
          .eq('instructor_id', profile.id)

        if (!instructorCourses || instructorCourses.length === 0) {
          setStudentProgress([])
          setLoadingStudents(false)
          return
        }

        const courseIds = instructorCourses.map(c => c.id)
        const courseMap = new Map(instructorCourses.map(c => [c.id, c.title]))

        // Get enrollments for these courses
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            id,
            student_id,
            course_id,
            progress,
            enrolled_at,
            grade,
            profiles:student_id (
              id,
              full_name,
              email
            )
          `)
          .in('course_id', courseIds)

        if (!enrollments) {
          setStudentProgress([])
          setLoadingStudents(false)
          return
        }

        // Get exam submissions for these students
        const { data: examSubmissions } = await supabase
          .from('exam_submissions')
          .select('student_id, score, exam_id')
          .in('student_id', enrollments.map(e => e.student_id))

        // Get assignment submissions
        const { data: assignmentSubmissions } = await supabase
          .from('assignment_submissions')
          .select('student_id, assignment_id, status')
          .in('student_id', enrollments.map(e => e.student_id))
          .eq('status', 'graded')

        // Get total assignments per course
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, course_id')
          .in('course_id', courseIds)

        const assignmentsPerCourse = new Map<string, number>()
        assignments?.forEach(a => {
          assignmentsPerCourse.set(a.course_id, (assignmentsPerCourse.get(a.course_id) || 0) + 1)
        })

        // Build progress data
        const progressData: StudentProgress[] = enrollments.map(enrollment => {
          const studentExams = examSubmissions?.filter(e => e.student_id === enrollment.student_id) || []
          const avgExamScore = studentExams.length > 0 
            ? studentExams.reduce((sum, e) => sum + (e.score || 0), 0) / studentExams.length 
            : undefined

          const completedAssignments = assignmentSubmissions?.filter(
            a => a.student_id === enrollment.student_id
          ).length || 0

          const profileData = enrollment.profiles as { id: string; full_name: string; email: string } | null

          return {
            id: enrollment.id,
            student_id: enrollment.student_id,
            student_name: profileData?.full_name || 'Unknown Student',
            student_email: profileData?.email || '',
            course_id: enrollment.course_id,
            course_title: courseMap.get(enrollment.course_id) || 'Unknown Course',
            progress: enrollment.progress || 0,
            enrolled_at: enrollment.enrolled_at,
            exam_score: avgExamScore,
            assignments_completed: completedAssignments,
            total_assignments: assignmentsPerCourse.get(enrollment.course_id) || 0
          }
        })

        setStudentProgress(progressData)
      } catch (error) {
        console.error('Error fetching student progress:', error)
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudentProgress()
  }, [profile?.id, supabase])

  // Filter students
  const filteredStudents = studentProgress.filter(student => {
    const matchesSearch = student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = filterCourse === 'all' || student.course_id === filterCourse
    return matchesSearch && matchesCourse
  })

  // Cursos activos y en borrador
  const activeCourses = courses.filter(c => c.status === 'published' || c.is_published)
  const draftCourses = courses.filter(c => c.status === 'draft' || !c.is_published)

  if (!authLoading && !profile) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-[#161b22] rounded-xl border border-[#30363d]">
          <div className="text-red-400 mb-4 text-4xl">!</div>
          <h2 className="text-xl font-semibold text-white mb-2">Error de Perfil</h2>
          <p className="text-[#8b949e] mb-4">
            No se pudo cargar tu perfil de profesor.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (coursesError || statsError) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-[#161b22] rounded-xl border border-[#30363d]">
          <div className="text-red-400 mb-4 text-4xl">!</div>
          <h2 className="text-xl font-semibold text-white mb-2">Error de Base de Datos</h2>
          <p className="text-[#8b949e] mb-4">
            Error al cargar los datos del dashboard.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-[#8b949e]">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1115]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Dashboard de Instructor
              </h1>
              <p className="text-[#8b949e] mt-1">
                Bienvenido, {profile?.full_name || profile?.first_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard/teacher/create-course"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Curso
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#30363d] mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'border-b-2 border-cyan-500 text-cyan-400' 
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'students' 
                ? 'border-b-2 border-cyan-500 text-cyan-400' 
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            Estudiantes
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'courses' 
                ? 'border-b-2 border-cyan-500 text-cyan-400' 
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            Mis Cursos
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-cyan-500/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#8b949e]">Total Cursos</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalCourses || courses.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#8b949e]">Total Estudiantes</p>
                    <p className="text-2xl font-bold text-white">{studentProgress.length || stats?.totalStudents || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#8b949e]">Cursos Activos</p>
                    <p className="text-2xl font-bold text-white">{activeCourses.length || stats?.activeCourses || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#8b949e]">En Borrador</p>
                    <p className="text-2xl font-bold text-white">{draftCourses.length || stats?.draftCourses || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#8b949e]">Nuevos estudiantes</p>
                    <p className="text-3xl font-bold text-green-400">+{stats?.newStudents || 0}</p>
                    <p className="text-sm text-[#8b949e]">Esta semana</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </div>

              <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#8b949e]">Cursos completados</p>
                    <p className="text-3xl font-bold text-cyan-400">{stats?.completedCourses || 0}</p>
                    <p className="text-sm text-[#8b949e]">Este mes</p>
                  </div>
                  <Trophy className="h-8 w-8 text-cyan-400" />
                </div>
              </div>

              <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#8b949e]">Calificacion promedio</p>
                    <p className="text-3xl font-bold text-amber-400">{stats?.averageRating || 4.5}/5</p>
                    <p className="text-sm text-[#8b949e]">De estudiantes</p>
                  </div>
                  <Star className="h-8 w-8 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Courses */}
              <div className="lg:col-span-2 bg-[#161b22] rounded-xl border border-[#30363d]">
                <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Cursos Recientes</h2>
                  <Link href="/dashboard/teacher/manage-courses" className="text-sm text-cyan-400 hover:text-cyan-300">
                    Ver todos
                  </Link>
                </div>
                <div className="p-6">
                  {courses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">
                        No tienes cursos creados
                      </h3>
                      <p className="text-[#8b949e] mb-6">
                        Crea tu primer curso y comienza a ensenar
                      </p>
                      <Link 
                        href="/dashboard/teacher/create-course"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
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
                          className="flex items-center justify-between p-4 bg-[#21262d] rounded-lg hover:bg-[#30363d] transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-white truncate">
                                {course.title}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                course.status === 'published' || course.is_published
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {course.status === 'published' || course.is_published ? 'Publicado' : 'Borrador'}
                              </span>
                            </div>
                            <div className="flex items-center mt-2 text-sm text-[#8b949e]">
                              <Users className="h-4 w-4 mr-1" />
                              <span className="mr-4">{course.enrolled_students || 0} estudiantes</span>
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{new Date(course.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <Link 
                              href={`/dashboard/teacher/course/${course.id}`}
                              className="p-2 text-[#8b949e] hover:text-white hover:bg-[#30363d] rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link 
                              href={`/dashboard/teacher/course/${course.id}/edit`}
                              className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <div className="bg-[#161b22] rounded-xl border border-[#30363d]">
                  <div className="px-6 py-4 border-b border-[#30363d]">
                    <h2 className="text-lg font-semibold text-white">Acciones Rapidas</h2>
                  </div>
                  <div className="p-4 space-y-2">
                    <Link 
                      href="/dashboard/teacher/create-course"
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-3" />
                      Crear Nuevo Curso
                    </Link>
                    <Link 
                      href="/dashboard/teacher/manage-courses"
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-[#c9d1d9] bg-[#21262d] rounded-lg hover:bg-[#30363d] transition-colors"
                    >
                      <BookOpen className="h-5 w-5 mr-3 text-[#8b949e]" />
                      Gestionar Cursos
                    </Link>
                    <button 
                      onClick={() => setActiveTab('students')}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-[#c9d1d9] bg-[#21262d] rounded-lg hover:bg-[#30363d] transition-colors"
                    >
                      <Users className="h-5 w-5 mr-3 text-[#8b949e]" />
                      Ver Estudiantes
                    </button>
                  </div>
                </div>

                {/* Recent Activity Notification */}
                <div className="bg-[#161b22] rounded-xl border border-[#30363d]">
                  <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-cyan-400" />
                      Actividad Reciente
                    </h2>
                    <div className="flex items-center text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs">En vivo</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {studentProgress.slice(0, 3).map((student, index) => (
                      <div key={index} className="flex items-center text-sm text-[#8b949e]">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                        <span className="flex-1 truncate">{student.student_name} - {student.course_title}</span>
                        <span className="text-xs text-[#8b949e] ml-2">{student.progress}%</span>
                      </div>
                    ))}
                    {studentProgress.length === 0 && (
                      <p className="text-sm text-[#8b949e]">Sin actividad reciente</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-[#161b22] rounded-xl border border-[#30363d]">
            <div className="px-6 py-4 border-b border-[#30363d]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-cyan-400" />
                  Progreso de Estudiantes
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
                    <input
                      type="text"
                      placeholder="Buscar estudiante..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-white placeholder-[#8b949e] focus:outline-none focus:border-cyan-500 w-full sm:w-64"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
                    <select
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      className="pl-10 pr-8 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                    >
                      <option value="all">Todos los cursos</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {searchTerm || filterCourse !== 'all' ? 'No se encontraron estudiantes' : 'Sin estudiantes inscritos'}
                  </h3>
                  <p className="text-[#8b949e]">
                    {searchTerm || filterCourse !== 'all' 
                      ? 'Intenta con otros filtros de busqueda'
                      : 'Los estudiantes apareceran aqui cuando se inscriban en tus cursos'
                    }
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-[#21262d]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">
                        Estudiante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">
                        Curso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">
                        Progreso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">
                        Calificacion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">
                        Tareas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">
                        Inscrito
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b949e] uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363d]">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-[#21262d] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                              <span className="text-cyan-400 font-medium">
                                {student.student_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{student.student_name}</div>
                              <div className="text-sm text-[#8b949e]">{student.student_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-white">{student.course_title}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-[#30363d] rounded-full h-2 mr-3">
                              <div 
                                className="bg-cyan-500 h-2 rounded-full transition-all"
                                style={{ width: `${student.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-white">{student.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            student.exam_score !== undefined
                              ? student.exam_score >= 70 ? 'text-green-400' : 'text-amber-400'
                              : 'text-[#8b949e]'
                          }`}>
                            {student.exam_score !== undefined ? `${student.exam_score.toFixed(0)}%` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-white">
                            {student.assignments_completed}/{student.total_assignments}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8b949e]">
                          {new Date(student.enrolled_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/dashboard/teacher/student/${student.student_id}`}
                            className="inline-flex items-center text-cyan-400 hover:text-cyan-300 text-sm"
                          >
                            Ver detalles
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-[#161b22] rounded-xl border border-[#30363d]">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Todos Mis Cursos</h2>
              <Link 
                href="/dashboard/teacher/create-course"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Curso
              </Link>
            </div>
            <div className="p-6">
              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    No tienes cursos creados
                  </h3>
                  <p className="text-[#8b949e] mb-6">
                    Crea tu primer curso y comienza a ensenar
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div 
                      key={course.id} 
                      className="bg-[#21262d] rounded-xl border border-[#30363d] overflow-hidden hover:border-cyan-500/50 transition-colors"
                    >
                      {course.image_url ? (
                        <img 
                          src={course.image_url} 
                          alt={course.title}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-[#30363d] flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-[#8b949e]" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            course.status === 'published' || course.is_published
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {course.status === 'published' || course.is_published ? 'Publicado' : 'Borrador'}
                          </span>
                          <span className="text-xs text-[#8b949e]">
                            {course.level || 'Todos los niveles'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white mb-2 line-clamp-1">{course.title}</h3>
                        <p className="text-sm text-[#8b949e] mb-4 line-clamp-2">
                          {course.description || 'Sin descripcion'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-[#8b949e] mb-4">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {course.enrolled_students || 0}
                          </span>
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {course.lessons?.length || 0} lecciones
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link 
                            href={`/dashboard/teacher/course/${course.id}/edit`}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                          <Link 
                            href={`/dashboard/teacher/course/${course.id}`}
                            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-[#c9d1d9] bg-[#30363d] hover:bg-[#3d444d] transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(TeacherDashboard, { requireRole: 'teacher' })
