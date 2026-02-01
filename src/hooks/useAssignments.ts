'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

// =====================================================
// TIPOS
// =====================================================

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'multiple_select';
  points: number;
  question: string;
  options?: { id: string; text: string }[];
  correct_answer?: string | boolean;
  correct_answers?: string[];
  correct_keywords?: string[];
  explanation?: string;
  sample_answer?: string;
}

export interface QuizData {
  title: string;
  description?: string;
  time_limit_minutes?: number;
  passing_score?: number;
  shuffle_questions?: boolean;
  show_correct_answers?: boolean;
  questions: QuizQuestion[];
}

export interface FileRequirements {
  allowed_types: string[];
  max_size_mb: number;
  required: boolean;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  type: 'task' | 'exam' | 'quiz';
  due_date?: string;
  max_score: number;
  quiz_data?: QuizData;
  file_requirements?: FileRequirements;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
  // Joined data
  course?: {
    id: string;
    title: string;
    instructor_id: string;
  };
}

export interface StudentAnswer {
  question_id: string;
  answer: string | boolean | string[];
}

export interface SubmissionAnswers {
  submitted_at: string;
  time_taken_minutes?: number;
  answers: StudentAnswer[];
  auto_score?: number;
  auto_graded_at?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  file_url?: string;
  file_name?: string;
  answers?: SubmissionAnswers;
  score?: number;
  feedback?: string;
  submitted_at?: string;
  graded_at?: string;
  graded_by?: string;
  created_at: string;
  updated_at?: string;
  // Joined data
  student?: {
    id: string;
    full_name: string;
    email: string;
  };
  assignment?: Assignment;
}

export interface StudentAssignment extends Assignment {
  submission_status: 'pending' | 'submitted' | 'graded' | 'late' | 'not_started';
  submission?: Submission;
  is_overdue: boolean;
  days_remaining?: number;
}

// =====================================================
// HOOK: useStudentAssignments
// Para estudiantes: obtener todas sus asignaciones con estado
// =====================================================

export function useStudentAssignments(studentId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['student-assignments', studentId],
    queryFn: async (): Promise<StudentAssignment[]> => {
      if (!studentId) return [];

      try {
        // 1. Obtener los cursos donde el estudiante está inscrito
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', studentId)
          .in('status', ['active', 'in_progress']);

        if (enrollError) {
          console.error('Error fetching enrollments:', enrollError);
          return [];
        }

        if (!enrollments || enrollments.length === 0) {
          return [];
        }

        const courseIds = enrollments.map(e => e.course_id);

        // 2. Obtener todas las asignaciones publicadas de esos cursos
        const { data: assignments, error: assignError } = await supabase
          .from('assignments')
          .select(`
            *,
            course:courses(id, title, instructor_id)
          `)
          .in('course_id', courseIds)
          .eq('is_published', true)
          .order('due_date', { ascending: true });

        if (assignError) {
          console.error('Error fetching assignments:', assignError);
          return [];
        }

        if (!assignments || assignments.length === 0) {
          return [];
        }

        // 3. Obtener las entregas del estudiante
        const assignmentIds = assignments.map(a => a.id);
        const { data: submissions, error: subError } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', studentId)
          .in('assignment_id', assignmentIds);

        if (subError) {
          console.error('Error fetching submissions:', subError);
        }

        // 4. Combinar asignaciones con sus entregas y calcular estado
        const now = new Date();
        const studentAssignments: StudentAssignment[] = assignments.map(assignment => {
          const submission = submissions?.find(s => s.assignment_id === assignment.id);
          const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
          const isOverdue = dueDate ? now > dueDate : false;
          
          let daysRemaining: number | undefined;
          if (dueDate && !isOverdue) {
            daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }

          // Determinar el estado de la entrega
          let submissionStatus: StudentAssignment['submission_status'] = 'not_started';
          
          if (submission) {
            if (submission.status === 'graded') {
              submissionStatus = 'graded';
            } else if (submission.status === 'submitted') {
              submissionStatus = 'submitted';
            } else if (submission.status === 'late') {
              submissionStatus = 'late';
            } else {
              submissionStatus = 'pending';
            }
          } else if (isOverdue) {
            submissionStatus = 'late';
          }

          return {
            ...assignment,
            submission_status: submissionStatus,
            submission: submission || undefined,
            is_overdue: isOverdue,
            days_remaining: daysRemaining,
          };
        });

        return studentAssignments;
      } catch (err) {
        console.error('Error in useStudentAssignments:', err);
        return [];
      }
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// =====================================================
// HOOK: useSubmitAssignment
// Para estudiantes: enviar una tarea o examen
// =====================================================

interface SubmitTaskParams {
  assignmentId: string;
  fileUrl: string;
  fileName: string;
}

interface SubmitExamParams {
  assignmentId: string;
  answers: StudentAnswer[];
  timeTakenMinutes?: number;
}

export function useSubmitAssignment() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  // Mutación para enviar una TAREA (con archivo)
  const submitTask = useMutation({
    mutationFn: async ({ assignmentId, fileUrl, fileName }: SubmitTaskParams) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const now = new Date().toISOString();
      
      // Verificar si ya existe una submission
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id)
        .single();

      if (existing) {
        // Actualizar existente
        const { data, error } = await supabase
          .from('submissions')
          .update({
            file_url: fileUrl,
            file_name: fileName,
            status: 'submitted',
            submitted_at: now,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Crear nueva
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: user.id,
            file_url: fileUrl,
            file_name: fileName,
            status: 'submitted',
            submitted_at: now,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });

  // Mutación para enviar un EXAMEN (con respuestas JSON)
  const submitExam = useMutation({
    mutationFn: async ({ assignmentId, answers, timeTakenMinutes }: SubmitExamParams) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const now = new Date().toISOString();
      const answersData: SubmissionAnswers = {
        submitted_at: now,
        time_taken_minutes: timeTakenMinutes,
        answers: answers,
      };

      // Verificar si ya existe una submission
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('submissions')
          .update({
            answers: answersData,
            status: 'submitted',
            submitted_at: now,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: user.id,
            answers: answersData,
            status: 'submitted',
            submitted_at: now,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });

  return { submitTask, submitExam };
}

// =====================================================
// HOOK: useTeacherResults
// Para profesores: ver y calificar entregas
// =====================================================

export interface TeacherSubmissionResult extends Submission {
  student: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function useTeacherResults(assignmentId?: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  // Query para obtener todas las entregas de una asignación
  const query = useQuery({
    queryKey: ['teacher-results', assignmentId],
    queryFn: async (): Promise<TeacherSubmissionResult[]> => {
      if (!assignmentId) return [];

      try {
        // 1. Verificar que el profesor tiene acceso a esta asignación
        const { data: assignment, error: assignError } = await supabase
          .from('assignments')
          .select(`
            id,
            course_id,
            title,
            type,
            max_score,
            course:courses(instructor_id)
          `)
          .eq('id', assignmentId)
          .single();

        if (assignError || !assignment) {
          console.error('Error fetching assignment:', assignError);
          return [];
        }

        // 2. Obtener todas las entregas
        const { data: submissions, error: subError } = await supabase
          .from('submissions')
          .select('*')
          .eq('assignment_id', assignmentId)
          .order('submitted_at', { ascending: false });

        if (subError) {
          console.error('Error fetching submissions:', subError);
          return [];
        }

        if (!submissions || submissions.length === 0) {
          return [];
        }

        // 3. Obtener los perfiles de los estudiantes
        const studentIds = submissions.map(s => s.student_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds);

        if (profileError) {
          console.error('Error fetching profiles:', profileError);
        }

        // 4. Combinar datos
        const results: TeacherSubmissionResult[] = submissions.map(submission => ({
          ...submission,
          student: profiles?.find(p => p.id === submission.student_id) || {
            id: submission.student_id,
            full_name: 'Estudiante',
            email: '',
          },
        }));

        return results;
      } catch (err) {
        console.error('Error in useTeacherResults:', err);
        return [];
      }
    },
    enabled: !!assignmentId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Mutación para calificar una entrega
  const gradeSubmission = useMutation({
    mutationFn: async ({
      submissionId,
      score,
      feedback,
    }: {
      submissionId: string;
      score: number;
      feedback?: string;
    }) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('submissions')
        .update({
          score,
          feedback,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user.id,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-results', assignmentId] });
    },
  });

  return {
    submissions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    gradeSubmission,
  };
}

// =====================================================
// HOOK: useTeacherAssignments
// Para profesores: obtener todas sus asignaciones
// =====================================================

export function useTeacherAssignments(teacherId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['teacher-assignments', teacherId],
    queryFn: async (): Promise<Assignment[]> => {
      if (!teacherId) return [];

      try {
        // 1. Obtener cursos del profesor
        const { data: courses, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('instructor_id', teacherId);

        if (courseError || !courses || courses.length === 0) {
          return [];
        }

        const courseIds = courses.map(c => c.id);

        // 2. Obtener asignaciones de esos cursos
        const { data: assignments, error: assignError } = await supabase
          .from('assignments')
          .select(`
            *,
            course:courses(id, title)
          `)
          .in('course_id', courseIds)
          .order('created_at', { ascending: false });

        if (assignError) {
          console.error('Error fetching assignments:', assignError);
          return [];
        }

        return assignments || [];
      } catch (err) {
        console.error('Error in useTeacherAssignments:', err);
        return [];
      }
    },
    enabled: !!teacherId,
  });
}

// =====================================================
// HOOK: useCreateAssignment
// Para profesores: crear una nueva asignación
// =====================================================

interface CreateAssignmentParams {
  courseId: string;
  title: string;
  description?: string;
  type: 'task' | 'exam' | 'quiz';
  dueDate?: string;
  maxScore?: number;
  quizData?: QuizData;
  fileRequirements?: FileRequirements;
  isPublished?: boolean;
}

export function useCreateAssignment() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAssignmentParams) => {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          course_id: params.courseId,
          title: params.title,
          description: params.description,
          type: params.type,
          due_date: params.dueDate,
          max_score: params.maxScore || 100,
          quiz_data: params.quizData,
          file_requirements: params.fileRequirements,
          is_published: params.isPublished || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });
}
