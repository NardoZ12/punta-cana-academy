'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuthContext } from './AuthContext';

interface RealtimeNotification {
  id: string;
  type: 'enrollment' | 'grade_updated' | 'task_assigned' | 'exam_assigned' | 'task_completed' | 'exam_completed';
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  user_id: string;
}

interface RealtimeContextType {
  notifications: RealtimeNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<RealtimeNotification, 'id' | 'created_at'>) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Cargar notificaciones existentes
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && !error) {
        setNotifications(data);
      }
    };

    loadNotifications();
  }, [user, supabase]);

  // Configurar subscripciones en tiempo real
  useEffect(() => {
    if (!user) return;

    // Subscription para nuevas notificaciones
    const notificationsChannel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as RealtimeNotification;
        setNotifications(prev => [newNotification, ...prev]);
        
        // Mostrar notificación del navegador si está permitido
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/images/logos/favicon-d.png'
          });
        }
      })
      .subscribe();

    // Subscription para inscripciones (solo para profesores)
    const enrollmentsChannel = supabase
      .channel('enrollments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'enrollments'
      }, async (payload) => {
        const newEnrollment = payload.new;
        
        // Verificar si el usuario es profesor del curso
        const { data: course } = await supabase
          .from('courses')
          .select('teacher_id, title')
          .eq('id', newEnrollment.course_id)
          .single();

        if (course && course.teacher_id === user.id) {
          // Obtener información del estudiante
          const { data: student } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newEnrollment.student_id)
            .single();

          addNotification({
            type: 'enrollment',
            title: 'Nuevo estudiante inscrito',
            message: `${student?.full_name || 'Un estudiante'} se inscribió en ${course.title}`,
            data: { enrollment: newEnrollment, course, student },
            read: false,
            user_id: user.id
          });
        }
      })
      .subscribe();

    // Subscription para calificaciones actualizadas
    const gradesChannel = supabase
      .channel('grades')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'grades'
      }, async (payload) => {
        const newGrade = payload.new;
        
        if (newGrade.student_id === user.id) {
          // Obtener información de la tarea/examen
          const { data: task } = await supabase
            .from('tasks')
            .select('title, type')
            .eq('id', newGrade.task_id)
            .single();

          addNotification({
            type: 'grade_updated',
            title: 'Nueva calificación',
            message: `Recibiste ${newGrade.score}/100 en ${task?.title || 'una tarea'}`,
            data: { grade: newGrade, task },
            read: false,
            user_id: user.id
          });
        }
      })
      .subscribe();

    // Subscription para tareas asignadas
    const tasksChannel = supabase
      .channel('tasks')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks'
      }, async (payload) => {
        const newTask = payload.new;
        
        // Verificar si el usuario está inscrito en el curso
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('course_id', newTask.course_id)
          .eq('student_id', user.id)
          .single();

        if (enrollment) {
          addNotification({
            type: newTask.type === 'exam' ? 'exam_assigned' : 'task_assigned',
            title: `Nueva ${newTask.type === 'exam' ? 'evaluación' : 'tarea'}`,
            message: `Se ha asignado: ${newTask.title}`,
            data: { task: newTask },
            read: false,
            user_id: user.id
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(enrollmentsChannel);
      supabase.removeChannel(gradesChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [user, supabase]);

  // Solicitar permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const addNotification = async (notification: Omit<RealtimeNotification, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notification,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (data && !error) {
      setNotifications(prev => [data, ...prev]);
    }
  };

  return (
    <RealtimeContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification
    }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}