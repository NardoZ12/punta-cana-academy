'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Plus, 
  ChevronRight,
  BarChart3,
  FileText,
  GraduationCap,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Target,
  Award
} from 'lucide-react';

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

interface Stats {
  totalStudents: number;
  totalCourses: number;
  averageGrade: number;
  passRate: number;
  pendingAssignments: number;
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
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalCourses: 0,
    averageGrade: 0,
    passRate: 0,
    pendingAssignments: 0
  });

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

  useEffect(() => {
    if (!selectedCourseId) return;
    
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

      const enriched = enrollmentsData.map(e => ({
        ...e,
        profiles: profiles?.find(p => p.id === e.student_id)
      }));

      setEnrollments(enriched);
      setStudents(profiles || []);

      // Calcular stats
      if (enriched.length > 0) {
        const grades = enriched.map(e => e.grade || 0);
        const avg = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
        const passed = grades.filter(g => g >= 70).length;
        const passRate = Math.round((passed / grades.length) * 100);

        setStats(prev => ({
          ...prev,
          averageGrade: avg,
          passRate: passRate
        }));
      }
    }

    loadCourseDetails();
  }, [selectedCourseId]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', optionA: '', optionB: '', optionC: '', correct: 'a' }]);
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], [field]: value };
    setQuestions(newQ);
  };

  const handleCreateTask = async () => {
    if (!selectedCourseId || !taskData.title) return alert('Complete todos los campos');
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

    if (targetStudentId !== 'all') {
      payload.student_id = targetStudentId;
    }

    const { error } = await supabase.from('assignments').insert(payload);

    setSubmitting(false);
    if (error) alert(error.message);
    else {
      alert(`✓ Tarea asignada correctamente`);
      setIsTaskModalOpen(false);
      setTaskData({ title: '', description: '', date: '' });
      setTargetStudentId('all');
      window.location.reload();
    }
  };

  const handleCreateExam = async () => {
    if (!selectedCourseId || !examData.title) return alert('Complete todos los campos');
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
      description: `Examen - ${questions.length} preguntas`,
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
      alert('Error: ' + error.message);
    } else {
      alert(`✓ Examen creado correctamente`);
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
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm">Cargando panel de profesor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="bg-[#0a0f1a] border border-gray-800 p-8 rounded-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-24">
        
        {/* HEADER */}
        <header className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-cyan-400 text-sm font-medium tracking-wide uppercase mb-1">Panel de Control</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                Hola, Prof. {teacherName.split(' ')[0]}
              </h1>
              <p className="text-gray-500 mt-2">Gestiona tus cursos y estudiantes</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-500">Estudiantes</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.totalStudents}</p>
              </div>
              <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-500">Cursos</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.totalCourses}</p>
              </div>
              <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-500">Promedio</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.averageGrade}%</p>
              </div>
              <div className="bg-[#0a0f1a] border border-gray-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-500">Tareas</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.pendingAssignments}</p>
              </div>
            </div>
          </div>
        </header>

        {/* CURSOS */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Mis Cursos
            </h2>
            <Link 
              href="/dashboard/teacher/create-course"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Curso
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`text-left p-4 rounded-xl transition-all duration-200 ${
                  selectedCourseId === course.id
                    ? 'bg-cyan-500/10 border-2 border-cyan-500'
                    : 'bg-[#0a0f1a] border border-gray-800/50 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                    {course.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{course.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{course.description}</p>
                    {selectedCourseId === course.id && (
                      <Link 
                        href={`/dashboard/teacher/course/${course.id}/edit`}
                        className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-flex items-center gap-1"
                      >
                        Editar curso <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Acciones del curso */}
          {selectedCourseId && (
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2 bg-[#0a0f1a] border border-gray-800 hover:border-cyan-500/50 text-white px-4 py-2.5 rounded-lg transition-colors text-sm"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                Asignar Tarea
              </button>
              <button 
                onClick={() => setIsExamModalOpen(true)}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
              >
                <Clock className="w-4 h-4" />
                Crear Examen
              </button>
            </div>
          )}
        </section>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ESTUDIANTES */}
          <section className="lg:col-span-2 bg-[#0a0f1a] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                Estudiantes - {currentCourse?.title || 'Curso'}
              </h2>
              <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full font-medium">
                {enrollments.length} inscritos
              </span>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-gray-300 font-medium mb-2">Sin estudiantes inscritos</h3>
                <p className="text-gray-500 text-sm">Los estudiantes aparecerán aquí cuando se inscriban</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-800">
                      <th className="pb-3 font-medium">Estudiante</th>
                      <th className="pb-3 font-medium text-center">Progreso</th>
                      <th className="pb-3 font-medium text-center">Nota</th>
                      <th className="pb-3 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {enrollments.map((student, idx) => (
                      <tr key={idx} className="group hover:bg-gray-800/20 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                              {student.profiles?.full_name?.charAt(0) || 'E'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-white text-sm truncate">{student.profiles?.full_name || 'Sin nombre'}</p>
                              <p className="text-xs text-gray-500 truncate">{student.profiles?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-500 rounded-full"
                                style={{ width: `${student.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-8">{student.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`text-sm font-semibold ${(student.grade || 0) >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {student.grade || 0}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <Link 
                            href={`/dashboard/teacher/student/${student.profiles?.id}`}
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                          >
                            Ver →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-6">
            
            {/* ESTADÍSTICAS DEL CURSO */}
            <section className="bg-[#0a0f1a] border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Rendimiento
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Tasa de Aprobación</span>
                    <span className="text-white font-medium">{stats.passRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${stats.passRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Promedio General</span>
                    <span className="text-white font-medium">{stats.averageGrade}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${stats.averageGrade}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* TAREAS ACTIVAS */}
            <section className="bg-[#0a0f1a] border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                Próximas Tareas
              </h3>
              
              {pendingAssignments.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-gray-500 text-sm">Sin tareas pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAssignments.slice(0, 4).map((a, idx) => (
                    <div key={idx} className="bg-[#030712] border border-gray-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-white truncate">{a.title}</p>
                      <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(a.due_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </aside>
        </div>
      </div>

      {/* MODAL TAREA */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Nueva Tarea
              </h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Asignar a</label>
                <select 
                  className="w-full bg-[#030712] border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                >
                  <option value="all">Todos los estudiantes</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Título</label>
                <input 
                  type="text" 
                  placeholder="Nombre de la tarea"
                  className="w-full bg-[#030712] border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  value={taskData.title} 
                  onChange={e => setTaskData({...taskData, title: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Instrucciones</label>
                <textarea 
                  placeholder="Describe lo que deben hacer los estudiantes..."
                  className="w-full bg-[#030712] border border-gray-800 rounded-lg p-2.5 text-white text-sm h-24 resize-none focus:border-cyan-500 focus:outline-none"
                  value={taskData.description} 
                  onChange={e => setTaskData({...taskData, description: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Fecha límite</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-[#030712] border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  value={taskData.date} 
                  onChange={e => setTaskData({...taskData, date: e.target.value})} 
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-800">
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateTask} 
                disabled={submitting}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Guardando...' : 'Crear Tarea'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXAMEN */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Nuevo Examen
              </h2>
              <button onClick={() => setIsExamModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1.5">Asignar a</label>
                  <select 
                    className="w-full bg-[#030712] border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                  >
                    <option value="all">Todos los estudiantes</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1.5">Título del examen</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Examen Parcial 1"
                    className="w-full bg-[#030712] border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    value={examData.title} 
                    onChange={e => setExamData({...examData, title: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Fecha</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-[#030712] border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    value={examData.date} 
                    onChange={e => setExamData({...examData, date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Duración (min)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#030712] border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    value={examData.duration} 
                    onChange={e => setExamData({...examData, duration: parseInt(e.target.value) || 60})} 
                  />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Preguntas</h3>
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="bg-[#030712] border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-cyan-400 font-medium">Pregunta {idx + 1}</span>
                        {questions.length > 1 && (
                          <button 
                            onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                      
                      <input 
                        type="text" 
                        placeholder="Escribe la pregunta..."
                        className="w-full bg-[#0a0f1a] border border-gray-700 rounded-lg p-2.5 text-white text-sm mb-3 focus:border-cyan-500 focus:outline-none"
                        value={q.text} 
                        onChange={e => handleQuestionChange(idx, 'text', e.target.value)} 
                      />
                      
                      <div className="grid grid-cols-3 gap-2">
                        {['A', 'B', 'C'].map((opt) => (
                          <div 
                            key={opt} 
                            className={`border rounded-lg p-2 flex items-center gap-2 cursor-pointer transition-colors ${
                              q.correct === opt.toLowerCase() 
                                ? 'border-green-500 bg-green-500/10' 
                                : 'border-gray-700 hover:border-gray-600'
                            }`}
                            onClick={() => handleQuestionChange(idx, 'correct', opt.toLowerCase())}
                          >
                            <input 
                              type="radio" 
                              name={`correct-${idx}`} 
                              checked={q.correct === opt.toLowerCase()} 
                              readOnly
                              className="accent-green-500 w-3 h-3"
                            />
                            <input 
                              type="text" 
                              placeholder={`Opción ${opt}`}
                              className="bg-transparent border-none outline-none w-full text-xs text-white"
                              value={opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : q.optionC}
                              onChange={(e) => handleQuestionChange(idx, `option${opt}`, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleAddQuestion} 
                  className="w-full mt-4 py-3 border border-dashed border-gray-700 text-gray-400 rounded-xl hover:border-gray-600 hover:text-gray-300 transition-colors text-sm"
                >
                  + Agregar pregunta
                </button>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-800 flex-shrink-0">
              <button 
                onClick={() => setIsExamModalOpen(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateExam} 
                disabled={submitting}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Guardando...' : 'Crear Examen'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
