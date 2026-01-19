'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';
import Link from 'next/link';

export default function TakeExamPage() {
  const params = useParams();
  const supabase = createClient();
  const router = useRouter();
  
  const examId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number, passed: boolean } | null>(null);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  useEffect(() => {
    async function init() {
      if (!examId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Verificar si ya lo tomó
      const { data: submission } = await supabase
        .from('exam_submissions')
        .select('score')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .single();

      if (submission) {
        setResult({ score: submission.score, passed: submission.score >= 70 });
        setAlreadyTaken(true);
        const { data: e } = await supabase.from('exams').select('title, course_id, courses(title)').eq('id', examId).single();
        setExam(e);
        setLoading(false);
        return;
      }

      // 2. Cargar Examen (Agregamos course_id para poder actualizar la nota luego)
      const { data: examData } = await supabase
        .from('exams')
        .select('*, course_id, courses(title)')
        .eq('id', examId)
        .single();
      
      // Verificar si el examen está bloqueado
      if (examData?.is_blocked) {
        setExam(examData);
        setLoading(false);
        return; // No cargar preguntas si está bloqueado
      }
      
      setExam(examData);

      // 3. Cargar Preguntas
      const { data: qData } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId); 

      if (qData) setQuestions(qData);
      setLoading(false);
    }
    init();
  }, [examId]);

  const handleSelect = (qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert(`⚠️ Faltan preguntas por responder (${Object.keys(answers).length}/${questions.length})`);
      return;
    }

    setSubmitting(true);

    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_option) correct++;
    });
    
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // A) Guardar el historial del examen
    const { error: submitError } = await supabase.from('exam_submissions').insert({
      exam_id: examId,
      student_id: user.id,
      score: score
    });

    if (submitError) {
      alert('Error al enviar: ' + submitError.message);
      setSubmitting(false);
      return;
    }

    // B) ACTUALIZAR LA NOTA DEL CURSO (enrollments) 🚀
    // (Esto hace que el profesor vea la nota global actualizada)
    if (exam?.course_id) {
       await supabase
         .from('enrollments')
         .update({ grade: score }) // Aquí podrías hacer un promedio si hubiera más notas
         .eq('course_id', exam.course_id)
         .eq('student_id', user.id);
    }

    setResult({ score, passed });
    setAlreadyTaken(true);
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando examen...</div>;

  // Si el examen está bloqueado
  if (exam?.is_blocked) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl text-center max-w-md w-full">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold mb-2">Examen Bloqueado</h2>
          <p className="text-gray-400 mb-6">Este examen ha sido temporalmente bloqueado por el profesor.</p>
          <p className="text-sm text-gray-500 mb-6">Examen: {exam?.title}</p>
          <Link href="/dashboard/student"><Button fullWidth>Volver al Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  if (alreadyTaken && result) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl text-center max-w-md w-full">
          <div className="text-6xl mb-4">{result.passed ? '🎉' : '📚'}</div>
          <h2 className="text-3xl font-bold mb-2">{result.passed ? '¡Aprobado!' : 'Finalizado'}</h2>
          <p className="text-gray-400 mb-6">Examen: {exam?.title}</p>
          <div className="py-6 bg-black/30 rounded-xl mb-6 border border-gray-700">
             <div className="text-sm text-gray-500 uppercase font-bold">Tu Nota</div>
             <div className={`text-5xl font-bold ${result.passed ? 'text-green-400' : 'text-orange-400'}`}>
               {result.score}/100
             </div>
          </div>
          <Link href="/dashboard/student"><Button fullWidth>Volver al Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 pb-6 border-b border-gray-800">
           <div className="flex justify-between items-center mb-2">
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Evaluación</span>
              <span className="text-gray-400 text-sm">⏱️ {exam?.duration_minutes} min</span>
           </div>
           <h1 className="text-3xl font-bold">{exam?.title}</h1>
           <p className="text-gray-500 mt-1">{exam?.courses?.title}</p>
        </div>
        <div className="space-y-8">
           {questions.map((q, idx) => (
             <div key={q.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-medium mb-4 flex gap-3 text-white">
                   <span className="bg-gray-700 text-gray-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">{idx + 1}</span>
                   {q.question_text}
                </h3>
                <div className="space-y-3 ml-11">
                   {['a','b','c'].map((opt) => (
                     <div key={opt} onClick={() => handleSelect(q.id, opt)}
                       className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${answers[q.id] === opt ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-black/20 border-gray-600 hover:bg-gray-700 text-gray-300'}`}>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${answers[q.id] === opt ? 'border-blue-400' : 'border-gray-500'}`}>
                           {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />}
                        </div>
                        <span>{q[`option_${opt}`]}</span>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
        {questions.length > 0 && (
          <div className="mt-10 flex justify-end gap-4 pt-6 border-t border-gray-800">
             <Link href="/dashboard/student"><Button variant="outline">Cancelar</Button></Link>
             <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Enviando...' : 'Finalizar Examen'}</Button>
          </div>
        )}
      </div>
    </div>
  );
}