// src/app/dashboard/student/quiz/[id]/page.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// DATOS SIMULADOS DEL EXAMEN (A1 - Module 2)
const quizData = {
  title: "Quiz: Numbers, Days & Dates",
  questions: [
    {
      id: 1,
      question: "Which day comes after Tuesday?",
      options: ["Monday", "Wednesday", "Thursday", "Friday"],
      correctAnswer: 1 // Index of 'Wednesday'
    },
    {
      id: 2,
      question: "How do you write the date 'March 15th'?",
      options: ["15/03", "03/15", "March of 15", "The 15 March"],
      correctAnswer: 0 // Index of '15/03' (European/Latam format) or 1 depending on preference. Let's assume standard international.
    },
    {
      id: 3,
      question: "Select the correct number: 'Thirty-three'",
      options: ["13", "303", "33", "30"],
      correctAnswer: 2
    },
    {
      id: 4,
      question: "Complete the sentence: My birthday is ___ July.",
      options: ["on", "at", "in", "to"],
      correctAnswer: 2 // 'in' July
    },
    {
      id: 5,
      question: "What is the 12th month of the year?",
      options: ["November", "January", "December", "October"],
      correctAnswer: 2
    }
  ]
};

export default function QuizPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Manejar selección
  const handleOptionClick = (index: number) => {
    setSelectedOption(index);
  };

  // Ir a la siguiente pregunta
  const handleNext = () => {
    // Verificar si la respuesta es correcta y sumar puntos
    if (selectedOption === quizData.questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < quizData.questions.length) {
      setCurrentQuestion(nextQuestion);
      setSelectedOption(null); // Resetear selección
    } else {
      setShowResult(true);
    }
  };

  // Calcular porcentaje final
  const percentage = Math.round((score / quizData.questions.length) * 100);
  const isPassed = percentage >= 70;

  // --- VISTA DE RESULTADOS ---
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
            Has respondido correctamente {score} de {quizData.questions.length} preguntas.
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
      
      {/* Barra de Progreso Superior */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between text-gray-400 text-sm mb-2">
          <span>Pregunta {currentQuestion + 1} de {quizData.questions.length}</span>
          <span>{Math.round(((currentQuestion + 1) / quizData.questions.length) * 100)}% Completado</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-pca-blue"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Tarjeta de Pregunta */}
      <div className="w-full max-w-2xl bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-8">
          {quizData.questions[currentQuestion].question}
        </h2>

        <div className="space-y-4 mb-8">
          {quizData.questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(index)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex justify-between items-center ${
                selectedOption === index 
                  ? 'bg-pca-blue/20 border-pca-blue text-white ring-1 ring-pca-blue' 
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-500'
              }`}
            >
              <span className="font-medium">{option}</span>
              {selectedOption === index && (
                <div className="w-3 h-3 bg-pca-blue rounded-full shadow-[0_0_10px_rgba(0,86,179,0.8)]"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button 
            variant="primary" 
            onClick={handleNext}
            // Deshabilitar si no ha seleccionado nada (opcional, aquí lo dejo manual)
             // disabled={selectedOption === null}
          >
            {currentQuestion === quizData.questions.length - 1 ? 'Finalizar Examen' : 'Siguiente Pregunta'}
          </Button>
        </div>
      </div>

    </div>
  );
}