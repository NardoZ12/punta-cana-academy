'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client';
import { UserMenu } from '@/components/molecules/UserMenu';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
  enrollments: {
    progress: number;
    grade: number;
    student_id: string; // Necesitamos el ID para cruzar datos
    profiles: {
      id: string;
      full_name: string;
      email: string;
    };
  }[];
}

// Interfaz para las preguntas del examen
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
  const [allCourses, setAllCourses] = useState<Course[]>([]); // NUEVO: Todos los cursos disponibles
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Guardamos las notas de exámenes por estudiante: { "student_id": 80 }
  const [courseExamGrades, setCourseExamGrades] = useState<Record<string, number>>({});
  
  // Lista de exámenes del curso actual
  const [courseExams, setCourseExams] = useState<any[]>([]);

  // --- ESTADOS PARA MODALES ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isExamListModalOpen, setIsExamListModalOpen] = useState(false);
  const [isAllCoursesModalOpen, setIsAllCoursesModalOpen] = useState(false); // NUEVO: Modal para todos los cursos
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
        setCurrentUser(user);

        // Cargar cursos asignados al maestro
        const { data: myCourses } = await supabase
          .from('courses')
          .select(`
            id, title, description, image_url, created_at,
            enrollments (
              progress, grade, student_id,
              profiles:student_id ( id, full_name, email )
            )
          `)
          .eq('teacher_id', user.id);

        // Cargar TODOS los cursos activos para auto-asignación
        const { data: allActiveCourses } = await supabase
          .from('courses')
          .select(`
            id, title, description, image_url, created_at, teacher_id,
            profiles:teacher_id ( id, full_name, email )
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        setCourses(myCourses || []);
        setAllCourses(allActiveCourses || []);
        if (myCourses && myCourses.length > 0) setSelectedCourseId(myCourses[0].id);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTeacherData();
  }, []);

  // Efecto secundario: Cargar notas de exámenes cuando cambia el curso seleccionado
  useEffect(() => {
    async function fetchCourseExams() {
      if (!selectedCourseId) return;

      // Buscar todos los exámenes de este curso con información completa
      const { data: exams } = await supabase
        .from('exams')
        .select('id, title, exam_date, duration_minutes, is_blocked, created_at')
        .eq('course_id', selectedCourseId)
        .order('created_at', { ascending: false });
      
      setCourseExams(exams || []);
      
      if (!exams || exams.length === 0) {
        setCourseExamGrades({}); 
        return;
      }
      
      const examIds = exams.map(e => e.id);

      // Buscar las entregas de esos exámenes
      const { data: submissions } = await supabase
        .from('exam_submissions')
        .select('student_id, score')
        .in('exam_id', examIds)
        .order('created_at', { ascending: false }); // Traer los más recientes primero

      // Crear mapa de notas { estudiante: nota }
      const gradesMap: Record<string, number> = {};
      submissions?.forEach(sub => {
        // Solo guardamos la primera que encontramos (la más reciente) si no existe ya
        if (gradesMap[sub.student_id] === undefined) {
          gradesMap[sub.student_id] = sub.score;
        }
      });
      
      setCourseExamGrades(gradesMap);
    }
    fetchCourseExams();
  }, [selectedCourseId]);

  // --- LÓGICA DE PREGUNTAS (Añadir/Editar) ---
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
    }
  };

  // --- GUARDAR EXAMEN (COMPLEJO) ---
  const handleCreateExam = async () => {
    if (!selectedCourseId || !examData.title) return alert('Faltan datos del examen');
    setSubmitting(true);

    // 1. Crear el Examen (Cabecera)
    const { data: newExam, error: examError } = await supabase
      .from('exams')
      .insert({
        course_id: selectedCourseId,
        title: examData.title,
        description: `Examen de ${questions.length} preguntas`, // Descripción automática
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

    // 2. Crear las Preguntas vinculadas al examen
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
      // Resetear formulario
      setExamData({ title: '', date: '', duration: 60 });
      setQuestions([{ text: '', optionA: '', optionB: '', optionC: '', correct: 'a' }]);
    }
  };

  // --- FUNCIONES PARA GESTIÓN DE EXÁMENES ---
  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (!confirm(`¿Estás seguro de eliminar el examen "${examTitle}"? Esta acción no se puede deshacer.`)) return;
    
    setSubmitting(true);
    
    // Primero eliminar las preguntas del examen
    await supabase.from('exam_questions').delete().eq('exam_id', examId);
    
    // Luego eliminar las submisiones
    await supabase.from('exam_submissions').delete().eq('exam_id', examId);
    
    // Finalmente eliminar el examen
    const { error } = await supabase.from('exams').delete().eq('id', examId);
    
    if (error) {
      alert('Error al eliminar examen: ' + error.message);
    } else {
      alert('✅ Examen eliminado correctamente');
      // Recargar la lista
      const { data: exams } = await supabase
        .from('exams')
        .select('id, title, exam_date, duration_minutes, is_blocked, created_at')
        .eq('course_id', selectedCourseId)
        .order('created_at', { ascending: false });
      setCourseExams(exams || []);
    }
    
    setSubmitting(false);
  };

  const handleToggleExamBlock = async (examId: string, currentStatus: boolean) => {
    setSubmitting(true);
    
    const { error } = await supabase
      .from('exams')
      .update({ is_blocked: !currentStatus })
      .eq('id', examId);
    
    if (error) {
      alert('Error al cambiar estado: ' + error.message);
    } else {
      // Actualizar la lista local
      setCourseExams(prev => prev.map(exam => 
        exam.id === examId ? { ...exam, is_blocked: !currentStatus } : exam
      ));
    }
    
    setSubmitting(false);
  };

  // --- NUEVA FUNCIÓN: AUTO-ASIGNARSE UN CURSO ---
  const handleSelfAssignCourse = async (courseId: string) => {
    if (!currentUser) return;
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from('courses')
      .update({ teacher_id: currentUser.id })
      .eq('id', courseId);
    
    if (error) {
      alert('Error al auto-asignarse al curso: ' + error.message);
    } else {
      alert('✅ Te has asignado al curso exitosamente!');
      setIsAllCoursesModalOpen(false);
      
      // Recargar datos
      const { data: myCourses } = await supabase
        .from('courses')
        .select(`
          id, title, description, image_url, created_at,
          enrollments (
            progress, grade, student_id,
            profiles:student_id ( id, full_name, email )
          )
        `)
        .eq('teacher_id', currentUser.id);
      
      const { data: allActiveCourses } = await supabase
        .from('courses')
        .select(`
          id, title, description, image_url, created_at, teacher_id,
          profiles:teacher_id ( id, full_name, email )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      setCourses(myCourses || []);
      setAllCourses(allActiveCourses || []);
      
      // Seleccionar el nuevo curso
      setSelectedCourseId(courseId);
    }
    
    setSubmitting(false);
  };

  const currentCourse = courses.find(c => c.id === selectedCourseId);
  const students = currentCourse?.enrollments || [];

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>;

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
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Mis Cursos ({courses.length})
              </div>

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
                          <Button variant="secondary" fullWidth className="text-xs py-2 mt-2">
                            ✏️ Editar Contenido
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-gray-600 space-y-2">
                <Link href="/dashboard/teacher/create-course">
                  <Button variant="outline" fullWidth className="text-sm">+ Crear Nuevo Curso</Button>
                </Link>
                
                <Button 
                  variant="secondary" 
                  fullWidth 
                  className="text-sm relative"
                  onClick={() => setIsAllCoursesModalOpen(true)}
                >
                  📚 Ver Todos los Cursos
                  {allCourses.filter(c => !c.teacher_id).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {allCourses.filter(c => !c.teacher_id).length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="ml-80 flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Dashboard del Profesor</h1>
                <p className="text-gray-400">{currentCourse?.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setIsTaskModalOpen(true)}>Asignar Tarea</Button>
                <Button variant="outline" onClick={() => setIsExamListModalOpen(true)}>Gestionar Exámenes</Button>
                <Button onClick={() => setIsExamModalOpen(true)}>Crear Examen</Button>
                <UserMenu userType="teacher" />
              </div>
            </div>

            {/* TABLA DE ESTUDIANTES */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50">
                  <h2 className="font-semibold">Lista de Estudiantes</h2>
               </div>
               <table className="min-w-full divide-y divide-gray-700">
                 <thead className="bg-gray-900 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-6 py-3 text-left">Estudiante</th>
                      <th className="px-6 py-3 text-left">Progreso</th>
                      <th className="px-6 py-3 text-center">Nota Global</th>
                      <th className="px-6 py-3 text-center text-red-300">Examen Reciente</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-700">
                    {students.map((st, i) => (
                      <tr key={i} className="hover:bg-gray-700/30">
                         <td className="px-6 py-4">
                            <div className="font-medium text-white">{st.profiles?.full_name}</div>
                            <div className="text-sm text-gray-500">{st.profiles?.email}</div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="w-24 bg-gray-700 rounded-full h-1.5 mt-1">
                               <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${st.progress}%` }}></div>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-center font-mono font-bold text-green-400">
                            {st.grade || 0}/100
                         </td>
                         <td className="px-6 py-4 text-center">
                            {/* AQUÍ MOSTRAMOS LA NOTA DEL EXAMEN 🎯 */}
                            {courseExamGrades[st.student_id] !== undefined ? (
                               <span className={`px-2 py-1 rounded text-xs font-bold ${courseExamGrades[st.student_id] >= 70 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                  {courseExamGrades[st.student_id]} pts
                               </span>
                            ) : (
                               <span className="text-gray-600 text-xs">--</span>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <Link href={`/dashboard/teacher/student/${st.profiles?.id}`} className="text-cyan-400 text-sm hover:underline">Ver detalles</Link>
                         </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
               {students.length === 0 && <div className="p-8 text-center text-gray-500">No hay estudiantes inscritos.</div>}
            </div>
          </div>
        </main>
      </div>

      {/* --- MODAL TAREA --- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">📝 Asignar Tarea</h2>
            <input type="text" placeholder="Título" className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-3"
              value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
            <textarea placeholder="Instrucciones" className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-3"
              value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
            <input type="datetime-local" className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-4"
              value={taskData.date} onChange={e => setTaskData({...taskData, date: e.target.value})} />
            <div className="flex gap-2">
               <Button fullWidth onClick={handleCreateTask} disabled={submitting}>Guardar</Button>
               <Button variant="outline" fullWidth onClick={() => setIsTaskModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EXAMEN (NUEVO DISEÑO) --- */}
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
                    
                    <input type="text" placeholder="Escribe la pregunta aquí..." className="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-3 font-medium"
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
                               className="bg-transparent border-none outline-none w-full text-sm"
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

      {/* --- MODAL GESTIONAR EXÁMENES --- */}
      {isExamListModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            
            {/* Cabecera Modal */}
            <div className="p-6 border-b border-gray-700 bg-gray-900 rounded-t-xl">
               <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-white">📋 Gestionar Exámenes</h2>
                 <span className="text-gray-400 text-sm">{courseExams.length} exámenes</span>
               </div>
               <p className="text-gray-400 mt-2">Curso: {currentCourse?.title}</p>
            </div>

            {/* Cuerpo Scrollable (Lista de Exámenes) */}
            <div className="flex-1 overflow-y-auto p-6">
               {courseExams.length === 0 ? (
                 <div className="text-center py-12 text-gray-500">
                   <div className="text-6xl mb-4">📝</div>
                   <p className="text-xl font-semibold mb-2">No hay exámenes creados</p>
                   <p>Crea tu primer examen para empezar a evaluar</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {courseExams.map((exam) => (
                     <div key={exam.id} className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                       <div className="flex justify-between items-start mb-4">
                         <div className="flex-1">
                           <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                             {exam.title}
                             {exam.is_blocked && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">BLOQUEADO</span>}
                           </h3>
                           <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                             <span>⏱️ {exam.duration_minutes} min</span>
                             {exam.exam_date && (
                               <span>📅 {new Date(exam.exam_date).toLocaleDateString('es-ES', { 
                                 day: '2-digit', month: '2-digit', year: 'numeric',
                                 hour: '2-digit', minute: '2-digit'
                               })}</span>
                             )}
                             <span>📝 Creado el {new Date(exam.created_at).toLocaleDateString('es-ES')}</span>
                           </div>
                         </div>
                         
                         <div className="flex gap-2 ml-4">
                           <button
                             onClick={() => handleToggleExamBlock(exam.id, exam.is_blocked)}
                             disabled={submitting}
                             className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                               exam.is_blocked 
                                 ? 'bg-green-600 hover:bg-green-700 text-white' 
                                 : 'bg-orange-600 hover:bg-orange-700 text-white'
                             }`}
                           >
                             {exam.is_blocked ? '🔓 Desbloquear' : '🔒 Bloquear'}
                           </button>
                           
                           <button
                             onClick={() => handleDeleteExam(exam.id, exam.title)}
                             disabled={submitting}
                             className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors"
                           >
                             🗑️ Eliminar
                           </button>
                         </div>
                       </div>
                       
                       <div className="text-xs text-gray-500">
                         ID: {exam.id}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-xl flex justify-between items-center">
               <Button variant="secondary" onClick={() => setIsExamModalOpen(true)}>
                  ➕ Crear Nuevo Examen
               </Button>
               <Button variant="outline" onClick={() => setIsExamListModalOpen(false)}>
                  Cerrar
               </Button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL TODOS LOS CURSOS DISPONIBLES --- */}
      {isAllCoursesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 bg-gray-900 rounded-t-xl">
              <h2 className="text-xl font-bold">📚 Catálogo Completo de Cursos</h2>
              <p className="text-gray-400 text-sm mt-1">
                Puedes auto-asignarte a cualquier curso sin maestro o tomar control de cursos existentes
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Disponible para asignarte
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  Tiene maestro asignado
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Tu curso actual
                </span>
              </div>
            </div>

            <div className="p-6">
              {allCourses.length === 0 ? (
                <p className="text-gray-400 text-center">No hay cursos disponibles en este momento.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allCourses.map((course: any) => {
                    const isMyOwnCourse = course.teacher_id === currentUser?.id;
                    const hasTeacher = course.teacher_id && !isMyOwnCourse;
                    
                    return (
                      <div 
                        key={course.id} 
                        className={`rounded-lg p-4 border transition-all hover:shadow-lg ${
                          isMyOwnCourse 
                            ? 'bg-blue-900/30 border-blue-500' 
                            : hasTeacher 
                              ? 'bg-orange-900/20 border-orange-700' 
                              : 'bg-gray-900 border-gray-700 hover:border-green-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${
                            isMyOwnCourse 
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                              : hasTeacher 
                                ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                                : 'bg-gradient-to-br from-green-500 to-green-600'
                          }`}>
                            {course.title.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-white">{course.title}</h3>
                              {isMyOwnCourse && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">MÍO</span>}
                              {hasTeacher && !isMyOwnCourse && <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">OCUPADO</span>}
                              {!hasTeacher && !isMyOwnCourse && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">LIBRE</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                            
                            <div className="mt-3">
                              {isMyOwnCourse ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-blue-400 text-xs font-semibold">✅ Este es tu curso</span>
                                  <Link href={`/dashboard/teacher/course/${course.id}/edit`}>
                                    <Button variant="outline" size="sm" className="text-xs">
                                      ✏️ Editar
                                    </Button>
                                  </Link>
                                </div>
                              ) : hasTeacher ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-orange-400 text-xs">
                                    👨‍🏫 {course.profiles?.full_name || 'Maestro asignado'}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs hover:bg-orange-600 hover:border-orange-600"
                                    onClick={() => {
                                      if (confirm(`¿Estás seguro que quieres tomar control del curso "${course.title}"?\n\nEl maestro actual (${course.profiles?.full_name || 'Maestro asignado'}) perderá acceso.`)) {
                                        handleSelfAssignCourse(course.id);
                                      }
                                    }}
                                    disabled={submitting}
                                  >
                                    🔄 Tomar Control
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="text-xs bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 w-full"
                                  onClick={() => handleSelfAssignCourse(course.id)}
                                  disabled={submitting}
                                >
                                  ✨ Auto-asignarme a este curso
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-xl flex justify-end">
              <Button variant="outline" onClick={() => setIsAllCoursesModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}