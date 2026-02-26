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
  Filter,
  ExternalLink,
  Star,
  Info
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  assignment_type?: string;
  rubric?: string;
  allowed_file_types?: string[];
  max_file_size_mb?: number;
  attached_files?: { type: string; url: string }[];
  attachment_url?: string;
  created_at: string;
  course_id: string;
  course_title?: string;
  submission?: {
    id: string;
    submitted_at: string;
    content: string;
    attachment_url?: string;
    grade?: number;
    feedback?: string;
    status?: string;
  } | null;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  exam_date: string;
  duration: number;
  max_points: number;
  created_at: string;
  course_id: string;
  course_title?: string;
  submission?: {
    id: string;
    submitted_at: string;
    score: number;
    total_questions: number;
    correct_answers: number;
  } | null;
}

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  'file_upload': 'Subir archivo',
  'video_analysis': 'Análisis de video',
  'project_delivery': 'Entrega de proyecto',
  'practical_exercise': 'Ejercicio práctico',
  'written_report': 'Informe escrito',
  'presentation': 'Presentación',
};

const ASSIGNMENT_TYPE_ICONS: Record<string, string> = {
  'file_upload': '📎',
  'video_analysis': '🎥',
  'project_delivery': '📦',
  'practical_exercise': '✏️',
  'written_report': '📝',
  'presentation': '📊',
};

export default function StudentTasksPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assignments' | 'exams'>('assignments');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionModal, setSubmissionModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTasksData();
  }, []);

  // Helper para obtener headers de autenticación
  const getAuthHeaders = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return {
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`,
      },
      supabaseUrl,
      userId: session?.user?.id || null,
      token,
    };
  };

  const loadTasksData = async () => {
    try {
      const { headers, supabaseUrl, userId } = await getAuthHeaders();
      if (!userId) { setLoading(false); return; }

      // 1. Obtener cursos del estudiante
      const ctrl1 = new AbortController();
      const t1 = setTimeout(() => ctrl1.abort(), 10000);
      const enrollRes = await fetch(
        `${supabaseUrl}/rest/v1/enrollments?student_id=eq.${userId}&select=course_id`,
        { headers, signal: ctrl1.signal }
      );
      clearTimeout(t1);
      const enrollments = await enrollRes.json();

      if (!Array.isArray(enrollments) || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map((e: any) => e.course_id);
      const idsParam = courseIds.map((id: string) => `"${id}"`).join(',');

      // 2. Fetch cursos (para nombres)
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 10000);
      const coursesRes = await fetch(
        `${supabaseUrl}/rest/v1/courses?id=in.(${idsParam})&select=id,title`,
        { headers, signal: ctrl2.signal }
      );
      clearTimeout(t2);
      const coursesData = await coursesRes.json();
      const courseMap: Record<string, string> = {};
      if (Array.isArray(coursesData)) {
        coursesData.forEach((c: any) => { courseMap[c.id] = c.title; });
      }

      // 3. Fetch tareas (assignments)
      const ctrl3 = new AbortController();
      const t3 = setTimeout(() => ctrl3.abort(), 10000);
      const assignRes = await fetch(
        `${supabaseUrl}/rest/v1/assignments?course_id=in.(${idsParam})&is_published=eq.true&select=id,title,description,due_date,max_points,assignment_type,rubric,allowed_file_types,max_file_size_mb,attached_files,attachment_url,created_at,course_id&order=due_date.asc.nullslast`,
        { headers, signal: ctrl3.signal }
      );
      clearTimeout(t3);
      let assignmentsData = await assignRes.json();
      if (!Array.isArray(assignmentsData)) assignmentsData = [];

      // 4. Fetch mis submissions
      const ctrl4 = new AbortController();
      const t4 = setTimeout(() => ctrl4.abort(), 10000);
      const subsRes = await fetch(
        `${supabaseUrl}/rest/v1/assignment_submissions?student_id=eq.${userId}&select=id,assignment_id,submitted_at,content,attachment_url,grade,feedback,status`,
        { headers, signal: ctrl4.signal }
      );
      clearTimeout(t4);
      let submissionsData = await subsRes.json();
      if (!Array.isArray(submissionsData)) submissionsData = [];

      // Merge assignments + submissions
      const subsByAssignment: Record<string, any> = {};
      submissionsData.forEach((s: any) => { subsByAssignment[s.assignment_id] = s; });

      const mergedAssignments: Assignment[] = assignmentsData.map((a: any) => ({
        ...a,
        course_title: courseMap[a.course_id] || 'Curso',
        allowed_file_types: Array.isArray(a.allowed_file_types) ? a.allowed_file_types : [],
        attached_files: Array.isArray(a.attached_files) ? a.attached_files : [],
        submission: subsByAssignment[a.id] || null,
      }));

      setAssignments(mergedAssignments);

      // 5. Fetch exámenes (legacy exams table - may not exist)
      try {
        const ctrl5 = new AbortController();
        const t5 = setTimeout(() => ctrl5.abort(), 8000);
        const examRes = await fetch(
          `${supabaseUrl}/rest/v1/exams?course_id=in.(${idsParam})&select=id,title,description,exam_date,duration,max_points,created_at,course_id&order=exam_date.asc`,
          { headers, signal: ctrl5.signal }
        );
        clearTimeout(t5);
        
        if (examRes.ok) {
          let examsArr = await examRes.json();
          if (!Array.isArray(examsArr)) examsArr = [];

          // Fetch exam submissions
          const ctrl6 = new AbortController();
          const t6 = setTimeout(() => ctrl6.abort(), 8000);
          const examSubRes = await fetch(
            `${supabaseUrl}/rest/v1/exam_submissions?student_id=eq.${userId}&select=id,exam_id,submitted_at,score,total_questions,correct_answers`,
            { headers, signal: ctrl6.signal }
          );
          clearTimeout(t6);
          let examSubs = examSubRes.ok ? await examSubRes.json() : [];
          if (!Array.isArray(examSubs)) examSubs = [];
          
          const examSubMap: Record<string, any> = {};
          examSubs.forEach((s: any) => { examSubMap[s.exam_id] = s; });

          const mergedExams: Exam[] = examsArr.map((e: any) => ({
            ...e,
            course_title: courseMap[e.course_id] || 'Curso',
            submission: examSubMap[e.id] || null,
          }));
          setExams(mergedExams);
        }
      } catch (err) {
        console.log('[StudentTasks] Exams table might not exist:', err);
      }

    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAssignment = async () => {
    if (!selectedAssignment) return;
    setSubmitting(true);
    
    try {
      const { headers, supabaseUrl, userId, token } = await getAuthHeaders();
      if (!userId) { setSubmitting(false); return; }

      let attachmentUrl: string | null = null;
      
      // Subir archivo si existe (via Storage REST API)
      if (submissionFile) {
        const fileName = `${userId}/${selectedAssignment.id}/${Date.now()}_${submissionFile.name}`;
        try {
          const uploadCtrl = new AbortController();
          const uploadT = setTimeout(() => uploadCtrl.abort(), 30000);
          const uploadRes = await fetch(
            `${supabaseUrl}/storage/v1/object/assignments/${fileName}`,
            {
              method: 'POST',
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${token}`,
                'Content-Type': submissionFile.type || 'application/octet-stream',
              },
              body: submissionFile,
              signal: uploadCtrl.signal,
            }
          );
          clearTimeout(uploadT);
          
          if (uploadRes.ok) {
            attachmentUrl = `${supabaseUrl}/storage/v1/object/public/assignments/${fileName}`;
          } else {
            console.error('[submitAssignment] Upload error:', await uploadRes.text());
          }
        } catch (err) {
          console.error('[submitAssignment] Upload exception:', err);
        }
      }

      // Crear submission via direct fetch
      const submissionPayload = {
        assignment_id: selectedAssignment.id,
        student_id: userId,
        content: submissionContent,
        submission_text: submissionContent,
        attachment_url: attachmentUrl,
        file_url: attachmentUrl,
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      };

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(`${supabaseUrl}/rest/v1/assignment_submissions`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        signal: ctrl.signal,
        body: JSON.stringify(submissionPayload)
      });
      clearTimeout(t);

      if (res.ok) {
        setSubmissionModal(false);
        setSelectedAssignment(null);
        setSubmissionContent('');
        setSubmissionFile(null);
        await loadTasksData();
      } else {
        const errBody = await res.text();
        console.error('[submitAssignment] Error:', errBody);
        alert('Error al enviar: ' + errBody);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error al enviar la tarea');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (dueDate: string, hasSubmission: boolean) => {
    if (hasSubmission) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (!dueDate) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    const due = new Date(dueDate);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 0) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (diffHours < 24) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getStatusText = (dueDate: string, hasSubmission: boolean) => {
    if (hasSubmission) return 'Entregada';
    if (!dueDate) return 'Pendiente';
    const due = new Date(dueDate);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 0) return 'Vencida';
    if (diffHours < 24) return 'Vence pronto';
    return 'Pendiente';
  };

  const filteredAssignments = assignments.filter(assignment => {
    const hasSubmission = !!assignment.submission;
    const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && !hasSubmission;
    
    switch (filterStatus) {
      case 'pending': return !hasSubmission && !isOverdue;
      case 'overdue': return !!isOverdue;
      default: return true;
    }
  });

  const filteredExams = exams.filter(exam => {
    const hasSubmission = !!exam.submission;
    const isOverdue = exam.exam_date && new Date(exam.exam_date) < new Date() && !hasSubmission;
    
    switch (filterStatus) {
      case 'pending': return !hasSubmission && !isOverdue;
      case 'overdue': return !!isOverdue;
      default: return true;
    }
  });

  const pendingCount = assignments.filter(a => !a.submission).length;
  const submittedCount = assignments.filter(a => !!a.submission).length;
  const overdueCount = assignments.filter(a => a.due_date && new Date(a.due_date) < new Date() && !a.submission).length;
  const upcomingExamsCount = exams.filter(e => !e.submission && (!e.exam_date || new Date(e.exam_date) > new Date())).length;

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
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
              <p className="text-sm text-gray-400">Tareas Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-white">{upcomingExamsCount}</p>
              <p className="text-sm text-gray-400">Exámenes Próximos</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{submittedCount}</p>
              <p className="text-sm text-gray-400">Tareas Entregadas</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">{overdueCount}</p>
              <p className="text-sm text-gray-400">Tareas Vencidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'assignments' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Tareas
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'exams' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Exámenes
          </button>
        </div>
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
              const hasSubmission = !!assignment.submission;
              const submission = assignment.submission;
              const typeLabel = ASSIGNMENT_TYPE_LABELS[assignment.assignment_type || 'file_upload'] || assignment.assignment_type || 'Tarea';
              const typeIcon = ASSIGNMENT_TYPE_ICONS[assignment.assignment_type || 'file_upload'] || '📎';
              
              return (
                <div key={assignment.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{typeIcon}</span>
                        <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadgeClass(assignment.due_date, hasSubmission)}`}>
                          {getStatusText(assignment.due_date, hasSubmission)}
                        </span>
                      </div>
                      {assignment.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{assignment.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {assignment.course_title}
                        </span>
                        {assignment.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Vence: {new Date(assignment.due_date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {assignment.max_points} puntos
                        </span>
                        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{typeLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reference links */}
                  {assignment.attached_files && assignment.attached_files.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {assignment.attached_files.map((file: any, idx: number) => (
                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg hover:bg-cyan-500/20 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Enlace {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {submission ? (
                    <div className="bg-gray-800 rounded-lg p-4 mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Entregado
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(submission.submitted_at).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {submission.grade != null && (
                        <div className="text-sm text-gray-300 mb-1">
                          <span className="font-medium">Calificación:</span>{' '}
                          <span className={Number(submission.grade) >= (assignment.max_points * 0.7) ? 'text-green-400' : 'text-yellow-400'}>
                            {submission.grade}/{assignment.max_points}
                          </span>
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
                      <Button onClick={() => { setSelectedAssignment(assignment); setDetailModal(true); }} variant="secondary" className="flex items-center gap-2">
                        <Info className="w-4 h-4" /> Ver detalles
                      </Button>
                      <Button
                        onClick={() => { setSelectedAssignment(assignment); setSubmissionModal(true); }}
                        variant="primary"
                        disabled={!!assignment.due_date && new Date(assignment.due_date) < new Date()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" /> Entregar
                      </Button>
                      {assignment.attachment_url && (
                        <Button onClick={() => window.open(assignment.attachment_url, '_blank')} variant="secondary" className="flex items-center gap-2">
                          <Download className="w-4 h-4" /> Descargar
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
              const hasSubmission = !!exam.submission;
              const submission = exam.submission;
              const isAvailable = !exam.exam_date || new Date(exam.exam_date) <= new Date();
              
              return (
                <div key={exam.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{exam.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          hasSubmission ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : isAvailable ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>
                          {hasSubmission ? 'Completado' : isAvailable ? 'Disponible' : 'Próximamente'}
                        </span>
                      </div>
                      {exam.description && <p className="text-gray-400 text-sm mb-2">{exam.description}</p>}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{exam.course_title}</span>
                        {exam.exam_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Fecha: {new Date(exam.exam_date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {exam.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{exam.duration} min</span>}
                        <span className="flex items-center gap-1"><Star className="w-4 h-4" />{exam.max_points} puntos</span>
                      </div>
                    </div>
                  </div>

                  {submission ? (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Completado
                        </span>
                        <span className="text-sm text-gray-400">{new Date(submission.submitted_at).toLocaleDateString('es-DO')}</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="font-medium">Resultado:</span> {submission.correct_answers}/{submission.total_questions} correctas ({submission.score}%)
                      </div>
                    </div>
                  ) : (
                    <Link href={`/dashboard/student/exam/${exam.id}`}>
                      <Button variant="primary" disabled={!isAvailable} className="flex items-center gap-2">
                        <Eye className="w-4 h-4" /> {isAvailable ? 'Iniciar Examen' : 'No Disponible'}
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full border border-gray-800 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{ASSIGNMENT_TYPE_ICONS[selectedAssignment.assignment_type || 'file_upload'] || '📎'}</span>
                  {selectedAssignment.title}
                </h2>
                <button onClick={() => { setDetailModal(false); setSelectedAssignment(null); }} className="text-gray-400 hover:text-white text-lg">✕</button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Tipo:</span>
                  <span className="text-sm text-white bg-gray-800 px-2 py-0.5 rounded">
                    {ASSIGNMENT_TYPE_LABELS[selectedAssignment.assignment_type || 'file_upload'] || selectedAssignment.assignment_type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">{selectedAssignment.course_title}</span>
                </div>

                {selectedAssignment.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">
                      Fecha límite: {new Date(selectedAssignment.due_date).toLocaleDateString('es-DO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white">{selectedAssignment.max_points} puntos máximos</span>
                </div>

                {selectedAssignment.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Instrucciones</h4>
                    <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">{selectedAssignment.description}</div>
                  </div>
                )}

                {selectedAssignment.allowed_file_types && selectedAssignment.allowed_file_types.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Archivos permitidos</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAssignment.allowed_file_types.map((ft: string, i: number) => (
                        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">{ft.toUpperCase()}</span>
                      ))}
                    </div>
                    {selectedAssignment.max_file_size_mb && (
                      <p className="text-xs text-gray-500 mt-1">Tamaño máximo: {selectedAssignment.max_file_size_mb} MB</p>
                    )}
                  </div>
                )}

                {selectedAssignment.rubric && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Rúbrica de evaluación</h4>
                    <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">{selectedAssignment.rubric}</div>
                  </div>
                )}

                {selectedAssignment.attached_files && selectedAssignment.attached_files.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Enlaces de referencia</h4>
                    <div className="space-y-2">
                      {selectedAssignment.attached_files.map((file: any, idx: number) => (
                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 bg-gray-800 p-3 rounded-lg">
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{file.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
                <Button onClick={() => { setDetailModal(false); setSelectedAssignment(null); }} variant="secondary">Cerrar</Button>
                <Button
                  onClick={() => { setDetailModal(false); setSubmissionModal(true); }}
                  variant="primary"
                  disabled={!!selectedAssignment.due_date && new Date(selectedAssignment.due_date) < new Date()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Entregar Tarea
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {submissionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full border border-gray-800">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">Entregar Tarea</h2>
              <h3 className="text-lg text-gray-300 mb-1">{selectedAssignment.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{selectedAssignment.course_title} • {selectedAssignment.max_points} puntos</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contenido de la entrega</label>
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
                    Archivo adjunto {selectedAssignment.allowed_file_types && selectedAssignment.allowed_file_types.length > 0 
                      ? `(${selectedAssignment.allowed_file_types.map(t => t.toUpperCase()).join(', ')})` : '(opcional)'}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
                  />
                  {selectedAssignment.max_file_size_mb && (
                    <p className="text-xs text-gray-500 mt-1">Tamaño máximo: {selectedAssignment.max_file_size_mb} MB</p>
                  )}
                </div>

                {selectedAssignment.rubric && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Criterios de evaluación
                    </h4>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap">{selectedAssignment.rubric}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => { setSubmissionModal(false); setSelectedAssignment(null); setSubmissionContent(''); setSubmissionFile(null); }}
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button onClick={submitAssignment} variant="primary" disabled={!submissionContent.trim() || submitting} className="flex items-center gap-2">
                  {submitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Enviando...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Entregar Tarea</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
