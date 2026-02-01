'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuthContext } from '../contexts/AuthContext';
import { useRealtimeContext } from '../contexts/RealtimeContext';

// Hook para gestión de estudiantes en tiempo real (para profesores)
export function useRealtimeStudents() {
  const supabase = createClient();
  const { user } = useAuthContext();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadStudents = async () => {
      // Obtener estudiantes de cursos del profesor
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          student:profiles!enrollments_student_id_fkey(id, full_name, email, created_at),
          course:courses!enrollments_course_id_fkey(id, title, teacher_id)
        `)
        .eq('courses.teacher_id', user.id);

      if (data && !error) {
        setStudents(data);
      }
      setLoading(false);
    };

    loadStudents();

    // Subscription para nuevas inscripciones
    const channel = supabase
      .channel('teacher_enrollments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'enrollments'
      }, async (payload) => {
        const newEnrollment = payload.new;
        
        // Verificar si es un curso del profesor
        const { data: course } = await supabase
          .from('courses')
          .select('*')
          .eq('id', newEnrollment.course_id)
          .eq('teacher_id', user.id)
          .single();

        if (course) {
          // Obtener datos completos del estudiante
          const { data: student } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newEnrollment.student_id)
            .single();

          if (student) {
            setStudents(prev => [...prev, {
              ...newEnrollment,
              student,
              course
            }]);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'enrollments'
      }, (payload) => {
        const updatedEnrollment = payload.new;
        setStudents(prev => 
          prev.map(s => s.id === updatedEnrollment.id ? { ...s, ...updatedEnrollment } : s)
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const updateStudentProgress = async (enrollmentId: string, progress: number) => {
    const { error } = await supabase
      .from('enrollments')
      .update({ progress })
      .eq('id', enrollmentId);

    return !error;
  };

  return { students, loading, updateStudentProgress };
}

// Hook para gestión de tareas/exámenes en tiempo real
export function useRealtimeTasks(courseId?: string) {
  const supabase = createClient();
  const { user } = useAuthContext();
  const { addNotification } = useRealtimeContext();
  const [tasks, setTasks] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          course:courses!tasks_course_id_fkey(id, title, teacher_id),
          grades(id, score, student_id, submitted_at)
        `)
        .order('created_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      } else if (user) {
        // Si no hay courseId específico, obtener tareas de cursos del usuario
        query = query.eq('courses.teacher_id', user.id);
      }

      const { data, error } = await query;

      if (data && !error) {
        setTasks(data);
      }
      setLoading(false);
    };

    const loadGrades = async () => {
      if (!user) return;
      
      const { data: gradeData, error } = await supabase
        .from('grades')
        .select(`
          *,
          task:tasks!grades_task_id_fkey(title, type, course_id)
        `)
        .eq('instructor_id', user.id)
        .order('graded_at', { ascending: false });

      if (gradeData && !error) {
        setGrades(gradeData);
      }
    };

    if (user) {
      loadTasks();
      loadGrades();
    }

    // Subscription para nuevas tareas
    const tasksChannel = supabase
      .channel('tasks_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks'
      }, async (payload) => {
        const newTask = payload.new;
        
        // Obtener datos completos de la tarea
        const { data: taskWithCourse } = await supabase
          .from('tasks')
          .select(`
            *,
            course:courses!tasks_course_id_fkey(id, title, teacher_id)
          `)
          .eq('id', newTask.id)
          .single();

        if (taskWithCourse) {
          setTasks(prev => [taskWithCourse, ...prev]);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks'
      }, (payload) => {
        const updatedTask = payload.new;
        setTasks(prev => 
          prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
        );
      })
      .subscribe();

    // Subscription para nuevas calificaciones
    const gradesChannel = supabase
      .channel('grades_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'grades'
      }, async (payload) => {
        const newGrade = payload.new;
        
        // Obtener información de la tarea para la calificación
        const { data: task } = await supabase
          .from('tasks')
          .select('title, type, course_id')
          .eq('id', newGrade.task_id)
          .single();

        const gradeWithTask = { ...newGrade, task };
        
        // Actualizar lista de calificaciones
        setGrades(prev => [gradeWithTask, ...prev]);
        
        // También actualizar las tareas con la nueva calificación
        setTasks(prev => 
          prev.map(t => {
            if (t.id === newGrade.task_id) {
              return {
                ...t,
                grades: [...(t.grades || []), newGrade]
              };
            }
            return t;
          })
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(gradesChannel);
    };
  }, [user, courseId, supabase, addNotification]);

  const createTask = async (taskData: any) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...taskData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (!error && data) {
      // Notificar a estudiantes inscritos
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, profiles!enrollments_student_id_fkey(full_name)')
        .eq('course_id', taskData.course_id);

      if (enrollments) {
        const notifications = enrollments.map(enrollment => ({
          user_id: enrollment.student_id,
          type: taskData.type === 'exam' ? 'exam_assigned' : 'task_assigned',
          title: `Nueva ${taskData.type === 'exam' ? 'evaluación' : 'tarea'}`,
          message: `Se ha asignado: ${taskData.title}`,
          data: { task: data },
          read: false,
          created_at: new Date().toISOString()
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }

    return { data, error };
  };

  const gradeTask = async (taskId: string, studentId: string, score: number, feedback?: string) => {
    const { data, error } = await supabase
      .from('grades')
      .insert([{
        task_id: taskId,
        student_id: studentId,
        score,
        feedback,
        graded_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (!error && data) {
      // Crear notificación para el estudiante
      const { data: task } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', taskId)
        .single();

      await supabase
        .from('notifications')
        .insert([{
          user_id: studentId,
          type: 'grade_updated',
          title: 'Nueva calificación',
          message: `Recibiste ${score}/100 en ${task?.title || 'una tarea'}`,
          data: { grade: data, task },
          read: false,
          created_at: new Date().toISOString()
        }]);
    }

    return { data, error };
  };

  return { tasks, grades, loading, createTask, gradeTask };
}

// Hook para gestión de cursos en tiempo real
export function useRealtimeCourses() {
  const supabase = createClient();
  const { user } = useAuthContext();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          enrollments(id, student_id, progress, status),
          tasks(id, title, type, due_date)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setCourses(data);
      }
      setLoading(false);
    };

    loadCourses();

    // Subscription para cambios en inscripciones
    const enrollmentsChannel = supabase
      .channel('course_enrollments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'enrollments'
      }, async (payload) => {
        const newEnrollment = payload.new;
        
        setCourses(prev => 
          prev.map(course => {
            if (course.id === newEnrollment.course_id) {
              return {
                ...course,
                enrollments: [...(course.enrollments || []), newEnrollment]
              };
            }
            return course;
          })
        );
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'enrollments'
      }, (payload) => {
        const updatedEnrollment = payload.new;
        
        setCourses(prev => 
          prev.map(course => ({
            ...course,
            enrollments: course.enrollments?.map((enrollment: any) => 
              enrollment.id === updatedEnrollment.id 
                ? { ...enrollment, ...updatedEnrollment }
                : enrollment
            ) || []
          }))
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(enrollmentsChannel);
    };
  }, [user, supabase]);

  return { courses, loading, setCourses };
}

// Hook para estudiantes - obtener sus cursos y tareas
export function useRealtimeStudentDashboard() {
  const supabase = createClient();
  const { user } = useAuthContext();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStudentData = async () => {
      try {
        // Cargar inscripciones del estudiante - consulta simplificada
        const { data: enrollmentData, error: enrollError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('student_id', user.id);

        if (enrollError) {
          console.error('Error loading enrollments:', enrollError);
          setLoading(false);
          return;
        }

        if (enrollmentData && enrollmentData.length > 0) {
          // Obtener cursos por separado
          const courseIds = enrollmentData.map(e => e.course_id);
          const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds);
          
          // Combinar enrollments con cursos
          const enrichedEnrollments = enrollmentData.map(e => ({
            ...e,
            course: coursesData?.find(c => c.id === e.course_id) || null
          }));
          
          setEnrollments(enrichedEnrollments);
        } else {
          setEnrollments([]);
        }
      } catch (err) {
        console.error('Error in loadStudentData:', err);
      }

      setLoading(false);
    };

    loadStudentData();

    // Cleanup - sin suscripciones complejas por ahora
    return () => {};
  }, [user?.id]);

  const enrollInCourse = async (courseId: string) => {
    if (!user?.id) return { data: null, error: new Error('No user') };
    
    const { data, error } = await supabase
      .from('enrollments')
      .insert([{
        student_id: user.id,
        course_id: courseId,
        status: 'active',
        progress: 0
      }])
      .select('*')
      .single();

    return { data, error };
  };

  return { 
    courses: enrollments || [],
    tasks: tasks || [], 
    grades: grades || [], 
    loading, 
    enrollInCourse,
    setEnrollments
  };
}