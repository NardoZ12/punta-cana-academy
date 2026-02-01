// Tipos principales para el LMS
export interface Profile {
  id: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  avatar_url?: string
  bio?: string
  phone?: string
  date_of_birth?: string
  country?: string
  timezone?: string
  language: string
  user_type: 'student' | 'teacher' | 'admin'
  created_at: string
  updated_at?: string
}

export interface Course {
  id: string
  title: string
  description?: string
  instructor_id: string
  price: number
  duration_hours: number
  level: 'beginner' | 'intermediate' | 'advanced'
  category?: string
  image_url?: string
  is_published: boolean
  max_students?: number
  start_date?: string
  end_date?: string
  requirements?: string[]
  what_you_learn?: string[]
  created_at: string
  updated_at?: string
  
  // Relaciones
  instructor?: Profile
  lessons?: CourseLesson[]
  enrollments?: Enrollment[]
}

export interface CourseLesson {
  id: string
  course_id: string
  title: string
  content?: string
  video_url?: string
  duration_minutes: number
  order_in_course: number
  is_preview: boolean
  created_at: string
  updated_at?: string
  
  // Relaciones
  course?: Course
  progress?: LessonProgress[]
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  status: 'active' | 'completed' | 'dropped'
  progress?: number
  grade?: number
  enrolled_at?: string
  last_accessed_at?: string
  created_at: string
  updated_at?: string
  
  // Relaciones
  student?: Profile
  course?: Course
}

export interface LessonProgress {
  id: string
  student_id: string
  lesson_id: string
  course_id?: string
  completed: boolean
  completion_date?: string
  time_spent_minutes: number
  created_at: string
  updated_at?: string
  
  // Relaciones
  student?: Profile
  lesson?: CourseLesson
  course?: Course
}

export interface Assignment {
  id: string
  course_id: string
  title: string
  description?: string
  type: 'task' | 'quiz'
  content: any // JSONB: { questions: [] } para quiz o { instructions: "" } para task
  due_date?: string
  is_published: boolean
  created_at: string
  updated_at?: string
  
  // Relaciones
  course?: Course
  submissions?: Submission[]
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  status: 'pending' | 'submitted' | 'graded'
  file_url?: string
  answers?: any // JSONB para respuestas de quiz
  grade?: number
  feedback?: string
  submitted_at: string
  graded_at?: string
  created_at: string
  updated_at?: string
  
  // Relaciones
  assignment?: Assignment
  student?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
  link?: string
  created_at: string
}

// Tipos para formularios y UI
export interface CourseWithProgress extends Course {
  enrollment?: Enrollment
  progress_percentage?: number
  total_lessons?: number
  completed_lessons?: number
}

export interface DashboardStats {
  total_courses: number
  active_enrollments: number
  completed_courses: number
  total_assignments: number
  pending_assignments: number
  upcoming_exams: number
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// Tipos para filtros y ordenamiento
export interface CourseFilters {
  category?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  price_min?: number
  price_max?: number
  instructor_id?: string
  search?: string
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

// Constantes útiles
export const USER_TYPES = {
  STUDENT: 'student' as const,
  TEACHER: 'teacher' as const,
  ADMIN: 'admin' as const,
}

export const COURSE_LEVELS = {
  BEGINNER: 'beginner' as const,
  INTERMEDIATE: 'intermediate' as const,
  ADVANCED: 'advanced' as const,
}

export const ENROLLMENT_STATUS = {
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
  DROPPED: 'dropped' as const,
  SUSPENDED: 'suspended' as const,
}