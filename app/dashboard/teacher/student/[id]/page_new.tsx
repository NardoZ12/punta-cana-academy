'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, CheckCircle, User, Calendar, TrendingUp, Award, Target } from 'lucide-react';

interface StudentActivity {
  id: number;
  type: 'lesson' | 'quiz' | 'exam' | 'task';
  title: string;
  timestamp: string;
  score?: number;
}

interface StudentProgress {
  courseId: number;
  courseName: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
}

export default function StudentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - En producción esto vendría de Supabase
    const mockStudent = {
      id: parseInt(id as string),
      name: `Estudiante ${id}`,
      email: `student${id}@academy.com`,
      avatar: `https://ui-avatars.com/api/?name=Student+${id}&background=3B82F6&color=fff&size=200`,
      enrolledDate: '2024-01-15',
      totalCourses: 3,
      completedCourses: 1,
      averageScore: 85,
      totalHours: 127
    };

    const mockActivities: StudentActivity[] = [
      { id: 1, type: 'lesson', title: 'Introducción a React', timestamp: '2024-01-20 14:30', score: 95 },
      { id: 2, type: 'quiz', title: 'Quiz: Fundamentos JS', timestamp: '2024-01-19 16:45', score: 88 },
      { id: 3, type: 'exam', title: 'Examen Final - Módulo 1', timestamp: '2024-01-18 10:00', score: 92 },
      { id: 4, type: 'task', title: 'Tarea: Crear componente', timestamp: '2024-01-17 09:15', score: 85 }
    ];

    const mockProgress: StudentProgress[] = [
      {
        courseId: 1,
        courseName: 'Desarrollo Web Frontend',
        progress: 85,
        completedLessons: 17,
        totalLessons: 20,
        averageScore: 88
      },
      {
        courseId: 2,
        courseName: 'JavaScript Avanzado',
        progress: 60,
        completedLessons: 12,
        totalLessons: 20,
        averageScore: 82
      },
      {
        courseId: 3,
        courseName: 'Base de Datos',
        progress: 30,
        completedLessons: 6,
        totalLessons: 20,
        averageScore: 90
      }
    ];

    setStudent(mockStudent);
    setActivities(mockActivities);
    setProgress(mockProgress);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Estudiante no encontrado</h2>
          <Link 
            href="/dashboard/teacher/student" 
            className="text-blue-600 hover:text-blue-800"
          >
            Volver a la lista de estudiantes
          </Link>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="w-4 h-4" />;
      case 'quiz': return <CheckCircle className="w-4 h-4" />;
      case 'exam': return <Award className="w-4 h-4" />;
      case 'task': return <Target className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800';
      case 'quiz': return 'bg-green-100 text-green-800';
      case 'exam': return 'bg-purple-100 text-purple-800';
      case 'task': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard/teacher/student"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a estudiantes
          </Link>
        </div>
      </div>

      {/* Student Profile */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start space-x-6">
          <img 
            src={student.avatar} 
            alt={student.name}
            className="w-24 h-24 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h1>
                <div className="flex items-center text-gray-600 mb-4 space-x-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {student.email}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Registrado: {new Date(student.enrolledDate).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Progress & Activities */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Progress */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Progreso por Curso
            </h2>
            <div className="space-y-4">
              {progress.map((course) => (
                <div key={course.courseId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{course.courseName}</h3>
                    <span className="text-sm text-gray-500">
                      {course.completedLessons}/{course.totalLessons} lecciones
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{course.progress}% completado</span>
                    <span className="text-blue-600 font-medium">
                      Promedio: {course.averageScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Actividad Reciente
            </h2>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                  {activity.score && (
                    <div className="text-right">
                      <span className={`font-medium ${activity.score >= 80 ? 'text-green-600' : activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {activity.score}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Statistics */}
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Cursos Totales</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{student.totalCourses}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium">Completados</span>
                </div>
                <span className="text-lg font-bold text-green-600">{student.completedCourses}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium">Promedio General</span>
                </div>
                <span className="text-lg font-bold text-purple-600">{student.averageScore}%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="text-sm font-medium">Horas Totales</span>
                </div>
                <span className="text-lg font-bold text-orange-600">{student.totalHours}h</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <p className="font-medium">Ver calificaciones</p>
                    <p className="text-sm text-gray-500">Historial completo</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <p className="font-medium">Asignar tarea</p>
                    <p className="text-sm text-gray-500">Nueva actividad</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
