'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client';

interface Course {
  id: string;
  title: string;
  description: string;
  enrollments: {
    progress: number;
    grade: number;
    profiles: {
      id: string;
      full_name: string;
      email: string;
    };
  }[];
}

export default function TeacherDashboard() {
  const supabase = createClient();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- ESTADOS PARA MODALES ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- ESTADOS FORMULARIO ---
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    duration: 60
  });

  useEffect(() => {
    async function loadTeacherData() {
      try {
        setLoading(true);
        setError(null);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw new Error('Error de autenticación: ' + authError.message);
        if (!user) { setError('No hay usuario autenticado'); return; }

        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            id, title, description,
            enrollments (
              progress, grade,
              profiles:student_id ( id, full_name, email )
            )
          `)
          .eq('teacher_id', user.id);

        if (coursesError) throw new Error('Error cargando cursos: ' + coursesError.message);

        setCourses(coursesData || []);
        
        if (coursesData && coursesData.length > 0) {
          setSelectedCourseId(coursesData[0].id);
        }

      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    loadTeacherData();
  }, []);

  // --- FUNCIONES DE CREACIÓN ---
  const handleCreateTask = async () => {
    if (!selectedCourseId) return alert('Selecciona un curso primero.');
    if (!formData.title || !formData.date) return alert('Completa los campos obligatorios.');

    setSubmitting(true);
    const { error } = await supabase.from('assignments').insert({
      course_id: selectedCourseId,
      title: formData.title,
      description: formData.description,
      due_date: formData.date
    });

    setSubmitting(false);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('✅ Tarea asignada correctamente');
      setIsTaskModalOpen(false);
      setFormData({ title: '', description: '', date: '', duration: 60 });
    }
  };

  const handleCreateExam = async () => {
    if (!selectedCourseId) return alert('Selecciona un curso primero.');
    if (!formData.title || !formData.date) return alert('Completa los campos obligatorios.');

    setSubmitting(true);
    const { error } = await supabase.from('exams').insert({
      course_id: selectedCourseId,
      title: formData.title,
      description: formData.description,
      exam_date: formData.date,
      duration_minutes: formData.duration
    });

    setSubmitting(false);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('✅ Examen programado correctamente');
      setIsExamModalOpen(false);
      setFormData({ title: '', description: '', date: '', duration: 60 });
    }
  };

  const currentCourse = courses.find(course => course.id === selectedCourseId);
  const students = currentCourse?.enrollments || [];
  const totalStudents = students.length;
  const averageProgress = totalStudents > 0 
    ? Math.round(students.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0) / totalStudents)
    : 0;
  const averageGrade = totalStudents > 0
    ? Math.round(students.reduce((sum, enrollment) => sum + (enrollment.grade || 0), 0) / totalStudents)
    : 0;

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>;
  if (error) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 fixed h-full overflow-y-auto z-10">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">PCA Teacher</h1>
                <p className="text-gray-400 text-sm">Panel de Control</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mis Cursos ({courses.length})</div>
              {courses.length === 0 ? (
                <p className="text-gray-400 text-sm text-center">No tienes cursos asignados</p>
              ) : (
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div key={course.id} className="space-y-2">
                      <button
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                          selectedCourseId === course.id
                            ? 'bg-blue-600/20 border-2 border-blue-500 text-blue-300'
                            : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                        <p className="text-xs opacity-75 mt-1 line-clamp-2">{course.description || 'Sin descripción'}</p>
                        <div className="flex items-center justify-between mt-2">
                           <span className="text-xs text-gray-400">{course.enrollments.length} estudiantes</span>
                        </div>
                      </button>
                      
                      {selectedCourseId === course.id && (
                        <Link href={`/dashboard/teacher/course/${course.id}/edit`}>
                          <Button variant="secondary" fullWidth className="text-xs py-2 mt-2">✏️ Editar Contenido</Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-4 border-t border-gray-600">
                <Link href="/dashboard/teacher/create-course">
                  <Button variant="outline" fullWidth className="text-sm">+ Crear Nuevo Curso</Button>
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="ml-80 flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard del Profesor</h1>
                <p className="text-gray-400 mt-2">
                  {currentCourse ? (
                    <>Gestionando: <span className="text-blue-400 font-medium">{currentCourse.title}</span></>
                  ) : 'Selecciona un curso para comenzar'}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="secondary" onClick={() => setIsTaskModalOpen(true)} disabled={!selectedCourseId}>
                    Asignar Tarea
                </Button>
                <Button onClick={() => setIsExamModalOpen(true)} disabled={!selectedCourseId}>
                    Crear Examen
                </Button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex items-center">
                 <div className="p-3 rounded-full bg-blue-600/20 mr-4"><span className="text-2xl">👥</span></div>
                 <div><p className="text-sm text-gray-400">Total Estudiantes</p><p className="text-3xl font-bold text-white">{totalStudents}</p></div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex items-center">
                 <div className="p-3 rounded-full bg-green-600/20 mr-4"><span className="text-2xl">📈</span></div>
                 <div><p className="text-sm text-gray-400">Progreso Promedio</p><p className="text-3xl font-bold text-white">{averageProgress}%</p></div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex items-center">
                 <div className="p-3 rounded-full bg-purple-600/20 mr-4"><span className="text-2xl">🎓</span></div>
                 <div><p className="text-sm text-gray-400">Nota Promedio</p><p className="text-3xl font-bold text-white">{averageGrade}</p></div>
              </div>
            </div>

            {/* TABLA DE ESTUDIANTES RESTAURADA */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold">Lista de Estudiantes</h2>
               </div>

               {!currentCourse ? (
                 <div className="p-8 text-center text-gray-400">Selecciona un curso...</div>
               ) : students.length === 0 ? (
                 <div className="p-8 text-center text-gray-400">No hay estudiantes inscritos aún.</div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-700">
                     <thead className="bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estudiante</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Progreso</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Calificación</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-700">
                        {students.map((enrollment, i) => {
                          const studentName = enrollment.profiles?.full_name || 'Desconocido';
                          const studentEmail = enrollment.profiles?.email || 'Sin email';
                          const progress = enrollment.progress || 0;
                          const grade = enrollment.grade || 0;

                          return (
                            <tr key={i} className="hover:bg-gray-700/50 transition-colors">
                               <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                     <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">
                                        {studentName.charAt(0).toUpperCase()}
                                     </div>
                                     <div>
                                        <div className="text-sm font-medium text-white">{studentName}</div>
                                        <div className="text-sm text-gray-400">{studentEmail}</div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="w-full bg-gray-700 rounded-full h-2.5 mr-2 max-w-[100px] inline-block">
                                     <div className={`h-2.5 rounded-full ${progress >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${progress}%` }}></div>
                                  </div>
                                  <span className="text-sm text-gray-300">{progress}%</span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-sm font-bold ${grade >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                                     {grade > 0 ? `${grade}/100` : 'Sin Nota'}
                                  </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${progress > 0 ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'}`}>
                                     {progress > 0 ? 'Activo' : 'Inactivo'}
                                  </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <Link 
                                    href={`/dashboard/teacher/student/${enrollment.profiles?.id}`} 
                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                  >
                                    Ver detalles
                                  </Link>
                               </td>
                            </tr>
                          );
                        })}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </div>
        </main>
      </div>

      {/* MODAL CREAR TAREA */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">📝 Asignar Nueva Tarea</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título</label>
                <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Instrucciones</label>
                <textarea rows={3} className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Fecha de Entrega</label>
                <input type="datetime-local" className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none"
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button fullWidth onClick={handleCreateTask} disabled={submitting}>{submitting ? 'Guardando...' : 'Asignar'}</Button>
                <Button variant="outline" fullWidth onClick={() => setIsTaskModalOpen(false)}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR EXAMEN */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">⏰ Programar Examen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título</label>
                <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Fecha</label>
                    <input type="datetime-local" className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none"
                      value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Duración (min)</label>
                    <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-2 outline-none"
                      value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} />
                 </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button fullWidth onClick={handleCreateExam} disabled={submitting}>{submitting ? 'Guardando...' : 'Programar'}</Button>
                <Button variant="outline" fullWidth onClick={() => setIsExamModalOpen(false)}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}