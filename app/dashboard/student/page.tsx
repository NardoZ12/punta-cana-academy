'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  BookOpen,
  Clock,
  Trophy,
  ArrowRight,
  CheckCircle,
  FileQuestion,
  Calendar,
  GraduationCap,
  TrendingUp,
  Play,
  XCircle,
  Loader2
} from 'lucide-react';

interface Enrollment {
  progress: number;
  grade: number | null;
  courses: {
    id: string;
    title: string;
    image_url: string | null;
    description: string;
    modality: string;
  };
}

interface Task {
  id: string;
  title: string;
  due_date: string;
  courses: { title: string };
}

interface Exam {
  id: string;
  title: string;
  exam_date: string;
  duration_minutes: number;
  is_blocked?: boolean;
  courses: { title: string };
}

interface CompletedExam {
  id: string;
  score: number;
  created_at: string;
  exam_id: string;
  exams: {
    title: string;
    courses: { title: string };
  };
}

export default function StudentDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [completedExams, setCompletedExams] = useState<CompletedExam[]>([]);

  useEffect(() => {
    async function loadStudentData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile) setStudentName(profile.full_name);

      const { data: enrollData } = await supabase
        .from('enrollments')
        .select(`
          progress, grade,
          courses ( id, title, image_url, description, modality )
        `)
        .eq('student_id', user.id);

      if (enrollData) setEnrollments(enrollData as Enrollment[]);

      const courseIds = enrollData?.map((e: any) => e.courses.id) || [];

      if (courseIds.length > 0) {
        const { data: tasks } = await supabase
          .from('assignments')
          .select('*, courses(title)')
          .in('course_id', courseIds)
          .order('due_date', { ascending: true });
        
        if (tasks) setPendingTasks(tasks as Task[]);

        const { data: exams } = await supabase
          .from('exams')
          .select('*, courses(title)')
          .in('course_id', courseIds)
          .order('exam_date', { ascending: true });

        const { data: examResults } = await supabase
          .from('exam_submissions')
          .select('*, exams(title, courses(title))')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });

        if (examResults) setCompletedExams(examResults as CompletedExam[]);

        const completedExamIds = examResults?.map((result: any) => result.exam_id) || [];
        const pendingExams = exams?.filter((exam: any) => !completedExamIds.includes(exam.id)) || [];
        
        setUpcomingExams(pendingExams as Exam[]);
      }

      setLoading(false);
    }

    loadStudentData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-[#8b949e]">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  const courseGrades = enrollments.map(e => e.grade || 0);
  const examGrades = completedExams.map(e => e.score || 0);
  const allGrades = [...courseGrades, ...examGrades];
  const averageGrade = allGrades.length > 0 
    ? Math.round(allGrades.reduce((acc, curr) => acc + curr, 0) / allGrades.length) 
    : 0;

  const totalProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / enrollments.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#0f1115] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Dashboard</span>
            <h1 className="text-3xl font-bold text-white mt-1">
              Hola, {studentName.split(' ')[0] || 'Estudiante'}
            </h1>
            <p className="text-[#8b949e] mt-1">Bienvenido a tu espacio de aprendizaje.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{enrollments.length}</p>
            <p className="text-sm text-[#8b949e]">Cursos Activos</p>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{totalProgress}%</p>
            <p className="text-sm text-[#8b949e]">Progreso Promedio</p>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <p className={`text-2xl font-bold ${averageGrade >= 70 ? 'text-green-400' : 'text-amber-400'}`}>
              {averageGrade}/100
            </p>
            <p className="text-sm text-[#8b949e]">Promedio General</p>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{completedExams.length}</p>
            <p className="text-sm text-[#8b949e]">Examenes Completados</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pending Tasks */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Tareas Pendientes
              </h2>
              {pendingTasks.length > 0 && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-medium">
                  {pendingTasks.length}
                </span>
              )}
            </div>
            
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-10 w-10 text-green-400/50 mx-auto mb-2" />
                  <p className="text-[#8b949e] text-sm">¡Estas al día! No hay tareas pendientes.</p>
                </div>
              ) : (
                pendingTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    href={`/dashboard/student/assignment/${task.id}`}
                    className="block bg-[#21262d] rounded-lg p-4 hover:bg-[#30363d] transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm group-hover:text-cyan-400 transition-colors truncate">
                          {task.title}
                        </h3>
                        <p className="text-xs text-[#8b949e] mt-1 truncate">{task.courses.title}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-xs text-[#8b949e] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-purple-400" />
                Proximos Examenes
              </h2>
              {upcomingExams.length > 0 && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-medium">
                  {upcomingExams.length}
                </span>
              )}
            </div>
            
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {upcomingExams.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-10 w-10 text-green-400/50 mx-auto mb-2" />
                  <p className="text-[#8b949e] text-sm">No tienes examenes pendientes.</p>
                </div>
              ) : (
                upcomingExams.slice(0, 5).map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-[#21262d] rounded-lg p-4 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm truncate">
                          {exam.title}
                        </h3>
                        <p className="text-xs text-[#8b949e] mt-1 truncate">{exam.courses.title}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-xs text-[#8b949e] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {exam.duration_minutes} min
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/student/exam/${exam.id}`}
                      className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        exam.is_blocked
                          ? 'bg-[#30363d] text-[#8b949e] cursor-not-allowed'
                          : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                      }`}
                    >
                      {exam.is_blocked ? 'Bloqueado' : (
                        <>
                          <Play className="h-3 w-3" />
                          Iniciar Examen
                        </>
                      )}
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Exams */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Resultados de Examenes
              </h2>
              {completedExams.length > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full font-medium">
                  {completedExams.length}
                </span>
              )}
            </div>
            
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {completedExams.length === 0 ? (
                <div className="text-center py-8">
                  <FileQuestion className="h-10 w-10 text-[#8b949e]/50 mx-auto mb-2" />
                  <p className="text-[#8b949e] text-sm">Aun no has completado examenes.</p>
                </div>
              ) : (
                completedExams.slice(0, 5).map((result) => (
                  <div
                    key={result.id}
                    className="bg-[#21262d] rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm truncate">
                          {result.exams.title}
                        </h3>
                        <p className="text-xs text-[#8b949e] mt-1 truncate">{result.exams.courses.title}</p>
                        <p className="text-xs text-[#8b949e] mt-2">
                          {new Date(result.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className={`text-xl font-bold ${result.score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                          {result.score}
                        </p>
                        <span className={`text-xs flex items-center justify-end gap-1 mt-1 ${result.score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                          {result.score >= 70 ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Aprobado
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Reprobado
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* My Courses Section */}
        <div id="courses">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Mis Cursos</h2>
            <Link
              href="/cursos"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              Ver catalogo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
              <BookOpen className="h-12 w-12 text-[#8b949e]/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aun no estas inscrito en ningun curso</h3>
              <p className="text-[#8b949e] mb-6">Explora nuestro catalogo y comienza a aprender hoy.</p>
              <Link
                href="/cursos"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
              >
                Explorar Cursos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {enrollments.map((enroll) => (
                <Link
                  key={enroll.courses.id}
                  href={`/dashboard/student/course/${enroll.courses.id}`}
                  className="group bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all"
                >
                  {/* Course Image */}
                  <div className="h-36 bg-[#21262d] relative overflow-hidden">
                    {enroll.courses.image_url ? (
                      <img 
                        src={enroll.courses.image_url} 
                        alt={enroll.courses.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#21262d] to-[#161b22] flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-[#8b949e]/50" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-black/60 backdrop-blur-sm text-white border border-white/10 uppercase">
                        {enroll.courses.modality}
                      </span>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="p-5">
                    <h3 className="font-semibold text-white text-base mb-3 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                      {enroll.courses.title}
                    </h3>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#8b949e]">Progreso</span>
                        <span className="text-cyan-400 font-medium">{enroll.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all"
                          style={{ width: `${enroll.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Grade if available */}
                    {enroll.grade !== null && (
                      <div className="flex items-center justify-between pt-3 border-t border-[#30363d]">
                        <span className="text-xs text-[#8b949e]">Calificacion</span>
                        <span className={`text-sm font-bold ${enroll.grade >= 70 ? 'text-green-400' : 'text-amber-400'}`}>
                          {enroll.grade}/100
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}

              {/* Add Course Card */}
              <Link
                href="/cursos"
                className="group flex flex-col items-center justify-center min-h-[280px] bg-[#161b22] border-2 border-dashed border-[#30363d] rounded-xl hover:border-cyan-500/50 transition-all p-6"
              >
                <div className="w-14 h-14 bg-[#21262d] rounded-full flex items-center justify-center mb-4 group-hover:bg-cyan-500/10 transition-colors">
                  <BookOpen className="h-6 w-6 text-[#8b949e] group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="font-medium text-white mb-1 group-hover:text-cyan-400 transition-colors">
                  Explorar Mas Cursos
                </h3>
                <p className="text-sm text-[#8b949e] text-center">
                  Descubre nuevas habilidades
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
