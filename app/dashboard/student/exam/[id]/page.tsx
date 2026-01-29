'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  AlertTriangle,
  Award,
  XCircle,
  Lock
} from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  course_id: string;
  is_blocked?: boolean;
  courses?: { title: string };
}

export default function TakeExamPage() {
  const params = useParams();
  const supabase = createClient();
  const router = useRouter();
  
  const examId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    async function init() {
      if (!examId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if already taken
      const { data: submission } = await supabase
        .from('exam_submissions')
        .select('score')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .single();

      if (submission) {
        setResult({ score: submission.score, passed: submission.score >= 70 });
        setAlreadyTaken(true);
        const { data: e } = await supabase
          .from('exams')
          .select('title, course_id, courses(title)')
          .eq('id', examId)
          .single();
        setExam(e);
        setLoading(false);
        return;
      }

      // Load exam
      const { data: examData } = await supabase
        .from('exams')
        .select('*, course_id, courses(title)')
        .eq('id', examId)
        .single();
      
      if (examData?.is_blocked) {
        setExam(examData);
        setLoading(false);
        return;
      }
      
      setExam(examData);
      setTimeRemaining((examData?.duration_minutes || 30) * 60);

      // Load questions
      const { data: qData } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_in_exam', { ascending: true });

      if (qData) setQuestions(qData);
      setLoading(false);
    }
    init();
  }, [examId, supabase, router]);

  // Timer
  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeRemaining]);

  const handleSelect = (qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_option) correct++;
    });
    
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= 70;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    // Save submission
    const { error: submitError } = await supabase.from('exam_submissions').insert({
      exam_id: examId,
      student_id: user.id,
      score: score,
      answers: answers,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    });

    if (submitError) {
      console.error('Error submitting:', submitError);
      setSubmitting(false);
      return;
    }

    // Update course grade
    if (exam?.course_id) {
      await supabase
        .from('enrollments')
        .update({ grade: score })
        .eq('course_id', exam.course_id)
        .eq('student_id', user.id);
    }

    setResult({ score, passed });
    setAlreadyTaken(true);
    setExamStarted(false);
    setSubmitting(false);
  }, [submitting, questions, answers, supabase, examId, exam?.course_id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-[#8b949e]">Cargando examen...</p>
        </div>
      </div>
    );
  }

  // Blocked exam
  if (exam?.is_blocked) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Examen Bloqueado</h2>
          <p className="text-[#8b949e] mb-6">Este examen ha sido temporalmente bloqueado por el instructor.</p>
          <p className="text-sm text-[#8b949e] mb-6">{exam?.title}</p>
          <Link 
            href="/dashboard/student"
            className="inline-block w-full px-4 py-3 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors text-center"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Result screen
  if (alreadyTaken && result) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#161b22] border border-[#30363d] p-8 rounded-2xl text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            result.passed ? 'bg-green-500/20' : 'bg-amber-500/20'
          }`}>
            {result.passed ? (
              <Award className="h-10 w-10 text-green-400" />
            ) : (
              <XCircle className="h-10 w-10 text-amber-400" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            {result.passed ? 'Felicidades! Aprobaste' : 'Examen Finalizado'}
          </h1>
          
          <p className="text-[#8b949e] mb-2">{exam?.title}</p>
          <p className="text-sm text-[#8b949e] mb-6">{exam?.courses?.title}</p>

          <div className="bg-[#21262d] rounded-xl p-6 mb-6">
            <p className="text-sm text-[#8b949e] uppercase font-medium mb-2">Tu Calificacion</p>
            <div className={`text-5xl font-bold ${result.passed ? 'text-green-400' : 'text-amber-400'}`}>
              {result.score}/100
            </div>
            <p className="text-sm text-[#8b949e] mt-2">
              {result.passed ? 'Has aprobado el examen' : 'Puntuacion minima: 70%'}
            </p>
          </div>

          <div className="flex gap-3">
            <Link 
              href="/dashboard/student"
              className="flex-1 px-4 py-3 text-sm font-medium rounded-lg text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] transition-colors text-center"
            >
              Ir al Dashboard
            </Link>
            {exam?.course_id && (
              <Link 
                href={`/dashboard/student/course/${exam.course_id}`}
                className="flex-1 px-4 py-3 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors text-center"
              >
                Volver al Curso
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Start screen
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-8">
          <div className="text-center mb-8">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Evaluacion</span>
            <h1 className="text-2xl font-bold text-white mt-2">{exam?.title}</h1>
            <p className="text-[#8b949e] mt-1">{exam?.courses?.title}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#21262d] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{questions.length}</p>
              <p className="text-sm text-[#8b949e]">Preguntas</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{exam?.duration_minutes || 30}</p>
              <p className="text-sm text-[#8b949e]">Minutos</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">70%</p>
              <p className="text-sm text-[#8b949e]">Para aprobar</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-400 mb-1">Importante</h4>
                <p className="text-sm text-[#c9d1d9]">
                  Una vez que inicies el examen, el temporizador comenzara a correr. 
                  No podras pausar el examen una vez iniciado.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/student"
              className="flex-1 px-4 py-3 text-sm font-medium rounded-lg text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] transition-colors text-center"
            >
              Cancelar
            </Link>
            <button
              onClick={() => setExamStarted(true)}
              className="flex-1 px-4 py-3 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
            >
              Iniciar Examen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exam in progress
  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    { key: 'a', text: currentQuestion?.option_a },
    { key: 'b', text: currentQuestion?.option_b },
    { key: 'c', text: currentQuestion?.option_c },
  ].filter(opt => opt.text);

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header with timer */}
      <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-white">{exam?.title}</h1>
            <p className="text-sm text-[#8b949e]">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </p>
          </div>
          
          <div className={`flex items-center px-4 py-2 rounded-lg ${
            timeRemaining < 60 ? 'bg-red-500/20 text-red-400' : 
            timeRemaining < 300 ? 'bg-amber-500/20 text-amber-400' : 'bg-[#21262d] text-white'
          }`}>
            <Clock className="h-4 w-4 mr-2" />
            <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#21262d]">
          <div 
            className="h-full bg-cyan-500 transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <span className="w-10 h-10 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center font-bold mr-4">
                {currentQuestionIndex + 1}
              </span>
              <h2 className="text-lg font-medium text-white">
                {currentQuestion?.question_text}
              </h2>
            </div>
            {answers[currentQuestion?.id] && (
              <span className="flex items-center text-green-400 text-sm flex-shrink-0 ml-4">
                <CheckCircle className="h-4 w-4 mr-1" />
                Respondida
              </span>
            )}
          </div>

          <div className="space-y-3 ml-14">
            {options.map((opt, index) => (
              <button
                key={opt.key}
                onClick={() => handleSelect(currentQuestion.id, opt.key)}
                className={`w-full text-left p-4 rounded-lg border transition-all flex items-center ${
                  answers[currentQuestion.id] === opt.key
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-[#30363d] bg-[#21262d] text-[#c9d1d9] hover:border-[#8b949e]'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border mr-4 text-sm font-medium ${
                  answers[currentQuestion.id] === opt.key
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                    : 'border-[#30363d]'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                {opt.text}
              </button>
            ))}
          </div>
        </div>

        {/* Question navigation dots */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                index === currentQuestionIndex
                  ? 'bg-cyan-500 text-white'
                  : answers[q.id]
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Enviando...' : 'Finalizar Examen'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>

        {/* Answering status */}
        <div className="mt-6 text-center text-sm text-[#8b949e]">
          {Object.keys(answers).length} de {questions.length} preguntas respondidas
          {Object.keys(answers).length < questions.length && (
            <span className="text-amber-400 ml-2">
              (Debes responder todas para finalizar)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
