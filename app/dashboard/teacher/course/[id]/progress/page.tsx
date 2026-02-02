'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCourseStudentsProgress, useCourseStructure } from '@/hooks/useCourses';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  FileText,
  ClipboardList,
  BarChart3,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { useState } from 'react';

export default function CourseStudentsProgressPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const { data: course, isLoading: courseLoading } = useCourseStructure(courseId);
  const { data: studentsProgress, isLoading: progressLoading } = useCourseStudentsProgress(courseId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'grade'>('progress');

  const loading = courseLoading || progressLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm">Cargando progreso de estudiantes...</p>
        </div>
      </div>
    );
  }

  // Filtrar y ordenar estudiantes
  const filteredStudents = (studentsProgress || [])
    .filter((s: any) => 
      s.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortBy === 'name') {
        return (a.student?.full_name || '').localeCompare(b.student?.full_name || '');
      } else if (sortBy === 'progress') {
        return (b.enrollment?.progress || 0) - (a.enrollment?.progress || 0);
      } else {
        return (b.averageGrade || 0) - (a.averageGrade || 0);
      }
    });

  // Calcular estadísticas generales
  const stats = {
    totalStudents: studentsProgress?.length || 0,
    avgProgress: studentsProgress?.length > 0 
      ? Math.round(studentsProgress.reduce((sum: number, s: any) => sum + (s.enrollment?.progress || 0), 0) / studentsProgress.length)
      : 0,
    avgGrade: studentsProgress?.filter((s: any) => s.averageGrade !== null).length > 0
      ? Math.round(studentsProgress.filter((s: any) => s.averageGrade !== null).reduce((sum: number, s: any) => sum + (s.averageGrade || 0), 0) / studentsProgress.filter((s: any) => s.averageGrade !== null).length)
      : 0,
    completionRate: studentsProgress?.length > 0
      ? Math.round((studentsProgress.filter((s: any) => (s.enrollment?.progress || 0) === 100).length / studentsProgress.length) * 100)
      : 0
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-24">
        
        {/* Header */}
        <header className="mb-8">
          <Link 
            href={`/dashboard/teacher/course/${courseId}/edit`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Curso
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Progreso de Estudiantes
              </h1>
              <p className="text-gray-400">{course?.title}</p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xs text-gray-500 uppercase">Estudiantes</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
          </div>
          
          <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-gray-500 uppercase">Progreso Promedio</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgProgress}%</p>
          </div>
          
          <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs text-gray-500 uppercase">Nota Promedio</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgGrade}%</p>
          </div>
          
          <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs text-gray-500 uppercase">Completaron</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0f1a] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0a0f1a] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="progress">Ordenar por Progreso</option>
              <option value="grade">Ordenar por Nota</option>
              <option value="name">Ordenar por Nombre</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-2xl overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchTerm ? 'No se encontraron estudiantes' : 'Sin estudiantes inscritos'}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Los estudiantes aparecerán aquí cuando se inscriban'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900/50 text-left text-xs text-gray-500 uppercase">
                    <th className="px-6 py-4 font-medium">Estudiante</th>
                    <th className="px-6 py-4 font-medium text-center">Progreso</th>
                    <th className="px-6 py-4 font-medium text-center">Unidades</th>
                    <th className="px-6 py-4 font-medium text-center">Tareas</th>
                    <th className="px-6 py-4 font-medium text-center">Exámenes</th>
                    <th className="px-6 py-4 font-medium text-center">Promedio</th>
                    <th className="px-6 py-4 font-medium text-center">Última Actividad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {filteredStudents.map((studentData: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                            {studentData.student?.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{studentData.student?.full_name || 'Sin nombre'}</p>
                            <p className="text-xs text-gray-500 truncate">{studentData.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (studentData.enrollment?.progress || 0) >= 80 ? 'bg-green-500' :
                                (studentData.enrollment?.progress || 0) >= 50 ? 'bg-cyan-500' :
                                (studentData.enrollment?.progress || 0) >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${studentData.enrollment?.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-white font-medium w-10 text-right">
                            {studentData.enrollment?.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-white">{studentData.unitsCompleted || 0}</span>
                        <span className="text-xs text-gray-500">/{course?.totalUnits || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-white">{studentData.assignmentsSubmitted || 0}</span>
                        <span className="text-xs text-gray-500">/{studentData.totalAssignments || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-white">{studentData.evaluationsCompleted || 0}</span>
                        <span className="text-xs text-gray-500">/{studentData.totalEvaluations || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {studentData.averageGrade !== null ? (
                          <span className={`text-sm font-semibold ${
                            (studentData.averageGrade || 0) >= 70 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {studentData.averageGrade}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Sin datos</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-gray-400">
                          {studentData.lastActivity 
                            ? new Date(studentData.lastActivity).toLocaleDateString('es-ES', { 
                                day: 'numeric', month: 'short' 
                              })
                            : 'N/A'
                          }
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
