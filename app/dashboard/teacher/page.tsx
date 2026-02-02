'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client';
import { CourseStats } from '@/components/molecules/CourseStats';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
}

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
}

interface Enrollment {
  progress: number;
  grade: number;
  student_id: string;
  profiles?: StudentProfile;
}

interface TeacherStats {
  totalStudents: number;
  totalCourses: number;
  averageGrade: number;
  passRate: number;
  pendingAssignments: number;
}

interface GradeDistribution {
  range: string;
  count: number;
}

interface Question {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correct: string;
}

export default function TeacherDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    totalCourses: 0,
    averageGrade: 0,
    passRate: 0,
    pendingAssignments: 0
  });
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([
    { range: '0-59', count: 0 },
    { range: '60-69', count: 0 },
    { range: '70-79', count: 0 },
    { range: '80-89', count: 0 },
    { range: '90-100', count: 0 },
  ]);

  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string>('all');

  const [taskData, setTaskData] = useState({ title: '', description: '', date: '' });
  const [examData, setExamData] = useState({ title: '', date: '', duration: 60 });
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', optionA: '', optionB: '', optionC: '', correct: 'a' }
  ]);

  // Función para calcular estadísticas
  const calculateStats = (enrollmentsData: Enrollment[]) => {
    if (!enrollmentsData.length) return null;
    
    const grades = enrollmentsData.map(e => e.grade || 0);
    const avg = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
    const passed = grades.filter(g => g >= 70).length;
    const passRate = Math.round((passed / grades.length) * 100);

    const distribution = [
      { range: '0-59', count: grades.filter(g => g < 60).length },
      { range: '60-69', count: grades.filter(g => g >= 60 && g < 70).length },
      { range: '70-79', count: grades.filter(g => g >= 70 && g < 80).length },
      { range: '80-89', count: grades.filter(g => g >= 80 && g < 90).length },
      { range: '90-100', count: grades.filter(g => g >= 90).length },
    ];

    return { avg, passRate, distribution };
  };

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function loadTeacherData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { 
          window.location.href = '/login';
          return; 
        }

        if (!mounted) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, user_type')
          .eq('id', user.id)
          .single();
        
        if (!mounted) return;

        if (profile?.user_type !== 'teacher') {
          setError('No tienes permisos de profesor');
          setLoading(false);
          return;
        }

        setTeacherName(profile.full_name || 'Profesor');

        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title, description, image_url, created_at')
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false });

        if (!mounted) return;

        if (coursesData && coursesData.length > 0) {
          setCourses(coursesData);
          setSelectedCourseId(coursesData[0].id);
          
          const courseIds = coursesData.map(c => c.id);
          
          const { count: studentCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .in('course_id', courseIds);

          const { data: assignments } = await supabase
            .from('assignments')
            .select('id, title, due_date, course_id')
            .in('course_id', courseIds)
            .gte('due_date', new Date().toISOString())
            .order('due_date', { ascending: true })
            .limit(10);

          if (!mounted) return;

          setPendingAssignments(assignments || []);

          setStats(prev => ({
            ...prev,
            totalStudents: studentCount || 0,
            totalCourses: coursesData.length,
            pendingAssignments: assignments?.length || 0
          }));
        } else {
          setCourses([]);
        }

      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    loadTeacherData();
    return () => { mounted = false; };
  }, []);

  // Cargar datos del curso cuando cambia la selección
  useEffect(() => {
    if (selectedCourseId) {
      const supabase = createClient();
      
      async function loadCourseDetails() {
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select('student_id, progress, grade')
          .eq('course_id', selectedCourseId);

        if (!enrollmentsData || enrollmentsData.length === 0) {
          setEnrollments([]);
          setStudents([]);
          return;
        }

        const studentIds = enrollmentsData.map(e => e.student_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds);

        const enrichedEnrollments = enrollmentsData.map(enrollment => ({
          ...enrollment,
          profiles: profiles?.find(p => p.id === enrollment.student_id)
        }));

        setEnrollments(enrichedEnrollments);
        
        // Extraer estudiantes únicos para el dropdown
        const uniqueStudents = profiles || [];
        setStudents(uniqueStudents);

        // Calcular estadísticas
        const statsData = calculateStats(enrollmentsData);
        if (statsData) {
          setStats(prev => ({
            ...prev,
            averageGrade: statsData.avg,
            passRate: statsData.passRate
          }));
          setGradeDistribution(statsData.distribution);
        }
      }

      loadCourseDetails();
    }
  }, [selectedCourseId]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', optionA: '', optionB: '', optionC: '', correct: 'a' }]);
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleCreateTask = async () => {
    if (!selectedCourseId || !taskData.title) return alert('Datos incompletos');
    setSubmitting(true);
    const supabase = createClient();
    
    const payload: any = {
      course_id: selectedCourseId,
      title: taskData.title,
      description: taskData.description,
      due_date: taskData.date,
      assignment_type: 'task',
      is_published: true
    };

    // Asignación específica a un estudiante
    if (targetStudentId !== 'all') {
      payload.student_id = targetStudentId;
    }

    const { error } = await supabase.from('assignments').insert(payload);

    setSubmitting(false);
    if (error) alert(error.message);
    else {
      alert(`✅ Tarea asignada ${targetStudentId !== 'all' ? 'al estudiante' : 'a todo el curso'}!`);
      setIsTaskModalOpen(false);
      setTaskData({ title: '', description: '', date: '' });
      setTargetStudentId('all');
      window.location.reload();
    }
  };

  const handleCreateExam = async () => {
    if (!selectedCourseId || !examData.title) return alert('Faltan datos del examen');
    setSubmitting(true);
    const supabase = createClient();

    const quizData = {
      title: examData.title,
      time_limit_minutes: examData.duration,
      questions: questions.map((q, idx) => ({
        id: `q${idx + 1}`,
        type: 'multiple_choice',
        points: Math.floor(100 / questions.length),
        question: q.text,
        options: [
          { id: 'a', text: q.optionA },
          { id: 'b', text: q.optionB },
          { id: 'c', text: q.optionC }
        ],
        correct_answer: q.correct
      }))
    };

    const payload: any = {
      course_id: selectedCourseId,
      title: examData.title,
      description: `Examen de ${questions.length} preguntas`,
      due_date: examData.date,
      assignment_type: 'exam',
      max_score: 100,
      quiz_data: quizData,
      is_published: true
    };

    if (targetStudentId !== 'all') {
      payload.student_id = targetStudentId;
    }

    const { error } = await supabase.from('assignments').insert(payload);

    setSubmitting(false);
    
    if (error) {
      alert('Error creando examen: ' + error.message);
    } else {
      alert(`✅ Examen guardado ${targetStudentId !== 'all' ? 'para el estudiante' : 'para todo el curso'}!`);
      setIsExamModalOpen(false);
      setExamData({ title: '', date: '', duration: 60 });
      setQuestions([{ text: '', optionA: '', optionB: '', optionC: '', correct: 'a' }]);
      setTargetStudentId('all');
      window.location.reload();
    }
  };

  const currentCourse = courses.find(c => c.id === selectedCourseId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-gray-400 text-sm">Cargando panel de profesor...</p>
        <p className="text-gray-600 text-xs mt-2">Esto puede tardar unos segundos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center text-white p-4">
        <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER CON ESTADÍSTICAS */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Hola, Prof. {teacherName.split(' ')[0] || 'Docente'} 👨‍🏫
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Panel de control y gestión académica</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl border border-blue-500/20">
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <div className="text-xs text-blue-200">Estudiantes</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-2xl border border-purple-500/20">
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <div className="text-xs text-purple-200">Cursos</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-2xl border border-green-500/20">
              <div className="text-2xl font-bold">{stats.averageGrade}%</div>
              <div className="text-xs text-green-200">Promedio</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-4 rounded-2xl border border-orange-500/20">
              <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
              <div className="text-xs text-orange-200">Tareas</div>
            </div>
          </div>
        </div>

        {/* ESTADÍSTICAS DEL CURSO */}
        {selectedCourseId && students.length > 0 && (
          <CourseStats 
            totalStudents={students.length}
            averageGrade={stats.averageGrade}
            passRate={stats.passRate}
            gradeDistribution={gradeDistribution}
          />
        )}

        {/* NAVEGACIÓN DE CURSOS */}
        <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            📚 Mis Cursos
            <span className="text-xs bg-cyan-600 px-2 py-1 rounded-full">{courses.length}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`text-left p-4 rounded-xl transition-all duration-200 ${
                  selectedCourseId === course.id
                    ? 'bg-cyan-600/20 border-2 border-cyan-500'
                    : 'bg-[#0f1115] border border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {course.title.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{course.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                    {selectedCourseId === course.id && (
                      <Link href={`/dashboard/teacher/course/${course.id}/edit`}>
                        <span className="text-xs text-cyan-400 hover:underline mt-2 inline-block">✏️ Editar curso</span>
                      </Link>
                    )}
                  </div>
                </div>
              </button>
            ))}
            
            <Link href="/dashboard/teacher/create-course">
              <div className="border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-xl p-4 h-full flex flex-col items-center justify-center text-center transition-all min-h-[120px]">
                <div className="text-3xl mb-2">➕</div>
                <div className="text-sm font-semibold text-gray-400 hover:text-cyan-400">Crear Nuevo Curso</div>
              </div>
            </Link>
          </div>

          {selectedCourseId && (
            <div className="flex gap-3 flex-wrap">
              <Button variant="secondary" onClick={() => setIsTaskModalOpen(true)}>
                📝 Asignar Tarea
              </Button>
              <Button onClick={() => setIsExamModalOpen(true)}>
                ⏰ Crear Examen
              </Button>
            </div>
          )}
        </div>

        {/* LAYOUT DE 2 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-4">
                👥 Estudiantes de {currentCourse?.title || 'Curso Seleccionado'}
              </h2>
              
              {enrollments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-2">🎓</p>
                  <p>No hay estudiantes inscritos en este curso.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-800">
                  <table className="w-full">
                    <thead className="bg-[#0f1115] text-xs uppercase text-gray-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Estudiante</th>
                        <th className="px-4 py-3 text-center">Progreso</th>
                        <th className="px-4 py-3 text-center">Nota</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {enrollments.map((student, idx) => (
                        <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-white">{student.profiles?.full_name || 'Sin nombre'}</div>
                              <div className="text-xs text-gray-500">{student.profiles?.email || ''}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-16 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-cyan-500 h-2 rounded-full transition-all"
                                  style={{ width: `${student.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-xs text-cyan-400">{student.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-bold ${(student.grade || 0) >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {student.grade || 0}/100
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link 
                              href={`/dashboard/teacher/student/${student.profiles?.id}`}
                              className="text-cyan-400 text-sm hover:underline"
                            >
                              Ver detalles →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-4 text-orange-200">
                ⏰ Tareas Activas
              </h3>
              
              <div className="space-y-3">
                {pendingAssignments.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-3xl mb-2">✅</p>
                    <p className="text-sm">No hay tareas pendientes</p>
                  </div>
                ) : (
                  pendingAssignments.slice(0, 5).map((assignment, idx) => (
                    <div key={idx} className="bg-[#0f1115] p-3 rounded-xl border border-gray-800">
                      <div className="font-semibold text-sm text-white">{assignment.title}</div>
                      <div className="text-xs text-orange-400 mt-2 font-mono">
                        📅 {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL TAREA */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">📝 Asignar Tarea</h2>
            
            {/* Selector de Asignación */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Asignar a:</label>
              <select 
                className="w-full bg-[#0f1115] border border-gray-700 rounded p-2 text-white"
                value={targetStudentId}
                onChange={(e) => setTargetStudentId(e.target.value)}
              >
                <option value="all">👥 Todo el Curso</option>
                <optgroup label="Estudiantes Específicos">
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <input type="text" placeholder="Título de la tarea" className="w-full bg-[#0f1115] border border-gray-700 rounded p-2 mb-3 text-white"
              value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
            <textarea placeholder="Instrucciones para el estudiante" className="w-full bg-[#0f1115] border border-gray-700 rounded p-2 mb-3 text-white h-24"
              value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
            <label className="text-sm text-gray-400 mb-1 block">Fecha límite de entrega</label>
            <input type="datetime-local" className="w-full bg-[#0f1115] border border-gray-700 rounded p-2 mb-4 text-white"
              value={taskData.date} onChange={e => setTaskData({...taskData, date: e.target.value})} />
            <div className="flex gap-2">
               <Button fullWidth onClick={handleCreateTask} disabled={submitting}>
                 {submitting ? 'Guardando...' : '💾 Asignar'}
               </Button>
               <Button variant="outline" fullWidth onClick={() => setIsTaskModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXAMEN */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            
            <div className="p-6 border-b border-gray-700 bg-[#0f1115] rounded-t-xl">
               <h2 className="text-2xl font-bold text-white mb-4">⏰ Crear Nuevo Examen</h2>
               
               {/* Selector de Asignación */}
               <div className="mb-4">
                 <label className="block text-sm text-gray-400 mb-1">Asignar a:</label>
                 <select 
                   className="w-full bg-[#161b22] border border-gray-600 rounded p-2 text-white"
                   value={targetStudentId}
                   onChange={(e) => setTargetStudentId(e.target.value)}
                 >
                   <option value="all">👥 Todo el Curso</option>
                   <optgroup label="Estudiantes Específicos">
                     {students.map(s => (
                       <option key={s.id} value={s.id}>{s.full_name}</option>
                     ))}
                   </optgroup>
                 </select>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Título del Examen</label>
                    <input type="text" placeholder="Ej: Examen Parcial - Módulo 1" className="w-full bg-[#161b22] border border-gray-600 rounded p-2 text-white"
                       value={examData.title} onChange={e => setExamData({...examData, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fecha del Examen</label>
                    <input type="datetime-local" className="w-full bg-[#161b22] border border-gray-600 rounded p-2 text-white"
                       value={examData.date} onChange={e => setExamData({...examData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Duración (minutos)</label>
                    <input type="number" placeholder="60" className="w-full bg-[#161b22] border border-gray-600 rounded p-2 text-white"
                       value={examData.duration} onChange={e => setExamData({...examData, duration: parseInt(e.target.value) || 60})} />
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0f1115]">
               {questions.map((q, idx) => (
                 <div key={idx} className="bg-[#161b22] border border-gray-700 p-4 rounded-lg relative group">
                    <div className="flex justify-between mb-2">
                       <span className="text-cyan-400 font-bold text-sm">Pregunta {idx + 1}</span>
                       {questions.length > 1 && (
                         <button 
                           onClick={() => {
                             const newQ = questions.filter((_, i) => i !== idx);
                             setQuestions(newQ);
                           }}
                           className="text-red-400 text-xs hover:text-red-300"
                         >
                           🗑️ Eliminar
                         </button>
                       )}
                    </div>
                    
                    <input type="text" placeholder="Escribe la pregunta aquí..." className="w-full bg-[#0f1115] border border-gray-600 rounded p-2 mb-3 font-medium text-white"
                       value={q.text} onChange={e => handleQuestionChange(idx, 'text', e.target.value)} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                       {['A', 'B', 'C'].map((opt) => (
                          <div key={opt} className={`border rounded p-2 flex items-center gap-2 ${q.correct === opt.toLowerCase() ? 'border-green-500 bg-green-900/20' : 'border-gray-700'}`}>
                             <input 
                               type="radio" 
                               name={`correct-${idx}`} 
                               checked={q.correct === opt.toLowerCase()} 
                               onChange={() => handleQuestionChange(idx, 'correct', opt.toLowerCase())}
                               className="accent-green-500"
                             />
                             <input 
                               type="text" 
                               placeholder={`Opción ${opt}`}
                               className="bg-transparent border-none outline-none w-full text-sm text-white"
                               value={opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : q.optionC}
                               onChange={(e) => handleQuestionChange(idx, `option${opt}`, e.target.value)}
                             />
                          </div>
                       ))}
                    </div>
                 </div>
               ))}

               <button onClick={handleAddQuestion} className="w-full py-3 border-2 border-dashed border-gray-700 text-gray-400 rounded-lg hover:border-gray-500 hover:text-white transition">
                  + Agregar otra pregunta
               </button>
            </div>

            <div className="p-4 border-t border-gray-700 bg-[#0f1115] rounded-b-xl flex justify-end gap-3">
               <Button variant="outline" onClick={() => setIsExamModalOpen(false)}>Cancelar</Button>
               <Button onClick={handleCreateExam} disabled={submitting}>
                  {submitting ? 'Guardando...' : '💾 Guardar Examen'}
               </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
