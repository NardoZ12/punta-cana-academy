import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface GradeData {
  averageGrade: number;
  completedCourses: number;
  totalCourses: number;
  gradeDistribution: {
    excellent: number; // 90-100
    good: number;      // 80-89
    regular: number;   // 70-79
    poor: number;      // <70
  };
}

/**
 * Hook para obtener y calcular promedios de estudiante en tiempo real
 */
export function useStudentGrades(studentId: string | null) {
  const [gradeData, setGradeData] = useState<GradeData>({
    averageGrade: 0,
    completedCourses: 0,
    totalCourses: 0,
    gradeDistribution: { excellent: 0, good: 0, regular: 0, poor: 0 }
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const calculateGrades = async () => {
    if (!studentId) return;

    try {
      // Obtener todas las inscripciones con notas
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          grade,
          progress,
          courses (
            id,
            title,
            is_published
          )
        `)
        .eq('student_id', studentId)
        .eq('courses.is_published', true);

      if (!enrollments) return;

      const grades = enrollments
        .filter(e => e.grade !== null && e.grade !== undefined)
        .map(e => e.grade);

      const totalCourses = enrollments.length;
      const completedCourses = enrollments.filter(e => e.progress === 100).length;
      
      // Calcular promedio
      const averageGrade = grades.length > 0 
        ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)
        : 0;

      // Distribución de notas
      const distribution = {
        excellent: grades.filter(g => g >= 90).length,
        good: grades.filter(g => g >= 80 && g < 90).length,
        regular: grades.filter(g => g >= 70 && g < 80).length,
        poor: grades.filter(g => g < 70).length
      };

      setGradeData({
        averageGrade,
        completedCourses,
        totalCourses,
        gradeDistribution: distribution
      });

    } catch (error) {
      console.error('Error calculando notas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateGrades();

    // Escuchar cambios en tiempo real
    if (studentId) {
      const channel = supabase
        .channel(`student-grades-${studentId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'enrollments',
            filter: `student_id=eq.${studentId}`
          },
          () => {
            calculateGrades();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [studentId]);

  return { gradeData, loading, refetch: calculateGrades };
}

/**
 * Hook para estadísticas del profesor sobre sus estudiantes
 */
export function useTeacherStats(teacherId: string | null) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0, // Estudiantes con actividad reciente
    averageProgress: 0,
    pendingSubmissions: 0,
    coursesWithLowPerformance: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const calculateStats = async () => {
    if (!teacherId) return;

    try {
      // Obtener estadísticas de cursos del profesor
      const { data: courseStats } = await supabase
        .from('courses')
        .select(`
          id,
          enrollments (
            student_id,
            progress,
            grade,
            updated_at
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('is_published', true);

      if (!courseStats) return;

      const allEnrollments = courseStats.flatMap(c => c.enrollments || []);
      const uniqueStudents = new Set(allEnrollments.map(e => e.student_id)).size;
      
      // Estudiantes activos (con actividad en los últimos 7 días)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const activeStudents = allEnrollments.filter(e => 
        new Date(e.updated_at) > sevenDaysAgo
      ).length;

      // Promedio de progreso
      const avgProgress = allEnrollments.length > 0
        ? Math.round(allEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / allEnrollments.length)
        : 0;

      // Obtener submissions pendientes
      const { data: pendingExams } = await supabase
        .from('exams')
        .select(`
          id,
          exam_submissions!left(student_id)
        `)
        .in('course_id', courseStats.map(c => c.id))
        .gte('exam_date', new Date().toISOString());

      const pendingSubmissions = pendingExams
        ? pendingExams.filter(exam => !exam.exam_submissions || exam.exam_submissions.length === 0).length
        : 0;

      setStats({
        totalStudents: uniqueStudents,
        activeStudents,
        averageProgress: avgProgress,
        pendingSubmissions,
        coursesWithLowPerformance: courseStats.filter(c => {
          const courseAvg = c.enrollments?.reduce((sum, e) => sum + (e.grade || 0), 0) / (c.enrollments?.length || 1);
          return courseAvg < 70;
        }).length
      });

    } catch (error) {
      console.error('Error calculando estadísticas del profesor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateStats();

    // Actualizar cada 5 minutos o cuando hay cambios
    const interval = setInterval(calculateStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [teacherId]);

  return { stats, loading, refetch: calculateStats };
}