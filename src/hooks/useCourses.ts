import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Course, CourseLesson, Enrollment, Profile } from '@/types/lms'

// Hook para obtener todos los cursos
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const supabase = createClient()
      // Consulta simplificada sin JOIN
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as Course[]
    }
  })
}

// Hook para obtener un curso específico
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async (): Promise<Course> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles(id, full_name, email),
          lessons:course_lessons(*)
        `)
        .eq('id', courseId)
        .single()

      if (error) throw new Error(error.message)
      return data as Course
    },
    enabled: !!courseId
  })
}

// Hook para obtener cursos de un instructor
export function useInstructorCourses(instructorId?: string) {
  return useQuery({
    queryKey: ['instructor-courses', instructorId],
    queryFn: async (): Promise<Course[]> => {
      const supabase = createClient()
      
      // Consulta simplificada sin JOIN - solo los cursos
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      
      // Si necesitamos los datos del instructor, los obtenemos por separado
      if (data && data.length > 0) {
        const { data: instructorData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', instructorId)
          .single()
        
        // Agregar datos del instructor a cada curso
        const coursesWithInstructor = data.map(course => ({
          ...course,
          instructor: instructorData
        }))
        
        return coursesWithInstructor as Course[]
      }
      
      return data as Course[]
    },
    enabled: !!instructorId
  })
}

// Hook para obtener inscripciones de un estudiante
export function useStudentEnrollments(studentId?: string) {
  return useQuery({
    queryKey: ['student-enrollments', studentId],
    queryFn: async (): Promise<Enrollment[]> => {
      const supabase = createClient()
      
      // Primero obtener las inscripciones
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError)
        return []
      }
      
      if (!enrollmentsData || enrollmentsData.length === 0) {
        return []
      }
      
      // Obtener los cursos relacionados
      const courseIds = enrollmentsData.map(e => e.course_id)
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds)
      
      // Combinar datos
      const enrollmentsWithCourses = enrollmentsData.map(enrollment => ({
        ...enrollment,
        course: coursesData?.find(c => c.id === enrollment.course_id) || null
      }))
      
      return enrollmentsWithCourses as Enrollment[]
    },
    enabled: !!studentId
  })
}

// Hook para obtener lecciones de un curso
export function useCourseLessons(courseId?: string) {
  return useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: async (): Promise<CourseLesson[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index')

      if (error) throw new Error(error.message)
      return data as CourseLesson[]
    },
    enabled: !!courseId
  })
}

// Hook para verificar si un estudiante está inscrito en un curso
export function useEnrollmentStatus(courseId?: string, studentId?: string) {
  return useQuery({
    queryKey: ['enrollment-status', courseId, studentId],
    queryFn: async (): Promise<Enrollment | null> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .single()

      if (error && error.code !== 'PGRST116') throw new Error(error.message)
      return data as Enrollment | null
    },
    enabled: !!courseId && !!studentId
  })
}

// Mutación para inscribir a un estudiante en un curso
export function useEnrollStudent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ courseId, studentId }: { courseId: string; studentId: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          course_id: courseId,
          student_id: studentId,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data, { courseId, studentId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['student-enrollments', studentId] })
      queryClient.invalidateQueries({ queryKey: ['enrollment-status', courseId, studentId] })
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
    }
  })
}

// Mutación para crear un nuevo curso
export function useCreateCourse() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      // Invalidar queries de cursos
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
    }
  })
}

// Mutación para actualizar un curso
export function useUpdateCourse() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ courseId, updates }: { courseId: string; updates: Partial<Course> }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['course', data.id] })
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
    }
  })
}

// Mutación para eliminar un curso
export function useDeleteCourse() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (courseId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw new Error(error.message)
      return courseId
    },
    onSuccess: () => {
      // Invalidar todas las queries de cursos
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
    }
  })
}

// Hook para obtener estadísticas del dashboard del profesor
export function useTeacherStats(instructorId?: string) {
  return useQuery({
    queryKey: ['teacher-stats', instructorId],
    queryFn: async () => {
      const supabase = createClient()
      
      // 1. Obtener número total de cursos del profesor
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)

      // 2. Obtener cursos activos (publicados)
      const { count: activeCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .eq('status', 'published')

      // 3. Obtener cursos en borrador
      const { count: draftCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .eq('status', 'draft')

      // 4. Obtener inscripciones de los cursos del profesor
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', instructorId)

      const courseIds = coursesData?.map(c => c.id) || []

      let totalStudents = 0
      let newStudents = 0
      let completedCourses = 0
      let averageRating = 0

      if (courseIds.length > 0) {
        // 5. Obtener estudiantes únicos
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id, enrolled_at, progress, completed_at')
          .in('course_id', courseIds)

        totalStudents = new Set(enrollments?.map(e => e.student_id)).size

        // 6. Nuevos estudiantes (últimos 7 días)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        newStudents = enrollments?.filter(e => e.enrolled_at >= weekAgo).length || 0

        // 7. Cursos completados
        completedCourses = enrollments?.filter(e => e.completed_at).length || 0

        // 8. Calificación promedio (simulada por ahora - implementar cuando tengamos reviews)
        const totalEnrollments = enrollments?.length || 0
        if (totalEnrollments > 0) {
          // Simulamos una calificación basada en el progreso promedio
          const avgProgress = enrollments?.reduce((sum, e) => sum + (e.progress || 0), 0) / totalEnrollments
          averageRating = Math.round((3 + (avgProgress / 100) * 2) * 10) / 10 // Entre 3.0 y 5.0
        }
      }

      return {
        totalCourses: totalCourses || 0,
        activeCourses: activeCourses || 0,
        draftCourses: draftCourses || 0,
        totalStudents,
        newStudents,
        completedCourses,
        averageRating
      }
    },
    enabled: !!instructorId
  })
}

// Hook para obtener estadísticas del dashboard del estudiante
export function useStudentStats(studentId?: string) {
  return useQuery({
    queryKey: ['student-stats', studentId],
    queryFn: async () => {
      const supabase = createClient()
      
      try {
        // Obtener inscripciones
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select('*')
          .eq('student_id', studentId)

        if (error) {
          console.error('Error fetching student stats:', error)
          return {
            totalCourses: 0,
            completedCourses: 0,
            inProgressCourses: 0,
          }
        }
        
        const total = enrollments?.length || 0
        const completed = enrollments?.filter(e => e.status === 'completed')?.length || 0
        const inProgress = total - completed

        return {
          totalCourses: total,
          completedCourses: completed,
          inProgressCourses: inProgress,
        }
      } catch (err) {
        console.error('Error in useStudentStats:', err)
        return {
          totalCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
        }
      }
    },
    enabled: !!studentId
  })
}

// =================================================================
// NUEVOS HOOKS PARA ESTRUCTURA COMPLETA DEL CURSO
// =================================================================

// Hook para obtener la estructura completa del curso (unidades, temas, evaluaciones)
export function useCourseStructure(courseId?: string) {
  return useQuery({
    queryKey: ['course-structure', courseId],
    queryFn: async () => {
      const supabase = createClient()
      
      // Obtener curso con info del instructor
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*, profiles:instructor_id(id, full_name, email)')
        .eq('id', courseId)
        .single()
      
      if (courseError) throw new Error(courseError.message)
      
      // Obtener unidades ordenadas
      const { data: units } = await supabase
        .from('course_units')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true })
      
      // Obtener temas de todas las unidades
      const { data: topics } = await supabase
        .from('unit_topics')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true })
      
      // Obtener recursos de todos los temas
      const topicIds = topics?.map(t => t.id) || []
      const { data: resources } = await supabase
        .from('topic_resources')
        .select('*')
        .in('topic_id', topicIds.length > 0 ? topicIds : ['none'])
      
      // Organizar estructura jerárquica
      const unitsWithTopics = (units || []).map(unit => ({
        ...unit,
        topics: (topics || [])
          .filter(t => t.unit_id === unit.id)
          .map(topic => ({
            ...topic,
            resources: resources?.find(r => r.topic_id === topic.id) || null
          }))
      }))
      
      return {
        ...course,
        units: unitsWithTopics,
        totalUnits: units?.length || 0,
        totalTopics: topics?.length || 0
      }
    },
    enabled: !!courseId
  })
}

// Hook para obtener tareas pendientes de un estudiante en un curso
export function useStudentAssignments(courseId?: string, studentId?: string) {
  return useQuery({
    queryKey: ['student-assignments', courseId, studentId],
    queryFn: async () => {
      const supabase = createClient()
      
      // Obtener tareas del curso (para todos o específicas del estudiante)
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .or(`target_type.eq.all_students,target_student_id.eq.${studentId}`)
        .order('due_date', { ascending: true })
      
      if (error) {
        console.error('Error fetching assignments:', error)
        return { pending: [], submitted: [], graded: [] }
      }
      
      // Obtener entregas del estudiante
      const assignmentIds = assignments?.map(a => a.id) || []
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds.length > 0 ? assignmentIds : ['none'])
      
      // Clasificar tareas
      const submittedIds = new Set(submissions?.map(s => s.assignment_id) || [])
      const gradedSubmissions = submissions?.filter(s => s.status === 'graded') || []
      const gradedIds = new Set(gradedSubmissions.map(s => s.assignment_id))
      
      const pending = (assignments || [])
        .filter(a => !submittedIds.has(a.id))
        .map(a => ({ ...a, status: 'pending' }))
      
      const submitted = (assignments || [])
        .filter(a => submittedIds.has(a.id) && !gradedIds.has(a.id))
        .map(a => ({
          ...a,
          status: 'submitted',
          submission: submissions?.find(s => s.assignment_id === a.id)
        }))
      
      const graded = (assignments || [])
        .filter(a => gradedIds.has(a.id))
        .map(a => ({
          ...a,
          status: 'graded',
          submission: submissions?.find(s => s.assignment_id === a.id)
        }))
      
      return { pending, submitted, graded }
    },
    enabled: !!courseId && !!studentId
  })
}

// Hook para obtener todas las tareas pendientes de un estudiante (todos los cursos)
export function useAllStudentAssignments(studentId?: string) {
  return useQuery({
    queryKey: ['all-student-assignments', studentId],
    queryFn: async () => {
      const supabase = createClient()
      
      // Obtener inscripciones del estudiante
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentId)
      
      const courseIds = enrollments?.map(e => e.course_id) || []
      if (courseIds.length === 0) return { pending: [], submitted: [], graded: [] }
      
      // Obtener tareas de todos los cursos
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*, courses:course_id(id, title)')
        .in('course_id', courseIds)
        .eq('is_published', true)
        .order('due_date', { ascending: true })
      
      // Obtener entregas del estudiante
      const assignmentIds = assignments?.map(a => a.id) || []
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds.length > 0 ? assignmentIds : ['none'])
      
      const submittedIds = new Set(submissions?.map(s => s.assignment_id) || [])
      const gradedSubmissions = submissions?.filter(s => s.status === 'graded') || []
      const gradedIds = new Set(gradedSubmissions.map(s => s.assignment_id))
      
      const pending = (assignments || [])
        .filter(a => !submittedIds.has(a.id))
        .map(a => ({ ...a, status: 'pending' }))
      
      const submitted = (assignments || [])
        .filter(a => submittedIds.has(a.id) && !gradedIds.has(a.id))
        .map(a => ({
          ...a,
          status: 'submitted',
          submission: submissions?.find(s => s.assignment_id === a.id)
        }))
      
      const graded = (assignments || [])
        .filter(a => gradedIds.has(a.id))
        .map(a => ({
          ...a,
          status: 'graded',
          submission: submissions?.find(s => s.assignment_id === a.id)
        }))
      
      return { pending, submitted, graded }
    },
    enabled: !!studentId
  })
}

// Hook para obtener evaluaciones pendientes de un estudiante
export function useStudentEvaluations(courseId?: string, studentId?: string) {
  return useQuery({
    queryKey: ['student-evaluations', courseId, studentId],
    queryFn: async () => {
      const supabase = createClient()
      
      // Obtener evaluaciones del curso
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching evaluations:', error)
        return { pending: [], completed: [] }
      }
      
      // Obtener intentos del estudiante
      const evalIds = evaluations?.map(e => e.id) || []
      const { data: attempts } = await supabase
        .from('evaluation_attempts')
        .select('*')
        .eq('student_id', studentId)
        .in('evaluation_id', evalIds.length > 0 ? evalIds : ['none'])
        .order('attempt_number', { ascending: false })
      
      // Clasificar evaluaciones
      const completedIds = new Set(attempts?.filter(a => a.status === 'submitted' || a.status === 'graded').map(a => a.evaluation_id) || [])
      
      const pending = (evaluations || [])
        .filter(e => !completedIds.has(e.id))
        .map(e => {
          const evalAttempts = attempts?.filter(a => a.evaluation_id === e.id) || []
          return {
            ...e,
            status: 'pending',
            attemptsUsed: evalAttempts.length,
            canRetake: evalAttempts.length < e.max_attempts
          }
        })
      
      const completed = (evaluations || [])
        .filter(e => completedIds.has(e.id))
        .map(e => {
          const evalAttempts = attempts?.filter(a => a.evaluation_id === e.id) || []
          const bestAttempt = evalAttempts.reduce((best, current) => 
            (current.score || 0) > (best?.score || 0) ? current : best
          , evalAttempts[0])
          return {
            ...e,
            status: 'completed',
            bestScore: bestAttempt?.score || 0,
            passed: bestAttempt?.passed,
            attemptsUsed: evalAttempts.length
          }
        })
      
      return { pending, completed }
    },
    enabled: !!courseId && !!studentId
  })
}

// Hook para obtener todas las evaluaciones pendientes de un estudiante
export function useAllStudentEvaluations(studentId?: string) {
  return useQuery({
    queryKey: ['all-student-evaluations', studentId],
    queryFn: async () => {
      const supabase = createClient()
      
      // Obtener inscripciones
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentId)
      
      const courseIds = enrollments?.map(e => e.course_id) || []
      if (courseIds.length === 0) return { pending: [], completed: [] }
      
      // Obtener evaluaciones de todos los cursos
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('*, courses:course_id(id, title)')
        .in('course_id', courseIds)
        .eq('is_published', true)
        .order('created_at', { ascending: true })
      
      // Obtener intentos
      const evalIds = evaluations?.map(e => e.id) || []
      const { data: attempts } = await supabase
        .from('evaluation_attempts')
        .select('*')
        .eq('student_id', studentId)
        .in('evaluation_id', evalIds.length > 0 ? evalIds : ['none'])
      
      const completedIds = new Set(attempts?.filter(a => a.status === 'submitted' || a.status === 'graded').map(a => a.evaluation_id) || [])
      
      const pending = (evaluations || [])
        .filter(e => !completedIds.has(e.id))
        .map(e => ({ ...e, status: 'pending' }))
      
      const completed = (evaluations || [])
        .filter(e => completedIds.has(e.id))
        .map(e => {
          const bestAttempt = attempts?.filter(a => a.evaluation_id === e.id)
            .reduce((best, curr) => (curr.score || 0) > (best?.score || 0) ? curr : best, undefined as any)
          return { ...e, status: 'completed', bestScore: bestAttempt?.score, passed: bestAttempt?.passed }
        })
      
      return { pending, completed }
    },
    enabled: !!studentId
  })
}

// Hook para obtener progreso del estudiante en un curso
export function useStudentCourseProgress(courseId?: string, studentId?: string) {
  return useQuery({
    queryKey: ['student-course-progress', courseId, studentId],
    queryFn: async () => {
      const supabase = createClient()
      
      // Obtener progreso por unidad
      const { data: unitProgress } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
      
      // Obtener progreso por tema
      const { data: topicProgress } = await supabase
        .from('topic_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
      
      // Calcular progreso general
      const completedTopics = topicProgress?.filter(t => t.completed)?.length || 0
      const totalTopics = topicProgress?.length || 1
      const overallProgress = Math.round((completedTopics / totalTopics) * 100)
      
      return {
        unitProgress: unitProgress || [],
        topicProgress: topicProgress || [],
        completedTopics,
        totalTopics,
        overallProgress
      }
    },
    enabled: !!courseId && !!studentId
  })
}

// Hook para que el profesor vea el progreso de estudiantes en un curso
export function useCourseStudentsProgress(courseId?: string) {
  return useQuery({
    queryKey: ['course-students-progress', courseId],
    queryFn: async () => {
      const supabase = createClient()
      
      // Obtener inscripciones con info del estudiante
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, profiles:student_id(id, full_name, email, avatar_url)')
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false })
      
      if (!enrollments || enrollments.length === 0) return []
      
      // Obtener progreso por unidad de todos los estudiantes
      const studentIds = enrollments.map(e => e.student_id)
      const { data: unitProgress } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('course_id', courseId)
        .in('student_id', studentIds)
      
      // Obtener entregas de tareas
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('course_id', courseId)
      const assignmentIds = assignments?.map(a => a.id) || []
      
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .in('assignment_id', assignmentIds.length > 0 ? assignmentIds : ['none'])
        .in('student_id', studentIds)
      
      // Obtener evaluaciones completadas
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('id')
        .eq('course_id', courseId)
      const evalIds = evaluations?.map(e => e.id) || []
      
      const { data: attempts } = await supabase
        .from('evaluation_attempts')
        .select('*')
        .in('evaluation_id', evalIds.length > 0 ? evalIds : ['none'])
        .in('student_id', studentIds)
        .eq('status', 'graded')
      
      // Construir datos de progreso por estudiante
      return enrollments.map(enrollment => {
        const studentUnitProgress = unitProgress?.filter(up => up.student_id === enrollment.student_id) || []
        const studentSubmissions = submissions?.filter(s => s.student_id === enrollment.student_id) || []
        const studentAttempts = attempts?.filter(a => a.student_id === enrollment.student_id) || []
        
        // Calcular promedio de calificaciones
        const grades = [
          ...studentSubmissions.filter(s => s.score !== null).map(s => s.score),
          ...studentAttempts.filter(a => a.score !== null).map(a => a.score)
        ]
        const averageGrade = grades.length > 0 
          ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) 
          : null
        
        return {
          student: enrollment.profiles,
          enrollment: {
            enrolledAt: enrollment.enrolled_at,
            progress: enrollment.progress || 0,
            status: enrollment.status
          },
          unitsCompleted: studentUnitProgress.filter(up => up.completion_percent === 100).length,
          assignmentsSubmitted: studentSubmissions.length,
          totalAssignments: assignmentIds.length,
          evaluationsCompleted: studentAttempts.length,
          totalEvaluations: evalIds.length,
          averageGrade,
          lastActivity: enrollment.updated_at || enrollment.enrolled_at
        }
      })
    },
    enabled: !!courseId
  })
}