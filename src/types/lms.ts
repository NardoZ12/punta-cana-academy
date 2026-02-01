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
  enrollment_date?: string
  enrolled_at?: string
  completion_date?: string
  progress_percentage?: number
  progress?: number
  status: 'active' | 'completed' | 'dropped' | 'suspended' | 'in_progress'
  grade?: number
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
  lesson_id?: string
  title: string
  description?: string
  instructions?: string
  due_date?: string
  max_points: number
  file_upload_allowed: boolean
  submission_format: string
  created_by?: string
  is_published: boolean
  created_at: string
  updated_at?: string
  
  // Relaciones
  course?: Course
  lesson?: CourseLesson
  submissions?: AssignmentSubmission[]
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  submission_text?: string
  file_url?: string
  file_name?: string
  submitted_at: string
  graded_at?: string
  grade?: number
  feedback?: string
  graded_by?: string
  status: 'draft' | 'submitted' | 'graded' | 'late'
  created_at: string
  updated_at?: string
  
  // Relaciones
  assignment?: Assignment
  student?: Profile
}

export interface Exam {
  id: string
  course_id: string
  title: string
  description?: string
  instructions?: string
  time_limit_minutes: number
  max_attempts: number
  passing_score: number
  is_published: boolean
  available_from: string
  available_until: string
  created_by?: string
  created_at: string
  updated_at?: string
  
  // Relaciones
  course?: Course
  questions?: ExamQuestion[]
  submissions?: ExamSubmission[]
}

export interface ExamQuestion {
  id: string
  exam_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  options?: any
  correct_answer?: string
  points: number
  order_in_exam: number
  created_at: string
  
  // Relaciones
  exam?: Exam
}

export interface ExamSubmission {
  id: string
  exam_id: string
  student_id: string
  answers: any
  score?: number
  started_at: string
  submitted_at?: string
  time_spent_minutes?: number
  attempt_number: number
  status: 'in_progress' | 'submitted' | 'graded' | 'abandoned' | 'completed'
  created_at: string
  updated_at?: string
  
  // Relaciones
  exam?: Exam
  student?: Profile
}

export interface NotificationSettings {
  id: string
  user_id: string
  email_assignments: boolean
  email_grades: boolean
  email_announcements: boolean
  push_notifications: boolean
  sms_notifications: boolean
  created_at: string
  updated_at?: string
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