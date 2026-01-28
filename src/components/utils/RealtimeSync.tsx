'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface RealtimeSyncProps {
  userId: string;
  role: 'student' | 'teacher';
  onDataChange?: () => void;
}

/**
 * Componente para manejar sincronización en tiempo real entre estudiantes y profesores
 * Se debe incluir en las páginas de dashboard
 */
export function RealtimeSync({ userId, role, onDataChange }: RealtimeSyncProps) {
  const supabase = createClient();

  useEffect(() => {
    let channels: any[] = [];

    // Configurar canales de tiempo real según el rol
    if (role === 'student') {
      // Para estudiantes: escuchar nuevos exámenes, tareas y cambios de notas
      
      // Canal 1: Nuevos exámenes asignados
      const examChannel = supabase
        .channel('student-exams')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'exams',
            filter: `course_id=in.(${getUserCourseIds()})`, // Solo cursos del estudiante
          },
          (payload) => {
            console.log('Nuevo examen asignado:', payload);
            onDataChange?.();
          }
        )
        .subscribe();

      // Canal 2: Nuevas tareas asignadas
      const assignmentChannel = supabase
        .channel('student-assignments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'assignments',
          },
          (payload) => {
            console.log('Nueva tarea asignada:', payload);
            onDataChange?.();
          }
        )
        .subscribe();

      // Canal 3: Cambios en notas (enrollments)
      const gradeChannel = supabase
        .channel('student-grades')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'enrollments',
            filter: `student_id=eq.${userId}`,
          },
          (payload) => {
            console.log('Nota actualizada:', payload);
            onDataChange?.();
          }
        )
        .subscribe();

      channels = [examChannel, assignmentChannel, gradeChannel];

    } else if (role === 'teacher') {
      // Para profesores: escuchar entregas de estudiantes y progreso

      // Canal 1: Nuevas entregas de exámenes
      const submissionChannel = supabase
        .channel('teacher-submissions')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'exam_submissions',
          },
          (payload) => {
            console.log('Nueva entrega de examen:', payload);
            onDataChange?.();
          }
        )
        .subscribe();

      // Canal 2: Progreso de lecciones
      const progressChannel = supabase
        .channel('teacher-progress')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lesson_progress',
          },
          (payload) => {
            console.log('Progreso actualizado:', payload);
            onDataChange?.();
          }
        )
        .subscribe();

      // Canal 3: Entregas de tareas
      const assignmentSubmissionChannel = supabase
        .channel('teacher-assignment-submissions')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'assignment_submissions',
          },
          (payload) => {
            console.log('Nueva entrega de tarea:', payload);
            onDataChange?.();
          }
        )
        .subscribe();

      channels = [submissionChannel, progressChannel, assignmentSubmissionChannel];
    }

    // Cleanup al desmontar
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [userId, role, onDataChange, supabase]);

  // Función auxiliar para obtener IDs de cursos del estudiante (placeholder)
  const getUserCourseIds = () => {
    // Esta función debería obtener los IDs de los cursos del estudiante
    // Por simplicidad, aquí retornamos un string vacío
    // En implementación real, deberías pasar estos IDs como prop o obtenerlos del contexto
    return '';
  };

  // Este componente no renderiza nada, solo maneja la lógica de tiempo real
  return null;
}

// Hook personalizado para usar la sincronización
export function useRealtimeSync(userId: string, role: 'student' | 'teacher', callback?: () => void) {
  const supabase = createClient();

  useEffect(() => {
    // Configurar subscription básica
    const channel = supabase
      .channel(`${role}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: role === 'student' ? 'enrollments' : 'lesson_progress',
          filter: role === 'student' ? `student_id=eq.${userId}` : undefined,
        },
        (payload) => {
          console.log('Cambio detectado:', payload);
          callback?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role, callback, supabase]);
}