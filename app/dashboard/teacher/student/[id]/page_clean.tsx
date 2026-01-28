'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, CheckCircle } from 'lucide-react';

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - posteriormente se conectará con Supabase
    const mockStudents = [
      {
        id: '1',
        email: 'maria@example.com',
        full_name: 'María García',
        created_at: '2026-01-15T10:00:00Z',
        profile_image: null,
        phone: '+1 (555) 123-4567',
        enrollments: [
          {
            course_id: '1',
            enrolled_at: '2026-01-20T10:00:00Z',
            progress: 75,
            status: 'active',
            grade: 88,
            course: {
              title: 'Introducción a React',
              description: 'Aprende los fundamentos de React'
            }
          }
        ],
        activityLog: [
          { date: '2026-01-27', action: 'Completó la lección "Componentes React"' },
          { date: '2026-01-25', action: 'Envió tarea: "Crear primer componente"' },
          { date: '2026-01-23', action: 'Participó en foro de discusión' }
        ]
      },
      {
        id: '2',
        email: 'carlos@example.com',
        full_name: 'Carlos Rodríguez',
        created_at: '2026-01-10T10:00:00Z',
        profile_image: null,
        phone: '+1 (555) 987-6543',
        enrollments: [
          {
            course_id: '1',
            enrolled_at: '2026-01-18T10:00:00Z',
            progress: 100,
            status: 'completed',
            grade: 95,
            course: {
              title: 'Introducción a React',
              description: 'Aprende los fundamentos de React'
            }
          },
          {
            course_id: '2',
            enrolled_at: '2026-01-25T10:00:00Z',
            progress: 25,
            status: 'active',
            grade: null,
            course: {
              title: 'JavaScript Avanzado',
              description: 'Conceptos avanzados de JavaScript'
            }
          }
        ],
        activityLog: [
          { date: '2026-01-26', action: 'Completó el curso "Introducción a React"' },
          { date: '2026-01-25', action: 'Comenzó nuevo curso: "JavaScript Avanzado"' },
          { date: '2026-01-20', action: 'Obtuvo certificado de React' }
        ]
      },
      {
        id: '3',
        email: 'ana@example.com',
        full_name: 'Ana López',
        created_at: '2026-01-05T10:00:00Z',
        profile_image: null,
        phone: '+1 (555) 456-7890',
        enrollments: [
          {
            course_id: '2',
            enrolled_at: '2026-01-22T10:00:00Z',
            progress: 50,
            status: 'paused',
            grade: null,
            course: {
              title: 'JavaScript Avanzado',
              description: 'Conceptos avanzados de JavaScript'
            }
          }
        ],
        activityLog: [
          { date: '2026-01-24', action: 'Pausó temporalmente el curso' },
          { date: '2026-01-22', action: 'Se inscribió en JavaScript Avanzado' },
          { date: '2026-01-20', action: 'Completó evaluación inicial' }
        ]
      }
    ];

    const foundStudent = mockStudents.find(s => s.id === id);
    setStudent(foundStudent);
    setLoading(false);
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil del estudiante...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-gray-400 mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Estudiante no encontrado</h2>
          <p className="text-gray-600 mb-4">
            No se pudo encontrar el estudiante con ID: {id}
          </p>
          <Link 
            href="/dashboard/teacher/student"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/teacher/student"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Volver a Estudiantes</span>
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-xl">
                  {student.full_name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{student.full_name}</h1>
                <p className="text-gray-600">{student.email}</p>
                <p className="text-sm text-gray-500">
                  Miembro desde: {new Date(student.created_at).toLocaleDateString('es-ES')}
                </p>
                {student.phone && (
                  <p className="text-sm text-gray-500">
                    Teléfono: {student.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cursos Inscritos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Cursos Inscritos</h2>
              </div>
              <div className="p-6 space-y-4">
                {student.enrollments.map((enrollment: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold text-gray-900">{enrollment.course.title}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(enrollment.status)}`}>
                        {getStatusIcon(enrollment.status)}
                        {enrollment.status === 'active' ? 'Activo' : 
                         enrollment.status === 'completed' ? 'Completado' : 'Pausado'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{enrollment.course.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Progreso</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${getProgressColor(enrollment.progress)}`}
                              style={{ width: `${enrollment.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{enrollment.progress}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Calificación</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {enrollment.grade ? `${enrollment.grade}/100` : 'Pendiente'}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Inscrito: {new Date(enrollment.enrolled_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar con actividad */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {student.activityLog.map((activity: any, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cursos completados</span>
                  <span className="font-semibold">
                    {student.enrollments.filter((e: any) => e.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cursos activos</span>
                  <span className="font-semibold">
                    {student.enrollments.filter((e: any) => e.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Promedio general</span>
                  <span className="font-semibold">
                    {(() => {
                      const grades = student.enrollments.filter((e: any) => e.grade).map((e: any) => e.grade);
                      return grades.length > 0 
                        ? Math.round(grades.reduce((a: number, b: number) => a + b, 0) / grades.length) 
                        : 'N/A';
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}