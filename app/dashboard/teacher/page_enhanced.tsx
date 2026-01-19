'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
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

interface TeacherStats {
  totalStudents: number;
  totalCourses: number;
  averageGrade: number;
  completedExams: number;
  pendingAssignments: number;
}

interface Question {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correct: string; // 'a', 'b', or 'c'
}

export default function TeacherDashboard() {
  const supabase = createClient();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    totalCourses: 0,
    averageGrade: 0,
    completedExams: 0,
    pendingAssignments: 0
  });

  // Estados para datos en tiempo real
  const [recentExamResults, setRecentExamResults] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);

  // --- ESTADOS PARA MODALES ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- DATOS DE FORMULARIOS ---
  const [taskData, setTaskData] = useState({ title: '', description: '', date: '' });
  
  // Datos del Examen (Ahora incluye array de preguntas)
  const [examData, setExamData] = useState({ title: '', date: '', duration: 60 });
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', optionA: '', optionB: '', optionC: '', correct: 'a' }
  ]);

  useEffect(() => {
    async function loadTeacherData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('No autenticado'); return; }

        // Obtener información del perfil del profesor
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile) setTeacherName(profile.full_name);

        // Cargar cursos del profesor con estudiantes
        const { data: coursesData } = await supabase
          .from('courses')
          .select(`
            id, title, description, image_url, created_at,
            enrollments (
              progress, grade,
              profiles:student_id ( id, full_name, email )
            )
          `)
          .eq('teacher_id', user.id);

        if (coursesData) {
          setCourses(coursesData);
          if (coursesData.length > 0) setSelectedCourseId(coursesData[0].id);
          
          // Calcular estadísticas
          const totalStudents = coursesData.reduce((acc, course) => acc + course.enrollments.length, 0);
          const allGrades = coursesData.flatMap(course => 
            course.enrollments.map(enrollment => enrollment.grade || 0)
          ).filter(grade => grade > 0);
          const averageGrade = allGrades.length > 0 
            ? Math.round(allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length)
            : 0;

          setStats(prev => ({
            ...prev,
            totalStudents,
            totalCourses: coursesData.length,
            averageGrade
          }));
        }

        // Cargar resultados de exámenes recientes
        const { data: examResults } = await supabase
          .from('exam_submissions')
          .select(`
            *, 
            exams(title, courses(title, teacher_id)),
            profiles(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        const teacherExamResults = examResults?.filter(result => 
          result.exams?.courses?.teacher_id === user.id
        ) || [];
        
        setRecentExamResults(teacherExamResults);
        setStats(prev => ({ ...prev, completedExams: teacherExamResults.length }));

        // Cargar tareas pendientes
        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map(course => course.id);
          const { data: assignments } = await supabase
            .from('assignments')
            .select('*, courses(title)')
            .in('course_id', courseIds)
            .gte('due_date', new Date().toISOString())
            .order('due_date', { ascending: true });

          if (assignments) {
            setPendingAssignments(assignments);
            setStats(prev => ({ ...prev, pendingAssignments: assignments.length }));
          }
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadTeacherData();

    // Auto-refresh en focus
    const handleFocus = () => loadTeacherData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // --- LÓGICA DE PREGUNTAS ---
  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', optionA: '', optionB: '', optionC: '', correct: 'a' }]);
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  // --- GUARDAR TAREA ---
  const handleCreateTask = async () => {
    if (!selectedCourseId || !taskData.title) return alert('Datos incompletos');
    setSubmitting(true);
    
    const { error } = await supabase.from('assignments').insert({
      course_id: selectedCourseId,
      title: taskData.title,
      description: taskData.description,
      due_date: taskData.date
    });

    setSubmitting(false);
    if (error) alert(error.message);
    else {
      alert('✅ Tarea asignada!');
      setIsTaskModalOpen(false);
      setTaskData({ title: '', description: '', date: '' });
      // Reload data
      window.location.reload();
    }
  };

  // --- GUARDAR EXAMEN ---
  const handleCreateExam = async () => {
    if (!selectedCourseId || !examData.title) return alert('Faltan datos del examen');
    setSubmitting(true);

    const { data: newExam, error: examError } = await supabase
      .from('exams')
      .insert({
        course_id: selectedCourseId,
        title: examData.title,
        description: `Examen de ${questions.length} preguntas`,
        exam_date: examData.date,
        duration_minutes: examData.duration
      })
      .select()
      .single();

    if (examError || !newExam) {
      alert('Error creando examen: ' + examError?.message);
      setSubmitting(false);
      return;
    }

    const questionsToInsert = questions.map(q => ({
      exam_id: newExam.id,
      question_text: q.text,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      correct_option: q.correct
    }));

    const { error: questionsError } = await supabase.from('exam_questions').insert(questionsToInsert);

    setSubmitting(false);
    
    if (questionsError) {
      alert('El examen se creó pero hubo error guardando las preguntas.');
    } else {
      alert('✅ Examen y preguntas guardados correctamente!');
      setIsExamModalOpen(false);
      setExamData({ title: '', date: '', duration: 60 });
      setQuestions([{ text: '', optionA: '', optionB: '', optionC: '', correct: 'a' }]);
      window.location.reload();
    }
  };

  const currentCourse = courses.find(c => c.id === selectedCourseId);
  const students = currentCourse?.enrollments || [];

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white animate-pulse">Cargando panel del profesor...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER CON ESTADÍSTICAS */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Hola, Prof. {teacherName.split(' ')[0] || 'Docente'} 👨‍🏫
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Panel de control y gestión académica</p>
          </div>

          {/* ESTADÍSTICAS RÁPIDAS */}
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
              <div className="text-2xl font-bold">{stats.completedExams}</div>
              <div className="text-xs text-orange-200">Exámenes</div>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN DE CURSOS */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            📚 Mis Cursos
            <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">{courses.length}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`text-left p-4 rounded-xl transition-all duration-200 ${
                  selectedCourseId === course.id
                    ? 'bg-blue-600/20 border-2 border-blue-500'
                    : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {course.title.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{course.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{course.enrollments.length} estudiantes</span>
                      {selectedCourseId === course.id && (
                        <Link href={`/dashboard/teacher/course/${course.id}/edit`}>
                          <span className="text-xs text-blue-400 hover:underline">✏️ Editar</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            {/* Botón para crear nuevo curso */}
            <Link href="/dashboard/teacher/create-course">
              <div className="border-2 border-dashed border-gray-600 hover:border-blue-500/50 rounded-xl p-4 h-full flex flex-col items-center justify-center text-center transition-all">
                <div className="text-3xl mb-2">➕</div>
                <div className="text-sm font-semibold text-gray-400 hover:text-blue-400">Crear Nuevo Curso</div>
              </div>
            </Link>
          </div>

          {selectedCourseId && (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setIsTaskModalOpen(true)}>
                📝 Asignar Tarea
              </Button>
              <Button onClick={() => setIsExamModalOpen(true)}>
                ⏰ Crear Examen
              </Button>
            </div>
          )}
        </div>

        {/* LAYOUT DE 3 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA 1: ESTUDIANTES DEL CURSO ACTUAL */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-4">
                👥 Estudiantes de {currentCourse?.title || 'Curso Seleccionado'}
              </h2>
              
              {students.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-2">🎓</p>
                  <p>No hay estudiantes inscritos en este curso.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-700">
                  <table className="w-full">
                    <thead className="bg-gray-900 text-xs uppercase text-gray-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Estudiante</th>
                        <th className="px-4 py-3 text-center">Progreso</th>
                        <th className="px-4 py-3 text-center">Nota</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {students.map((student, idx) => (
                        <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-white">{student.profiles?.full_name}</div>
                              <div className="text-xs text-gray-500">{student.profiles?.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-16 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${student.progress}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-xs text-blue-400">{student.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-bold ${student.grade >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {student.grade || 0}/100
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link 
                              href={`/dashboard/teacher/student/${student.profiles?.id}`}
                              className="text-blue-400 text-sm hover:underline"
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

          {/* COLUMNA 2: ACTIVIDAD RECIENTE */}
          <div className="space-y-6">
            
            {/* Resultados de Exámenes Recientes */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-4 text-green-200">
                🎯 Exámenes Recientes
              </h3>
              
              <div className="space-y-3">
                {recentExamResults.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-3xl mb-2">📋</p>
                    <p className="text-sm">No hay resultados recientes</p>
                  </div>
                ) : (
                  recentExamResults.slice(0, 5).map((result, idx) => (
                    <div key={idx} className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-white">{result.profiles?.full_name}</div>
                          <div className="text-xs text-gray-400">{result.exams?.title}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${result.score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                            {result.score}/100
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${result.score >= 70 ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                            {result.score >= 70 ? '✅ Aprobado' : '❌ Reprobado'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tareas Pendientes */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-6">
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
                  pendingAssignments.slice(0, 4).map((assignment, idx) => (
                    <div key={idx} className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                      <div className="font-semibold text-sm text-white">{assignment.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{assignment.courses?.title}</div>
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

      {/* --- MODAL TAREA --- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">📝 Asignar Tarea</h2>
            <input type="text" placeholder="Título" className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-3 text-white"
              value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
            <textarea placeholder="Instrucciones" className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-3 text-white"
              value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
            <input type="datetime-local" className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-4 text-white"
              value={taskData.date} onChange={e => setTaskData({...taskData, date: e.target.value})} />
            <div className="flex gap-2">
               <Button fullWidth onClick={handleCreateTask} disabled={submitting}>
                 {submitting ? 'Guardando...' : 'Guardar'}
               </Button>
               <Button variant="outline" fullWidth onClick={() => setIsTaskModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EXAMEN --- */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            
            {/* Cabecera Modal */}
            <div className="p-6 border-b border-gray-700 bg-gray-900 rounded-t-xl">
               <h2 className="text-2xl font-bold text-white mb-4">⏰ Crear Nuevo Examen</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Título del Examen</label>
                    <input type="text" placeholder="Título del Examen" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                       value={examData.title} onChange={e => setExamData({...examData, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fecha del Examen</label>
                    <input type="datetime-local" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                       value={examData.date} onChange={e => setExamData({...examData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Duración (minutos)</label>
                    <input type="number" placeholder="60" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                       value={examData.duration} onChange={e => setExamData({...examData, duration: parseInt(e.target.value)})} />
                  </div>
               </div>
            </div>

            {/* Cuerpo Scrollable (Preguntas) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-900/50">
               {questions.map((q, idx) => (
                 <div key={idx} className="bg-gray-800 border border-gray-700 p-4 rounded-lg relative group">
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
                    
                    <input type="text" placeholder="Escribe la pregunta aquí..." className="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-3 font-medium text-white"
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

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-xl flex justify-end gap-3">
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