// src/app/dashboard/student/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import Link from 'next/link';

// DATOS DE EJEMPLO (Simulando tu Base de Datos del Nivel A1)
const currentLevel = {
  code: "A1",
  title: "The Foundations",
  progress: 15, // Porcentaje completado
  modules: [
    {
      id: 1,
      title: "Module 1: First Steps",
      topics: ["Greetings & Introductions", "Verb To Be (Affirmative)", "Alphabet & Spelling"],
      status: "completed", // Ya lo hizo
      score: 100
    },
    {
      id: 2,
      title: "Module 2: Numbers & Time",
      topics: ["Numbers 1-100", "Days of the Week", "Months & Dates"],
      status: "in-progress", // Aquí está ahora
      currentTopic: "Days of the Week"
    },
    {
      id: 3,
      title: "Module 3: My World",
      topics: ["Common Objects", "Plurals (s/es/ies)", "Demonstratives (This/That)"],
      status: "locked", // Candado
    },
    {
      id: 4,
      title: "Module 4: Family Ties",
      topics: ["Family Members", "Possessive Adjectives", "Genitive 's"],
      status: "locked",
    }
  ]
};

export default function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-pca-black flex">
      
      {/* 1. SIDEBAR (Navegación Izquierda) */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col fixed h-full z-20`}>
        <div className="p-6 flex items-center justify-center border-b border-gray-800">
          <div className="relative w-10 h-10">
            <Image src="/images/logos/logo-pca.png" alt="Logo" fill className="object-contain" />
          </div>
          {sidebarOpen && <span className="ml-3 font-bold text-white">PCA Student</span>}
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          {['Mi Curso', 'Calificaciones', 'Recursos', 'Comunidad'].map((item, idx) => (
            <button key={idx} className={`w-full flex items-center p-3 rounded-lg transition-colors ${idx === 0 ? 'bg-pca-blue text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center mr-3">
                {/* Icono placeholder */}
                <span className="text-xs">{item[0]}</span>
              </div>
              {sidebarOpen && <span>{item}</span>}
            </button>
          ))}
        </nav>

        {/* Perfil Miniatura Abajo */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden relative">
               <Image src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100" alt="User" fill className="object-cover" />
            </div>
            {sidebarOpen && (
              <div className="text-sm">
                <p className="text-white font-bold">Juan Pérez</p>
                <p className="text-pca-blue text-xs">Estudiante A1</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. CONTENIDO PRINCIPAL (Derecha) */}
      <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        {/* Header de Bienvenida */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">¡Hola, Juan! 👋</h1>
            <p className="text-gray-400">Continúa aprendiendo donde lo dejaste.</p>
          </div>
          <Button variant="outline" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '<<' : '>>'}
          </Button>
        </header>

        {/* Tarjeta de Nivel Actual */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-blue-900 to-gray-900 rounded-2xl p-8 mb-12 border border-gray-700 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-pca-blue text-white font-bold px-3 py-1 rounded text-sm">NIVEL {currentLevel.code}</span>
                <h2 className="text-2xl font-bold text-white">{currentLevel.title}</h2>
              </div>
              
              {/* Barra de Progreso */}
              <div className="mb-2 flex justify-between text-sm text-gray-300">
                <span>Progreso General</span>
                <span>{currentLevel.progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pca-blue rounded-full transition-all duration-1000" 
                  style={{ width: `${currentLevel.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10 text-center min-w-[200px]">
              <p className="text-gray-300 text-sm mb-1">Siguiente Lección</p>
              <p className="text-white font-bold text-lg mb-4">Days of the Week</p>
              
              {/* CONECTAMOS EL LINK AQUÍ */}
              <Link href="/dashboard/student/lesson/days-of-the-week">
                <Button variant="primary" fullWidth>Continuar ▶</Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Lista de Módulos (El Camino de Aprendizaje) */}
        <h3 className="text-xl font-bold text-white mb-6">Tu Ruta de Aprendizaje</h3>
        <div className="space-y-4">
          {currentLevel.modules.map((module, index) => (
            <motion.div 
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-xl border transition-all ${
                module.status === 'locked' 
                  ? 'bg-gray-900/50 border-gray-800 opacity-60' 
                  : 'bg-gray-900 border-gray-700 hover:border-pca-blue/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Icono de Estado */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    module.status === 'completed' ? 'bg-green-500/20 border-green-500 text-green-500' :
                    module.status === 'in-progress' ? 'bg-pca-blue/20 border-pca-blue text-pca-blue' :
                    'bg-gray-800 border-gray-600 text-gray-500'
                  }`}>
                    {module.status === 'completed' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    {module.status === 'in-progress' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {module.status === 'locked' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white">{module.title}</h4>
                    <p className="text-sm text-gray-400">
                      {module.status === 'completed' ? `Calificación: ${module.score}/100` : `${module.topics.length} temas`}
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex gap-2">
                  {module.status !== 'locked' && (
                     <Button variant={module.status === 'completed' ? 'outline' : 'primary'}>
                       {module.status === 'completed' ? 'Repasar' : 'Entrar'}
                     </Button>
                  )}
                </div>
              </div>

              {/* Lista de temas (visible si no está bloqueado) */}
              {module.status !== 'locked' && (
                <div className="mt-4 pl-14 space-y-2 border-l-2 border-gray-800 ml-5">
                  {module.topics.map((topic, i) => (
                    <div key={i} className="text-sm text-gray-400 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${module.status === 'completed' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                      {topic}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

      </main>
    </div>
  );
}