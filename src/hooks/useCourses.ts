import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { supabaseGet, supabasePost, supabasePatch, pgIn } from '@/utils/supabase/fetch'
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
      
      // Get auth token for direct fetch
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      console.log('[useInstructorCourses] Fetching for instructor:', instructorId)

      // Use direct fetch to avoid supabase-js hanging issues  
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      
      const res = await fetch(
        `${supabaseUrl}/rest/v1/courses?instructor_id=eq.${instructorId}&select=*&order=created_at.desc`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal
        }
      )
      clearTimeout(timeout)
      
      const data = await res.json()
      console.log('[useInstructorCourses] Result:', res.status, Array.isArray(data) ? data.length + ' courses' : data)
      
      if (!res.ok) throw new Error(data?.message || 'Error al cargar cursos')
      if (!Array.isArray(data)) return []
      
      // Si necesitamos los datos del instructor, los obtenemos por separado
      if (data.length > 0) {
        const { data: instructorData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', instructorId)
          .single()
        
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
      console.log('[useStudentEnrollments] Fetching for student:', studentId)
      
      // Get enrollments via direct fetch
      const enrollmentsData = await supabaseGet(
        `enrollments?student_id=eq.${studentId}&order=created_at.desc&select=*`
      )
      
      if (!enrollmentsData || enrollmentsData.length === 0) {
        return []
      }
      
      // Get related courses
      const courseIds = enrollmentsData.map((e: any) => e.course_id)
      const coursesData = await supabaseGet(
        `courses?id=${pgIn(courseIds)}&select=*`
      )
      
      // Combine data
      const enrollmentsWithCourses = enrollmentsData.map((enrollment: any) => ({
        ...enrollment,
        course: coursesData?.find((c: any) => c.id === enrollment.course_id) || null
      }))
      
      console.log('[useStudentEnrollments] Result:', enrollmentsWithCourses.length, 'enrollments')
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
    onSuccess: async (data, { courseId, studentId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['student-enrollments', studentId] })
      queryClient.invalidateQueries({ queryKey: ['enrollment-status', courseId, studentId] })
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      queryClient.invalidateQueries({ queryKey: ['student-stats', studentId] })
      // Revalidar caché del servidor
      await revalidateServerCache(courseId)
    }
  })
}

// Función auxiliar para revalidar rutas del servidor (fire & forget, no bloquea)
function revalidateServerCache(courseId?: string) {
  const paths = [
    '/',
    '/cursos',
    '/dashboard/student',
    '/dashboard/teacher',
    ...(courseId ? [`/cursos/${courseId}`] : []),
  ];
  fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  }).catch((err) => {
    console.warn('Error al revalidar rutas del servidor:', err);
  });
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
    onSuccess: (data) => {
      // Invalidar queries de cursos
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      // Revalidar caché del servidor (fire & forget)
      revalidateServerCache(data?.id)
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
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      // Revalidar caché del servidor (fire & forget)
      revalidateServerCache(data?.id)
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
    onSuccess: (courseId) => {
      // Invalidar todas las queries de cursos
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      // Revalidar caché del servidor (fire & forget)
      revalidateServerCache(courseId)
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
      console.log('[useStudentStats] Fetching for student:', studentId)
      
      try {
        const enrollments = await supabaseGet(
          `enrollments?student_id=eq.${studentId}&select=*`
        )
        
        const total = (enrollments || []).length
        const completed = (enrollments || []).filter((e: any) => e.status === 'completed')?.length || 0
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
      console.log('[useCourseStructure] Fetching for course:', courseId)
      
      // Get course with instructor info
      const courseArr = await supabaseGet(
        `courses?id=eq.${courseId}&select=*,profiles:instructor_id(id,full_name,email)`
      )
      const course = courseArr?.[0]
      if (!course) throw new Error('Curso no encontrado')
      
      // Get published units
      const units = await supabaseGet(
        `course_units?course_id=eq.${courseId}&order=order_index.asc&select=*`
      )
      
      // Get published topics
      const topics = await supabaseGet(
        `unit_topics?course_id=eq.${courseId}&order=order_index.asc&select=*`
      )
      
      // Get resources for all topics
      const topicIds = (topics || []).map((t: any) => t.id)
      let resources: any[] = []
      if (topicIds.length > 0) {
        resources = await supabaseGet(
          `topic_resources?topic_id=${pgIn(topicIds)}&select=*`
        )
      }
      
      // Build hierarchical structure
      const unitsWithTopics = (units || []).map((unit: any) => ({
        ...unit,
        topics: (topics || [])
          .filter((t: any) => t.unit_id === unit.id)
          .map((topic: any) => ({
            ...topic,
            resources: resources?.find((r: any) => r.topic_id === topic.id) || null
          }))
      }))
      
      console.log('[useCourseStructure] Result:', (units || []).length, 'units,', (topics || []).length, 'topics')
      
      return {
        ...course,
        units: unitsWithTopics,
        totalUnits: (units || []).length,
        totalTopics: (topics || []).length
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
      console.log('[useStudentAssignments] Fetching for course:', courseId, 'student:', studentId)
      
      // Get course assignments
      const assignments = await supabaseGet(
        `assignments?course_id=eq.${courseId}&is_published=eq.true&or=(target_type.eq.all_students,target_student_id.eq.${studentId})&order=due_date.asc&select=*`
      ).catch(() => [])
      
      if (!assignments || assignments.length === 0) {
        return { pending: [], submitted: [], graded: [] }
      }
      
      // Get student submissions
      const assignmentIds = assignments.map((a: any) => a.id)
      const submissions = await supabaseGet(
        `assignment_submissions?student_id=eq.${studentId}&assignment_id=${pgIn(assignmentIds)}&select=*`
      ).catch(() => [])
      
      // Classify assignments
      const submittedIds = new Set((submissions || []).map((s: any) => s.assignment_id))
      const gradedSubmissions = (submissions || []).filter((s: any) => s.status === 'graded')
      const gradedIds = new Set(gradedSubmissions.map((s: any) => s.assignment_id))
      
      const pending = assignments
        .filter((a: any) => !submittedIds.has(a.id))
        .map((a: any) => ({ ...a, status: 'pending' }))
      
      const submitted = assignments
        .filter((a: any) => submittedIds.has(a.id) && !gradedIds.has(a.id))
        .map((a: any) => ({
          ...a,
          status: 'submitted',
          submission: submissions?.find((s: any) => s.assignment_id === a.id)
        }))
      
      const graded = assignments
        .filter((a: any) => gradedIds.has(a.id))
        .map((a: any) => ({
          ...a,
          status: 'graded',
          submission: submissions?.find((s: any) => s.assignment_id === a.id)
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
      console.log('[useAllStudentAssignments] Fetching for student:', studentId)
      
      // Get student enrollments
      const enrollments = await supabaseGet(
        `enrollments?student_id=eq.${studentId}&select=course_id`
      ).catch(() => [])
      
      const courseIds = (enrollments || []).map((e: any) => e.course_id)
      if (courseIds.length === 0) return { pending: [], submitted: [], graded: [] }
      
      // Get assignments from all courses
      const assignments = await supabaseGet(
        `assignments?course_id=${pgIn(courseIds)}&is_published=eq.true&order=due_date.asc&select=*,courses:course_id(id,title)`
      ).catch(() => [])
      
      // Get student submissions
      const assignmentIds = (assignments || []).map((a: any) => a.id)
      let submissions: any[] = []
      if (assignmentIds.length > 0) {
        submissions = await supabaseGet(
          `assignment_submissions?student_id=eq.${studentId}&assignment_id=${pgIn(assignmentIds)}&select=*`
        ).catch(() => [])
      }
      
      const submittedIds = new Set((submissions || []).map((s: any) => s.assignment_id))
      const gradedSubmissions = (submissions || []).filter((s: any) => s.status === 'graded')
      const gradedIds = new Set(gradedSubmissions.map((s: any) => s.assignment_id))
      
      const pending = (assignments || [])
        .filter((a: any) => !submittedIds.has(a.id))
        .map((a: any) => ({ ...a, status: 'pending' }))
      
      const submitted = (assignments || [])
        .filter((a: any) => submittedIds.has(a.id) && !gradedIds.has(a.id))
        .map((a: any) => ({
          ...a,
          status: 'submitted',
          submission: submissions?.find((s: any) => s.assignment_id === a.id)
        }))
      
      const graded = (assignments || [])
        .filter((a: any) => gradedIds.has(a.id))
        .map((a: any) => ({
          ...a,
          status: 'graded',
          submission: submissions?.find((s: any) => s.assignment_id === a.id)
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
      console.log('[useStudentEvaluations] Fetching for course:', courseId, 'student:', studentId)
      
      // Get course evaluations
      const evaluations = await supabaseGet(
        `evaluations?course_id=eq.${courseId}&is_published=eq.true&order=created_at.asc&select=*`
      ).catch(() => [])
      
      if (!evaluations || evaluations.length === 0) {
        return { pending: [], completed: [] }
      }
      
      // Get student attempts
      const evalIds = evaluations.map((e: any) => e.id)
      const attempts = await supabaseGet(
        `evaluation_attempts?student_id=eq.${studentId}&evaluation_id=${pgIn(evalIds)}&order=attempt_number.desc&select=*`
      ).catch(() => [])
      
      // Classify evaluations
      const completedIds = new Set(
        (attempts || [])
          .filter((a: any) => a.status === 'submitted' || a.status === 'graded')
          .map((a: any) => a.evaluation_id)
      )
      
      const pending = evaluations
        .filter((e: any) => !completedIds.has(e.id))
        .map((e: any) => {
          const evalAttempts = (attempts || []).filter((a: any) => a.evaluation_id === e.id)
          return {
            ...e,
            status: 'pending',
            attemptsUsed: evalAttempts.length,
            canRetake: evalAttempts.length < e.max_attempts
          }
        })
      
      const completed = evaluations
        .filter((e: any) => completedIds.has(e.id))
        .map((e: any) => {
          const evalAttempts = (attempts || []).filter((a: any) => a.evaluation_id === e.id)
          const bestAttempt = evalAttempts.reduce((best: any, current: any) => 
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
      console.log('[useAllStudentEvaluations] Fetching for student:', studentId)
      
      // Get enrollments
      const enrollments = await supabaseGet(
        `enrollments?student_id=eq.${studentId}&select=course_id`
      ).catch(() => [])
      
      const courseIds = (enrollments || []).map((e: any) => e.course_id)
      if (courseIds.length === 0) return { pending: [], completed: [] }
      
      // Get evaluations from all courses
      const evaluations = await supabaseGet(
        `evaluations?course_id=${pgIn(courseIds)}&is_published=eq.true&order=created_at.asc&select=*,courses:course_id(id,title)`
      ).catch(() => [])
      
      // Get attempts
      const evalIds = (evaluations || []).map((e: any) => e.id)
      let attempts: any[] = []
      if (evalIds.length > 0) {
        attempts = await supabaseGet(
          `evaluation_attempts?student_id=eq.${studentId}&evaluation_id=${pgIn(evalIds)}&select=*`
        ).catch(() => [])
      }
      
      const completedIds = new Set(
        (attempts || [])
          .filter((a: any) => a.status === 'submitted' || a.status === 'graded')
          .map((a: any) => a.evaluation_id)
      )
      
      const pending = (evaluations || [])
        .filter((e: any) => !completedIds.has(e.id))
        .map((e: any) => ({ ...e, status: 'pending' }))
      
      const completed = (evaluations || [])
        .filter((e: any) => completedIds.has(e.id))
        .map((e: any) => {
          const bestAttempt = (attempts || []).filter((a: any) => a.evaluation_id === e.id)
            .reduce((best: any, curr: any) => (curr.score || 0) > (best?.score || 0) ? curr : best, undefined as any)
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
      console.log('[useStudentCourseProgress] Fetching for course:', courseId, 'student:', studentId)
      
      // Get unit progress
      const unitProgress = await supabaseGet(
        `unit_progress?course_id=eq.${courseId}&student_id=eq.${studentId}&select=*`
      ).catch(() => [])
      
      // Get topic progress
      const topicProgress = await supabaseGet(
        `topic_progress?course_id=eq.${courseId}&student_id=eq.${studentId}&select=*`
      ).catch(() => [])
      
      // Get total topics count for this course
      const allTopics = await supabaseGet(
        `unit_topics?course_id=eq.${courseId}&select=id`
      ).catch(() => [])
      
      // Calculate overall progress
      const completedTopics = (topicProgress || []).filter((t: any) => t.completed)?.length || 0
      const totalTopics = (allTopics || []).length || 1
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