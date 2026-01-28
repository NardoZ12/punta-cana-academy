'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  BookOpen,
  Upload,
  Download,
  Eye,
  Filter
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  attachment_url?: string;
  created_at: string;
  courses: {
    id: string;
    title: string;
  };
  assignment_submissions?: {
    id: string;
    submitted_at: string;
    content: string;
    attachment_url?: string;
    grade?: number;
    feedback?: string;
  }[];
}

interface Exam {
  id: string;
  title: string;
  description: string;
  exam_date: string;
  duration: number;
  max_points: number;
  created_at: string;
  courses: {
    id: string;
    title: string;
  };
  exam_submissions?: {
    id: string;
    submitted_at: string;
    score: number;
    total_questions: number;
    correct_answers: number;
  }[];
}

export default function StudentTasksPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assignments' | 'exams' | 'completed'>('assignments');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionModal, setSubmissionModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadTasksData();
  }, []);

  const loadTasksData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener cursos del estudiante
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // Cargar tareas
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          id, title, description, due_date, max_points, attachment_url, created_at,
          courses (id, title),
          assignment_submissions!left (
            id, submitted_at, content, attachment_url, grade, feedback
          )
        `)
        .in('course_id', courseIds)
        .order('due_date', { ascending: true });

      if (assignmentsData) {
        // Filtrar solo submissions del usuario actual
        const filteredAssignments = assignmentsData.map(assignment => ({
          ...assignment,
          assignment_submissions: assignment.assignment_submissions?.filter(
            (sub: any) => sub.student_id === user.id
          ) || []
        }));
        setAssignments(filteredAssignments);
      }

      // Cargar exámenes
      const { data: examsData } = await supabase
        .from('exams')
        .select(`
          id, title, description, exam_date, duration, max_points, created_at,
          courses (id, title),
          exam_submissions!left (
            id, submitted_at, score, total_questions, correct_answers
          )
        `)
        .in('course_id', courseIds)
        .order('exam_date', { ascending: true });

      if (examsData) {
        // Filtrar solo submissions del usuario actual
        const filteredExams = examsData.map(exam => ({
          ...exam,
          exam_submissions: exam.exam_submissions?.filter(
            (sub: any) => sub.student_id === user.id
          ) || []
        }));
        setExams(filteredExams);
      }

    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAssignment = async () => {
    if (!selectedAssignment) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let attachmentUrl = null;
      
      // Subir archivo si existe
      if (submissionFile) {
        const fileName = `${user.id}/${selectedAssignment.id}/${submissionFile.name}`;
        const { data, error } = await supabase.storage
          .from('assignments')
          .upload(fileName, submissionFile);
        
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('assignments')
            .getPublicUrl(fileName);
          attachmentUrl = publicUrl;
        }
      }

      // Crear submission
      const { error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: selectedAssignment.id,
          student_id: user.id,
          content: submissionContent,
          attachment_url: attachmentUrl,
          submitted_at: new Date().toISOString()
        });

      if (!error) {
        setSubmissionModal(false);
        setSelectedAssignment(null);
        setSubmissionContent('');
        setSubmissionFile(null);
        await loadTasksData();
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  };

  const getStatusColor = (dueDate: string, hasSubmission: boolean) => {
    if (hasSubmission) return 'text-green-400';
    const due = new Date(dueDate);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'text-red-400';
    if (diffHours < 24) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getStatusText = (dueDate: string, hasSubmission: boolean) => {
    if (hasSubmission) return 'Entregada';
    const due = new Date(dueDate);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'Vencida';
    if (diffHours < 24) return 'Vence pronto';
    return 'Pendiente';
  };

  const filteredAssignments = assignments.filter(assignment => {
    const hasSubmission = assignment.assignment_submissions && assignment.assignment_submissions.length > 0;
    const isOverdue = new Date(assignment.due_date) < new Date() && !hasSubmission;
    
    switch (filterStatus) {
      case 'pending':
        return !hasSubmission && !isOverdue;
      case 'overdue':
        return isOverdue;
      default:
        return true;
    }
  });

  const filteredExams = exams.filter(exam => {
    const hasSubmission = exam.exam_submissions && exam.exam_submissions.length > 0;
    const isOverdue = new Date(exam.exam_date) < new Date() && !hasSubmission;
    
    switch (filterStatus) {
      case 'pending':
        return !hasSubmission && !isOverdue;
      case 'overdue':
        return isOverdue;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando tareas y exámenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tareas y Exámenes</h1>
          <p className="text-gray-400">Gestiona tus entregas y exámenes pendientes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {assignments.filter(a => !(a.assignment_submissions && a.assignment_submissions.length > 0)).length}
              </p>
              <p className="text-sm text-gray-400">Tareas Pendientes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {exams.filter(e => !(e.exam_submissions && e.exam_submissions.length > 0) && new Date(e.exam_date) > new Date()).length}
              </p>
              <p className="text-sm text-gray-400">Exámenes Próximos</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {assignments.filter(a => a.assignment_submissions && a.assignment_submissions.length > 0).length}
              </p>
              <p className="text-sm text-gray-400">Tareas Entregadas</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {assignments.filter(a => new Date(a.due_date) < new Date() && !(a.assignment_submissions && a.assignment_submissions.length > 0)).length}
              </p>
              <p className="text-sm text-gray-400">Tareas Vencidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'assignments'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Tareas
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'exams'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Exámenes
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'assignments' ? (
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No hay tareas</h3>
              <p className="text-gray-400">No tienes tareas en esta categoría</p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => {
              const hasSubmission = assignment.assignment_submissions && assignment.assignment_submissions.length > 0;
              const submission = hasSubmission ? assignment.assignment_submissions[0] : null;
              
              return (
                <div key={assignment.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(assignment.due_date, hasSubmission)} bg-gray-800`}>
                          {getStatusText(assignment.due_date, hasSubmission)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{assignment.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {assignment.courses.title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Vence: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {assignment.max_points} puntos
                        </span>
                      </div>
                    </div>
                  </div>

                  {submission ? (
                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-400">Entregado</span>
                        <span className="text-sm text-gray-400">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      {submission.grade && (
                        <div className="text-sm text-gray-300 mb-2">
                          <span className="font-medium">Calificación:</span> {submission.grade}/{assignment.max_points}
                        </div>
                      )}
                      {submission.feedback && (
                        <div className="text-sm text-gray-300">
                          <span className="font-medium">Comentarios:</span> {submission.feedback}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setSubmissionModal(true);
                        }}
                        variant="primary"
                        disabled={new Date(assignment.due_date) < new Date()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Entregar
                      </Button>
                      {assignment.attachment_url && (
                        <Button
                          onClick={() => window.open(assignment.attachment_url, '_blank')}
                          variant="secondary"
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No hay exámenes</h3>
              <p className="text-gray-400">No tienes exámenes en esta categoría</p>
            </div>
          ) : (
            filteredExams.map((exam) => {
              const hasSubmission = exam.exam_submissions && exam.exam_submissions.length > 0;
              const submission = hasSubmission ? exam.exam_submissions[0] : null;
              const isAvailable = new Date(exam.exam_date) <= new Date();
              
              return (
                <div key={exam.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{exam.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(exam.exam_date, hasSubmission)} bg-gray-800`}>
                          {hasSubmission ? 'Completado' : isAvailable ? 'Disponible' : 'Próximamente'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{exam.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {exam.courses.title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Fecha: {new Date(exam.exam_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {exam.duration} minutos
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {exam.max_points} puntos
                        </span>
                      </div>
                    </div>
                  </div>

                  {submission ? (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-400">Completado</span>
                        <span className="text-sm text-gray-400">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="font-medium">Resultado:</span> {submission.correct_answers}/{submission.total_questions} correctas ({submission.score}%)
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link href={`/dashboard/student/exam/${exam.id}`}>
                        <Button
                          variant="primary"
                          disabled={!isAvailable}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {isAvailable ? 'Iniciar Examen' : 'No Disponible'}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Submission Modal */}
      {submissionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full border border-gray-800">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Entregar Tarea</h2>
              <h3 className="text-lg text-gray-300 mb-6">{selectedAssignment.title}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contenido de la entrega
                  </label>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    placeholder="Describe tu entrega o proporciona enlaces..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Archivo adjunto (opcional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => {
                    setSubmissionModal(false);
                    setSelectedAssignment(null);
                    setSubmissionContent('');
                    setSubmissionFile(null);
                  }}
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={submitAssignment}
                  variant="primary"
                  disabled={!submissionContent.trim()}
                >
                  Entregar Tarea
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}