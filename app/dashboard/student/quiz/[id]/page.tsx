'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const supabase = createClient();

  // Estados
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptionText, setSelectedOptionText] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos del examen desde Supabase
  useEffect(() => {
    const fetchExamData = async () => {
      if (!params.id) return;
      try {
        // 1. Obtener detalles del examen
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (examError) throw examError;
        setExam(examData);

        // 2. Obtener preguntas
        const { data: questionsData, error: questionsError } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', params.id)
          .order('created_at', { ascending: true });

        if (questionsError) throw questionsError;

        // 3. PARSEO SEGURO: Convertir string JSON a Array real (Evita el pantallazo blanco)
        const safeQuestions = questionsData?.map(q => {
          let parsedOptions: string[] = [];
          if (typeof q.options === 'string') {
            try {
              parsedOptions = JSON.parse(q.options);
            } catch (e) {
              console.error("Error parseando opciones:", q.options);
            }
          } else if (Array.isArray(q.options)) {
            parsedOptions = q.options;
          }
          return { ...q, options: parsedOptions };
        }) || [];

        setQuestions(safeQuestions);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [params.id, supabase]);

  // Manejar click en una opción
  const handleOptionClick = (optionText: string) => {
    setSelectedOptionText(optionText);
  };

  // Botón Siguiente
  const handleNext = async () => {
    if (selectedOptionText === null) return;
    
    const currentQ = questions[currentQuestion];
    const points = currentQ.points || 1;
    let newScore = score;

    // Verificar si la respuesta es correcta usando el texto exacto
    if (selectedOptionText === currentQ.correct_answer) {
      newScore = score + points;
      setScore(newScore);
    }

    const nextQuestion = currentQuestion + 1;
    
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
      setSelectedOptionText(null);
    } else {
      // TERMINÓ EL EXAMEN - Calcular y guardar en BD
      setSubmitting(true);
      const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);
      const finalPercentage = Math.round((newScore / totalPoints) * 100);
      const isPassed = finalPercentage >= (exam?.passing_score || 70);

      // Guardar intento en la tabla exam_submissions
      if (user) {
        await supabase.from('exam_submissions').insert({
          exam_id: exam.id,
          student_id: user.id,
          score: newScore,
          passed: isPassed
        });
      }
      
      setSubmitting(false);
      setShowResult(true);
    }
  };

  // --- ESTADOS DE CARGA Y ERROR ---
  if (loading) {
    return (
      <div className="min-h-screen bg-pca-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pca-blue"></div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-pca-black flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-2xl text-center border border-gray-800">
          <h2 className="text-2xl mb-4 text-white">No se pudo cargar el examen</h2>
          <p className="text-gray-400 mb-6">{error || "Aún no se han agregado preguntas."}</p>
          <Link href="/dashboard/student">
            <Button variant="primary">Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- VISTA DE RESULTADOS (Se muestra al finalizar) ---
  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);
  const percentage = Math.round((score / totalPoints) * 100);
  const isPassed = percentage >= (exam?.passing_score || 70);

  if (showResult) {
    return (
      <div className="min-h-screen bg-pca-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center max-w-md w-full shadow-2xl"
        >
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl border-4 ${isPassed ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-red-500 text-red-500 bg-red-500/10'}`}>
            {percentage}%
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {isPassed ? '¡Felicidades! 🎉' : 'Sigue practicando 📚'}
          </h2>
          <p className="text-gray-400 mb-8">
            Has obtenido {score} puntos de {totalPoints} posibles.
          </p>

          <div className="space-y-3">
            <Link href="/dashboard/student">
              <Button variant="primary" fullWidth>Volver al Dashboard</Button>
            </Link>
            {!isPassed && (
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => window.location.reload()}
              >
                Intentar de nuevo
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // --- VISTA DEL EXAMEN ---
  return (
    <div className="min-h-screen bg-pca-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between text-gray-400 text-sm mb-2">
          <span>Pregunta {currentQuestion + 1} de {questions.length}</span>
          <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Completado</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-pca-blue"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-8">
          {questions[currentQuestion].question_text}
        </h2>

        <div className="space-y-4 mb-8">
          {questions[currentQuestion].options.map((option: string, index: number) => (
            <button
              type="button"
              key={index}
              onClick={() => handleOptionClick(option)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex justify-between items-center ${
                selectedOptionText === option 
                  ? 'bg-pca-blue/20 border-pca-blue text-white ring-1 ring-pca-blue' 
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-500'
              }`}
            >
              <span className="font-medium">{option}</span>
              {selectedOptionText === option && (
                <div className="w-3 h-3 bg-pca-blue rounded-full shadow-[0_0_10px_rgba(0,86,179,0.8)]"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button 
            variant="primary" 
            onClick={handleNext}
            disabled={selectedOptionText === null || submitting}
          >
            {submitting ? 'Guardando...' : currentQuestion === questions.length - 1 ? 'Finalizar Examen' : 'Siguiente Pregunta'}
          </Button>
        </div>
      </div>
    </div>
  );
}
