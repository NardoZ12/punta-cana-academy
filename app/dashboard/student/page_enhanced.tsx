'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client';

export default function StudentDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  
  // Datos
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [completedExams, setCompletedExams] = useState<any[]>([]);

  useEffect(() => {
    async function loadStudentData() {
      // 1. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener nombre del perfil
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profile) setStudentName(profile.full_name);

      // 2. Cargar cursos inscritos
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select(`
          progress, grade,
          courses ( id, title, image_url, description, modality )
        `)
        .eq('student_id', user.id);

      if (enrollData) setEnrollments(enrollData);

      // 3. Cargar Tareas y Exámenes de esos cursos
      const courseIds = enrollData?.map((e: any) => e.courses.id) || [];

      if (courseIds.length > 0) {
        // Tareas (Assignments)
        const { data: tasks } = await supabase
          .from('assignments')
          .select('*, courses(title)')
          .in('course_id', courseIds)
          // Ordenar por fecha más próxima
          .order('due_date', { ascending: true }); 
        
        if (tasks) setPendingTasks(tasks);

        // Exámenes (Exams)
        const { data: exams } = await supabase
          .from('exams')
          .select('*, courses(title)')
          .in('course_id', courseIds)
          // Solo mostrar exámenes futuros o de hoy (opcional, por ahora mostramos todos)
          .order('exam_date', { ascending: true });

        // Exámenes Completados (Submissions)
        const { data: examResults } = await supabase
          .from('exam_submissions')
          .select('*, exams(title, courses(title))')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });

        if (examResults) setCompletedExams(examResults);

        // Filtrar exámenes ya completados de la lista de próximos exámenes
        const completedExamIds = examResults?.map(result => result.exam_id) || [];
        const pendingExams = exams?.filter(exam => !completedExamIds.includes(exam.id)) || [];
        
        setUpcomingExams(pendingExams);
      }

      setLoading(false);
    }

    loadStudentData();

    // Escuchar eventos de enfoque de la ventana para recargar datos
    const handleFocus = () => {
      setLoading(true);
      loadStudentData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white animate-pulse">Cargando tu panel...</div>;

  // Calcular promedio general (cursos + exámenes)
  const courseGrades = enrollments.map(e => e.grade || 0);
  const examGrades = completedExams.map(e => e.score || 0);
  const allGrades = [...courseGrades, ...examGrades];
  
  const averageGrade = allGrades.length > 0 
    ? Math.round(allGrades.reduce((acc, curr) => acc + curr, 0) / allGrades.length) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pt-24">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-800 pb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Hola, {studentName.split(' ')[0] || 'Estudiante'} 👋
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Bienvenido a tu espacio de aprendizaje.</p>
          </div>
          
          {/* Tarjeta de Promedio */}
          <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex items-center gap-4 min-w-[200px]">
             <div className="p-3 bg-cyan-500/10 rounded-full">
                <span className="text-2xl">🏆</span>
             </div>
             <div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Promedio General</div>
                <div className={`text-3xl font-bold ${averageGrade >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {averageGrade}/100
                </div>
             </div>
          </div>
        </div>

        {/* SECCIÓN 1: LO URGENTE (Tareas y Exámenes) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- LISTA DE TAREAS --- */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-6 hover:border-blue-500/30 transition duration-300">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold flex items-center gap-2 text-blue-200">
                   📝 Tareas Pendientes 
                   {pendingTasks.length > 0 && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">{pendingTasks.length}</span>}
                 </h2>
               </div>
               
               <div className="space-y-3">
                 {pendingTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                       <p className="text-4xl mb-2">🎉</p>
                       <p>¡Estás al día! No hay tareas pendientes.</p>
                    </div>
                 ) : (
                    pendingTasks.map((task) => (
                      <div key={task.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-3 group">
                         <div className="flex justify-between items-start">
                            <div>
                               <h3 className="font-bold text-gray-200 group-hover:text-blue-400 transition">{task.title}</h3>
                               <p className="text-xs text-gray-400 mt-1">{task.courses.title}</p>
                            </div>
                            <div className="text-right">
                               <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded border border-gray-700 text-gray-300 block mb-1">
                                  📅 {new Date(task.due_date).toLocaleDateString()}
                               </span>
                               <span className="text-xs text-red-400 font-medium">Pendiente</span>
                            </div>
                         </div>
                         {/* Enlace al detalle de la tarea */}
                         <Link href={`/dashboard/student/assignment/${task.id}`}>
                            <Button variant="outline" fullWidth size="sm" className="hover:bg-blue-600 hover:text-white border-gray-700">
                               Ver detalles y Entregar
                            </Button>
                         </Link>
                      </div>
                    ))
                 )}
               </div>
            </div>

            {/* --- LISTA DE EXÁMENES --- */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-6 hover:border-purple-500/30 transition duration-300">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold flex items-center gap-2 text-purple-200">
                   ⏰ Próximos Exámenes
                   {upcomingExams.length > 0 && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">{upcomingExams.length}</span>}
                 </h2>
               </div>

               <div className="space-y-3">
                 {upcomingExams.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                       <p className="text-4xl mb-2">🧘‍♂️</p>
                       <p>Relájate, no tienes exámenes cerca.</p>
                    </div>
                 ) : (
                    upcomingExams.map((exam) => (
                      <div key={exam.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-3 group">
                         <div className="flex justify-between items-start">
                            <div>
                               <h3 className="font-bold text-gray-200 group-hover:text-purple-400 transition">{exam.title}</h3>
                               <p className="text-xs text-gray-400 mt-1">{exam.courses.title}</p>
                            </div>
                            <div className="text-right">
                               <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded border border-gray-700 text-purple-300 block mb-1">
                                  📅 {new Date(exam.exam_date).toLocaleDateString()}
                               </span>
                               <span className="text-xs text-gray-500">
                                  ⏱️ {exam.duration_minutes} min
                               </span>
                            </div>
                         </div>
                         {/* Enlace para TOMAR el examen */}
                         <Link href={`/dashboard/student/exam/${exam.id}`}>
                            <Button fullWidth size="sm" className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-lg shadow-purple-900/20">
                               Iniciar Examen
                            </Button>
                         </Link>
                      </div>
                    ))
                 )}
               </div>
            </div>

            {/* --- EXÁMENES COMPLETADOS --- */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-6 hover:border-green-500/30 transition duration-300">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold flex items-center gap-2 text-green-200">
                   🎓 Exámenes Completados
                   {completedExams.length > 0 && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">{completedExams.length}</span>}
                 </h2>
               </div>

               <div className="space-y-3 max-h-96 overflow-y-auto">
                 {completedExams.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                       <p className="text-4xl mb-2">📚</p>
                       <p>Aún no has completado exámenes.</p>
                    </div>
                 ) : (
                    completedExams.map((examResult) => (
                      <div key={examResult.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-3 group">
                         <div className="flex justify-between items-start">
                            <div className="flex-1">
                               <h3 className="font-bold text-gray-200 group-hover:text-green-400 transition">{examResult.exams.title}</h3>
                               <p className="text-xs text-gray-400 mt-1">{examResult.exams.courses.title}</p>
                            </div>
                            <div className="text-right">
                               <div className={`text-2xl font-bold mb-1 ${examResult.score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                                  {examResult.score}/100
                               </div>
                               <div className={`text-xs px-2 py-1 rounded-full ${examResult.score >= 70 ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                                  {examResult.score >= 70 ? '✅ Aprobado' : '❌ Reprobado'}
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>📅 {new Date(examResult.created_at).toLocaleDateString()}</span>
                            {examResult.score >= 70 ? (
                              <span className="text-green-400">🎉 ¡Felicitaciones!</span>
                            ) : (
                              <span className="text-yellow-400">💪 Sigue intentando</span>
                            )}
                         </div>
                      </div>
                    ))
                 )}
               </div>
            </div>
        </div>

        {/* SECCIÓN 2: MIS CURSOS */}
        <div>
            <h2 className="text-2xl font-bold mb-6 text-white border-l-4 border-cyan-500 pl-4">Mis Cursos Activos</h2>
            
            {enrollments.length === 0 ? (
               <div className="bg-gray-800 p-10 rounded-2xl text-center border border-dashed border-gray-700">
                  <p className="text-gray-400 text-lg mb-4">Aún no estás inscrito en ningún curso.</p>
                  <Link href="/cursos">
                     <Button>Explorar Catálogo</Button>
                  </Link>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrollments.map((enroll) => (
                     <div key={enroll.courses.id} className="group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition duration-300 flex flex-col h-full">
                        {/* Imagen del curso */}
                        <div className="h-40 bg-gray-800 relative overflow-hidden">
                           {enroll.courses.image_url ? (
                             <img src={enroll.courses.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500" />
                           ) : (
                             <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-4xl">📚</div>
                           )}
                           <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-white uppercase border border-white/10">
                              {enroll.courses.modality}
                           </div>
                        </div>

                        {/* Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                           <div>
                              <h3 className="font-bold text-lg mb-2 text-white line-clamp-1">{enroll.courses.title}</h3>
                              <div className="mb-4">
                                 <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Progreso</span>
                                    <span className="text-cyan-400">{enroll.progress}%</span>
                                 </div>
                                 <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${enroll.progress}%` }}></div>
                                 </div>
                              </div>
                           </div>
                           
                           <Link href={`/dashboard/student/course/${enroll.courses.id}`}>
                              <Button fullWidth variant="secondary" className="group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                                 Continuar Aprendiendo →
                              </Button>
                           </Link>
                        </div>
                     </div>
                  ))}
                  
                  {/* TARJETA PARA AGREGAR MÁS CURSOS */}
                  <Link href="/cursos">
                     <div className="group bg-gray-800/50 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-2xl h-full min-h-[320px] flex flex-col items-center justify-center transition duration-300 hover:bg-gray-800/70 cursor-pointer">
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">➕</div>
                        <h3 className="text-lg font-bold text-gray-300 group-hover:text-cyan-400 transition mb-2">Explorar Más Cursos</h3>
                        <p className="text-sm text-gray-500 text-center px-4">Descubre nuevas habilidades en nuestro catálogo</p>
                        <div className="mt-4">
                           <Button variant="outline" className="group-hover:bg-cyan-600 group-hover:border-cyan-600 group-hover:text-white transition-all">
                              Ver Catálogo
                           </Button>
                        </div>
                     </div>
                  </Link>
               </div>
            )}
        </div>

      </div>
    </div>
  );
}