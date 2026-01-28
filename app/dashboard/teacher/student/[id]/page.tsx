'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockStudent = {
      id: id,
      name: `Estudiante ${id}`,
      email: `student${id}@academy.com`,
      avatar: `https://ui-avatars.com/api/?name=Student+${id}&background=3B82F6&color=fff&size=200`,
      enrolledDate: '2024-01-15',
      totalCourses: 3,
      completedCourses: 1,
      averageScore: 85,
      totalHours: 127,
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
      ]
    };

    setTimeout(() => {
      setStudent(mockStudent);
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Estudiante no encontrado
          </h1>
          <Link 
            href="/dashboard/teacher"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard/teacher"
                className="mr-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Perfil de Estudiante
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center text-center">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-24 h-24 rounded-full mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {student.name}
                </h2>
                <p className="text-gray-600 mb-4">{student.email}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{student.totalCourses}</div>
                    <div className="text-sm text-gray-600">Cursos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{student.completedCourses}</div>
                    <div className="text-sm text-gray-600">Completados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{student.averageScore}%</div>
                    <div className="text-sm text-gray-600">Promedio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{student.totalHours}</div>
                    <div className="text-sm text-gray-600">Horas</div>
                  </div>
                </div>

                <div className="mt-6 w-full pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Inscrito desde {student.enrolledDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Inscripciones</h3>
              </div>
              <div className="p-6">
                {student.enrollments && student.enrollments.map((enrollment: any, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{enrollment.course.title}</h4>
                        <p className="text-sm text-gray-600">{enrollment.course.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Inscrito el {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          enrollment.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {enrollment.status}
                        </span>
                        <div className="mt-1">
                          <span className="text-sm font-medium">{enrollment.progress}% progreso</span>
                        </div>
                        {enrollment.grade && (
                          <div className="mt-1">
                            <span className="text-sm text-green-600">Nota: {enrollment.grade}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}