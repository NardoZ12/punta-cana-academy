'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/atoms/Button';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: 'a' | 'b' | 'c';
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  courses?: {
    title: string;
  };
}

interface ExamResult {
  id: string;
  score: number;
  completed_at: string;
}

export default function ExamPage() {
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingResult, setExistingResult] = useState<ExamResult | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchExamData();
    checkExistingResult();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      // Fetch exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          courses (
            title
          )
        `)
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingResult = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('exam_results')
          .select('*')
          .eq('exam_id', examId)
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setExistingResult(data);
        }
      }
    } catch (error) {
      console.error('Error checking existing result:', error);
    }
  };

  const handleSelectOption = (questionId: string, selectedOption: string) => {
    if (isSubmitted) return;

    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));

    // Mostrar feedback inmediato
    setShowFeedback(prev => ({
      ...prev,
      [questionId]: true
    }));
  };

  const getOptionColor = (questionId: string, option: string) => {
    if (!showFeedback[questionId]) {
      return answers[questionId] === option 
        ? 'border-blue-500 bg-blue-600/20' 
        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50';
    }

    const question = questions.find(q => q.id === questionId);
    const isCorrect = question?.correct_option === option;
    const isSelected = answers[questionId] === option;

    if (isSelected && isCorrect) return 'border-green-500 bg-green-600/20 text-green-100';
    if (isSelected && !isCorrect) return 'border-red-500 bg-red-600/20 text-red-100';
    if (!isSelected && isCorrect) return 'border-green-500 bg-green-600/10 text-green-200';
    
    return 'border-gray-600 bg-gray-800/30 text-gray-300';
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correct_option) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const handleSubmit = async () => {
    if (submitting || Object.keys(answers).length < questions.length) return;

    setSubmitting(true);
    
    try {
      const finalScore = calculateScore();
      setScore(finalScore);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('exam_results')
          .insert({
            exam_id: examId,
            user_id: user.id,
            score: finalScore,
            answers: answers
          });

        if (error) throw error;
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Error al enviar el examen. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando examen...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">❌ Examen no encontrado</p>
          <p className="text-gray-400">Verifica que el enlace sea correcto.</p>
        </div>
      </div>
    );
  }

  // Mostrar resultado si ya fue enviado
  if (isSubmitted || existingResult) {
    const finalScore = existingResult ? existingResult.score : score;
    
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 pt-24">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Header de resultado */}
          <div className="mb-8">
            <div className="text-6xl mb-4">
              {finalScore >= 80 ? '🎉' : finalScore >= 60 ? '👍' : '📚'}
            </div>
            <h1 className="text-4xl font-bold mb-2">
              {finalScore >= 80 ? '¡Excelente trabajo!' : 
               finalScore >= 60 ? '¡Buen trabajo!' : 
               '¡Sigue practicando!'}
            </h1>
            <p className="text-gray-400">Examen: {exam.title}</p>
          </div>

          {/* Score */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 mb-8 inline-block">
            <div className="text-5xl font-bold mb-2">
              <span className={`${
                finalScore >= 80 ? 'text-green-400' : 
                finalScore >= 60 ? 'text-yellow-400' : 
                'text-red-400'
              }`}>
                {finalScore}%
              </span>
            </div>
            <p className="text-gray-400">Puntuación final</p>
          </div>

          {/* Estadísticas detalladas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {questions.length}
              </div>
              <p className="text-gray-400">Total de preguntas</p>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {Math.round((finalScore / 100) * questions.length)}
              </div>
              <p className="text-gray-400">Respuestas correctas</p>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-3xl font-bold text-red-400 mb-2">
                {questions.length - Math.round((finalScore / 100) * questions.length)}
              </div>
              <p className="text-gray-400">Respuestas incorrectas</p>
            </div>
          </div>

          {/* Retroalimentación */}
          <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-purple-300">📋 Retroalimentación</h3>
            <p className="text-gray-300 leading-relaxed">
              {finalScore >= 80 ? 
                'Demuestra un excelente dominio del tema. ¡Continúa con este nivel de dedicación!' :
                finalScore >= 60 ?
                'Buen entendimiento del contenido. Revisa las áreas donde tuviste dificultades para mejorar aún más.' :
                'Se recomienda repasar el material del curso. Considera solicitar ayuda adicional a tu instructor.'
              }
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = '/dashboard/student'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              🏠 Volver al Dashboard
            </Button>
            <Button 
              onClick={() => window.location.href = `/dashboard/student/course/${exam?.courses}`}
              variant="secondary"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              📚 Ver Curso
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL DEL EXAMEN ---
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER DEL EXAMEN */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-purple-200">{exam?.title}</h1>
          <p className="text-gray-400 mb-2">{exam?.courses?.title}</p>
          <div className="flex justify-center items-center gap-4 text-sm">
            <span className="bg-purple-600/20 px-3 py-1 rounded-full border border-purple-500/20">
              ⏱️ {exam?.duration_minutes} minutos
            </span>
            <span className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/20">
              📝 {questions.length} preguntas
            </span>
          </div>
        </div>

        {/* INSTRUCCIONES */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-3 text-yellow-300">📋 Instrucciones</h3>
          <div className="text-gray-300 text-sm space-y-2">
            <p>• Lee cada pregunta cuidadosamente antes de responder.</p>
            <p>• Selecciona la opción que consideres correcta para cada pregunta.</p>
            <p>• Una vez que selecciones una opción, verás feedback inmediato.</p>
            <p>• Asegúrate de responder todas las preguntas antes de enviar.</p>
            <p>• Una vez enviado, no podrás modificar tus respuestas.</p>
          </div>
        </div>

        {/* LISTA DE PREGUNTAS */}
        <div className="space-y-8 mb-8">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6">
              
              {/* Encabezado de la pregunta */}
              <div className="mb-6">
                <span className="text-purple-400 font-bold text-sm">Pregunta {index + 1}</span>
                <h3 className="text-xl font-semibold mt-2 text-white leading-relaxed">
                  {question.question_text}
                </h3>
              </div>

              {/* Opciones */}
              <div className="space-y-3">
                {['a', 'b', 'c'].map((option) => {
                  const optionText = option === 'a' ? question.option_a : 
                                   option === 'b' ? question.option_b : 
                                   question.option_c;
                  
                  const isSelected = answers[question.id] === option;
                  const colorClass = getOptionColor(question.id, option);
                  
                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectOption(question.id, option)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${colorClass} hover:scale-[1.01] hover:shadow-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                          isSelected ? 'border-white bg-white text-gray-900' : 'border-gray-400'
                        }`}>
                          {option.toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm">{optionText}</span>
                        
                        {/* Feedback Visual */}
                        {showFeedback[question.id] && answers[question.id] === option && (
                          <div className="text-lg">
                            {option === question.correct_option ? '✅' : '❌'}
                          </div>
                        )}
                        
                        {/* Mostrar la correcta si no fue seleccionada */}
                        {showFeedback[question.id] && option === question.correct_option && answers[question.id] !== option && (
                          <div className="text-lg">✅</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explicación de la respuesta correcta */}
              {showFeedback[question.id] && (
                <div className="mt-4 p-3 bg-gray-900/50 border border-gray-600 rounded-lg">
                  <p className="text-sm text-green-300">
                    <strong>Respuesta correcta:</strong> {question.correct_option.toUpperCase()}) {
                      question.correct_option === 'a' ? question.option_a :
                      question.correct_option === 'b' ? question.option_b :
                      question.option_c
                    }
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* BOTÓN DE ENVÍO */}
        <div className="text-center">
          <Button 
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < questions.length}
            size="lg"
            className={`px-8 py-4 text-lg font-semibold ${
              Object.keys(answers).length < questions.length 
                ? 'opacity-50 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-900/20'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Procesando Examen...
              </>
            ) : (
              `📝 Enviar Examen (${Object.keys(answers).length}/${questions.length})`
            )}
          </Button>
          
          {Object.keys(answers).length < questions.length && (
            <p className="text-yellow-400 text-sm mt-2">
              Responde todas las preguntas para poder enviar el examen
            </p>
          )}
        </div>
      </div>
    </div>
  );
}