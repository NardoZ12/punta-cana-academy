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
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *,
            instructor:profiles(full_name)
          )
        `)
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as Enrollment[]
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
      // Obtener inscripciones
      const { data: enrollments, count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact' })
        .eq('student_id', studentId)

      // Obtener inscripciones completadas
      const { count: completedCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'completed')

      return {
        totalCourses: enrollmentsCount || 0,
        completedCourses: completedCount || 0,
        inProgressCourses: (enrollmentsCount || 0) - (completedCount || 0),
      }
    },
    enabled: !!studentId
  })
}