// Tipos extendidos para la nueva arquitectura del LMS
// Versión 2.0 - Reingeniería completa

// =====================================================
// ESTRUCTURA JERÁRQUICA
// =====================================================

export interface CourseUnit {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  learning_objectives?: string[];
  order_index: number;
  is_published: boolean;
  estimated_hours?: number;
  created_at: string;
  updated_at?: string;
  
  // Relaciones
  course?: Course;
  topics?: UnitTopic[];
  progress?: UnitProgress;
}

export interface UnitTopic {
  id: string;
  unit_id: string;
  course_id: string;
  title: string;
  order_index: number;
  is_published: boolean;
  estimated_minutes?: number;
  created_at: string;
  updated_at?: string;
  
  // Relaciones
  unit?: CourseUnit;
  resources?: TopicResources;
  progress?: TopicProgress;
  quiz?: Evaluation;
}

export interface TopicResources {
  id: string;
  topic_id: string;
  unit_id: string;
  course_id: string;
  
  // Contenido obligatorio
  introduction: string;
  introduction_format: 'markdown' | 'html' | 'plain';
  
  // Video
  video_url?: string;
  video_provider?: 'youtube' | 'vimeo' | 'cloudflare' | 'bunny' | 'custom';
  video_duration_seconds?: number;
  video_thumbnail_url?: string;
  
  // PDF
  pdf_url?: string;
  pdf_title?: string;
  pdf_pages?: number;
  
  // Slides
  slides_url?: string;
  slides_provider?: 'google_slides' | 'canva' | 'pdf' | 'custom';
  slides_embed_code?: string;
  
  // Adicionales
  additional_resources?: AdditionalResource[];
  
  is_published: boolean;
  requires_video_completion: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AdditionalResource {
  type: 'link' | 'pdf' | 'video';
  title: string;
  url: string;
  description?: string;
}

// =====================================================
// EVALUACIONES
// =====================================================

export type ExamScope = 'topic_quiz' | 'unit_exam' | 'course_final';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'ordering';

export interface Evaluation {
  id: string;
  scope: ExamScope;
  course_id: string;
  unit_id?: string;
  topic_id?: string;
  
  title: string;
  description?: string;
  instructions?: string;
  
  questions: EvaluationQuestion[];
  
  // Configuración
  total_points: number;
  passing_score: number;
  time_limit_minutes?: number;
  max_attempts?: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answers: boolean;
  show_score_immediately: boolean;
  
  // Disponibilidad
  is_published: boolean;
  available_from?: string;
  available_until?: string;
  
  created_by?: string;
  created_at: string;
  updated_at?: string;
  
  // Relaciones
  attempts?: EvaluationAttempt[];
}

export interface EvaluationQuestion {
  id: string;
  order: number;
  type: QuestionType;
  question: string;
  points: number;
  options?: QuestionOption[];
  explanation?: string;
  media_url?: string;
  time_limit_seconds?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface EvaluationAttempt {
  id: string;
  evaluation_id: string;
  student_id: string;
  
  answers: Record<string, StudentAnswer>;
  
  score?: number;
  total_points_earned?: number;
  total_points_possible: number;
  passed?: boolean;
  
  started_at: string;
  submitted_at?: string;
  time_spent_seconds?: number;
  
  status: 'in_progress' | 'submitted' | 'graded' | 'abandoned';
  attempt_number: number;
  
  instructor_feedback?: string;
  graded_by?: string;
  graded_at?: string;
  
  created_at: string;
  updated_at?: string;
}

export interface StudentAnswer {
  selected: string[];
  time_spent_seconds?: number;
}

// =====================================================
// ASIGNACIONES
// =====================================================

export type AssignmentType = 'file_upload' | 'video_analysis' | 'project_delivery' | 'written_response' | 'code_submission';
export type AssignmentTarget = 'all_students' | 'specific_student' | 'student_group';

export interface Assignment {
  id: string;
  course_id: string;
  unit_id?: string;
  topic_id?: string;
  
  title: string;
  description?: string;
  instructions: string;
  
  assignment_type: AssignmentType;
  
  // Targeting
  target_type: AssignmentTarget;
  target_student_id?: string;
  target_group_ids?: string[];
  
  // Recursos del profesor
  attached_files?: AttachedFile[];
  reference_video_url?: string;
  reference_video_title?: string;
  instruction_image_url?: string;
  instruction_image_caption?: string;
  additional_links?: AdditionalLink[];
  
  // Configuración de entrega
  max_file_size_mb: number;
  allowed_file_types: string[];
  max_files: number;
  
  // Puntuación y fechas
  max_points: number;
  due_date?: string;
  late_submission_allowed: boolean;
  late_penalty_percent: number;
  
  // Configuración adicional
  requires_peer_review: boolean;
  rubric?: RubricCriteria[];
  
  is_published: boolean;
  available_from?: string;
  
  created_by?: string;
  created_at: string;
  updated_at?: string;
  
  // Relaciones
  submissions?: AssignmentSubmission[];
}

export interface AttachedFile {
  name: string;
  url: string;
  type: string;
  size_bytes: number;
}

export interface AdditionalLink {
  title: string;
  url: string;
  description?: string;
}

export interface RubricCriteria {
  criteria: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  
  submission_text?: string;
  submitted_files?: SubmittedFile[];
  video_url?: string;
  external_link?: string;
  
  status: 'draft' | 'submitted' | 'late' | 'graded' | 'returned';
  submitted_at?: string;
  is_late: boolean;
  days_late: number;
  
  score?: number;
  score_after_penalty?: number;
  rubric_scores?: Record<string, number>;
  
  instructor_feedback?: string;
  feedback_files?: AttachedFile[];
  private_notes?: string;
  
  graded_by?: string;
  graded_at?: string;
  
  revision_number: number;
  previous_submission_id?: string;
  
  created_at: string;
  updated_at?: string;
}

export interface SubmittedFile {
  name: string;
  url: string;
  type: string;
  size_bytes: number;
  uploaded_at: string;
}

// =====================================================
// PROGRESO
// =====================================================

export interface TopicProgress {
  id: string;
  student_id: string;
  topic_id: string;
  unit_id: string;
  course_id: string;
  
  introduction_read: boolean;
  introduction_read_at?: string;
  
  video_watched: boolean;
  video_watched_at?: string;
  video_progress_percent: number;
  video_last_position_seconds: number;
  
  pdf_downloaded: boolean;
  pdf_downloaded_at?: string;
  
  slides_viewed: boolean;
  slides_viewed_at?: string;
  
  completed: boolean;
  completed_at?: string;
  completion_percent: number;
  
  total_time_spent_seconds: number;
  
  first_accessed_at?: string;
  last_accessed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface UnitProgress {
  id: string;
  student_id: string;
  unit_id: string;
  course_id: string;
  
  topics_completed: number;
  topics_total: number;
  completion_percent: number;
  
  unit_exam_passed?: boolean;
  unit_exam_score?: number;
  unit_exam_attempts: number;
  
  started_at?: string;
  completed_at?: string;
  
  created_at: string;
  updated_at?: string;
}

// =====================================================
// ESTADÍSTICAS
// =====================================================

export interface StudentCourseStats {
  total_units: number;
  completed_units: number;
  total_topics: number;
  completed_topics: number;
  total_evaluations: number;
  passed_evaluations: number;
  total_assignments: number;
  submitted_assignments: number;
  overall_progress: number;
}

// =====================================================
// RE-EXPORTAR TIPOS BASE
// =====================================================

// Profile
export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  user_type: 'student' | 'teacher' | 'admin';
  created_at: string;
  updated_at?: string;
}

// Course
export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor_id: string;
  price: number;
  duration_hours: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  image_url?: string;
  is_published: boolean;
  max_students?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
  
  // Relaciones
  instructor?: Profile;
  units?: CourseUnit[];
  enrollments?: Enrollment[];
}

// Enrollment
export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
  progress?: number;
  grade?: number;
  enrolled_at?: string;
  created_at: string;
  updated_at?: string;
  
  // Relaciones
  student?: Profile;
  course?: Course;
}

// =====================================================
// CONSTANTES
// =====================================================

export const EXAM_SCOPES = {
  TOPIC_QUIZ: 'topic_quiz' as const,
  UNIT_EXAM: 'unit_exam' as const,
  COURSE_FINAL: 'course_final' as const,
};

export const ASSIGNMENT_TYPES = {
  FILE_UPLOAD: 'file_upload' as const,
  VIDEO_ANALYSIS: 'video_analysis' as const,
  PROJECT_DELIVERY: 'project_delivery' as const,
  WRITTEN_RESPONSE: 'written_response' as const,
  CODE_SUBMISSION: 'code_submission' as const,
};

export const ASSIGNMENT_TARGETS = {
  ALL_STUDENTS: 'all_students' as const,
  SPECIFIC_STUDENT: 'specific_student' as const,
  STUDENT_GROUP: 'student_group' as const,
};

export const SUBMISSION_STATUS = {
  DRAFT: 'draft' as const,
  SUBMITTED: 'submitted' as const,
  LATE: 'late' as const,
  GRADED: 'graded' as const,
  RETURNED: 'returned' as const,
};
