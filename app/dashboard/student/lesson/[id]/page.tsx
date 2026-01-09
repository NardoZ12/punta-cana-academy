// src/app/dashboard/student/lesson/[id]/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import Link from 'next/link';

export default function LessonPage({ params }: { params: { id: string } }) {
  // SIMULAMOS LOS DATOS DE LA LECCIÓN
  // En el futuro, esto vendrá de la base de datos usando el 'params.id'
  const lessonData = {
    title: "Days of the Week & Months",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Video de ejemplo (Rickroll preventivo jaja)
    description: "En esta lección aprenderemos a pronunciar correctamente los días de la semana y los meses del año. Es fundamental para agendar citas en inglés.",
    resources: [
      { name: "Guía de Pronunciación (PDF)", size: "1.2 MB" },
      { name: "Lista de Vocabulario (Excel)", size: "500 KB" }
    ],
    nextLessonId: "numbers-1-100"
  };

  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <div className="flex flex-col h-full bg-pca-black text-white">
      
      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN DE LA CLASE */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/student" className="text-gray-400 hover:text-white transition-colors">
            ← Volver al Dashboard
          </Link>
          <div className="h-6 w-px bg-gray-700 mx-2"></div>
          <h1 className="font-bold truncate max-w-md">{lessonData.title}</h1>
        </div>
        <div className="text-sm text-gray-400 hidden md:block">
          Módulo 2: Numbers & Time
        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL (Grid) */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* COLUMNA IZQUIERDA: Video y Contenido (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-gray-700">
          
          {/* REPRODUCTOR DE VIDEO (Responsive) */}
          <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 mb-8 relative">
             <iframe 
               width="100%" 
               height="100%" 
               src={lessonData.videoUrl} 
               title="Video Player" 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
               allowFullScreen
               className="absolute inset-0"
             ></iframe>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Descripción de la clase</h2>
              <button 
                onClick={() => setIsCompleted(!isCompleted)}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  isCompleted 
                    ? 'bg-green-500/20 text-green-500 border border-green-500' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                }`}
              >
                {isCompleted ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Completada
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                    Marcar como vista
                  </>
                )}
              </button>
            </div>

            <p className="text-gray-400 leading-relaxed mb-8">
              {lessonData.description}
            </p>

            {/* SECCIÓN DE RECURSOS */}
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-pca-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Recursos Descargables
            </h3>
            <div className="grid gap-3 mb-12">
              {lessonData.resources.map((res, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-pca-blue/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-gray-400 group-hover:text-pca-blue transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">{res.name}</p>
                      <p className="text-xs text-gray-500">{res.size}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
              ))}
            </div>

            {/* SECCIÓN DE EXAMEN */}
            <div className="mt-12 p-6 bg-gray-800/50 rounded-xl border border-gray-700 text-center">
              <h3 className="text-xl font-bold text-white mb-2">¿Listo para ponerte a prueba?</h3>
              <p className="text-gray-400 mb-6">Completa el examen para desbloquear el siguiente módulo.</p>
              
              <Link href="/dashboard/student/quiz/numbers-quiz">
                <Button variant="primary">
                  Comenzar Examen
                </Button>
              </Link>
            </div>

            {/* SECCIÓN DE COMENTARIOS / PREGUNTAS (Visual) */}
            <div className="border-t border-gray-800 pt-8">
               <h3 className="text-lg font-bold mb-4">Preguntas de la clase</h3>
               <textarea 
                 placeholder="¿Tienes alguna duda? Escribe aquí para que el profesor te responda..."
                 className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-pca-blue outline-none resize-none h-32"
               ></textarea>
               <div className="mt-4 flex justify-end">
                 <Button variant="secondary">Enviar Pregunta</Button>
               </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Playlist del Módulo (Sidebar) */}
        <div className="w-full lg:w-80 border-l border-gray-800 bg-gray-900 flex flex-col h-[50vh] lg:h-auto">
          <div className="p-4 border-b border-gray-800 font-bold text-gray-400 uppercase text-xs tracking-wider">
            Contenido del Módulo
          </div>
          <div className="flex-1 overflow-y-auto">
             {/* Lista simulada de temas */}
             {["Greetings & Introductions", "Numbers 1-100", "Days of the Week & Months", "Verb To Be", "Family Members"].map((topic, idx) => {
               const isActive = idx === 2; // Simulamos que estamos en el 3ro
               return (
                 <div 
                   key={idx} 
                   className={`p-4 border-b border-gray-800 cursor-pointer transition-colors flex gap-3 ${
                     isActive ? 'bg-pca-blue/10 border-l-4 border-l-pca-blue' : 'hover:bg-gray-800 border-l-4 border-l-transparent'
                   }`}
                 >
                   <div className="pt-1">
                      {idx < 2 ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-black">
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 ${isActive ? 'border-pca-blue' : 'border-gray-600'}`}></div>
                      )}
                   </div>
                   <div>
                     <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                       {topic}
                     </p>
                     <p className="text-xs text-gray-600 mt-1">10 min</p>
                   </div>
                 </div>
               )
             })}
          </div>
        </div>

      </div>
    </div>
  );
}