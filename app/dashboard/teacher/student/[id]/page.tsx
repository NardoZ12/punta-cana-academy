// src/app/dashboard/teacher/student/[id]/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/atoms/Button';
import Link from 'next/link';

export default function StudentDetailTeacherView({ params }: { params: { id: string } }) {
  // DATOS SIMULADOS DE JUAN PÉREZ
  const student = {
    name: "Juan Pérez",
    email: "juan@ejemplo.com",
    course: "Inglés A1 - The Foundations",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
    stats: {
      attendance: "92%",
      avgScore: 88,
      completedModules: "2/4"
    },
    grades: [
      { id: 1, activity: "Quiz: Numbers & Time", type: "Automático", score: 95, date: "05 Ene 2026" },
      { id: 2, activity: "Oral Presentation: Family", type: "Manual", score: 80, date: "08 Ene 2026" },
    ]
  };

  const [isGrading, setIsGrading] = useState(false);

  return (
    <div className="min-h-screen bg-pca-black p-8">
      
      {/* HEADER DE NAVEGACIÓN */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/teacher" className="text-gray-400 hover:text-white transition-colors">
          ← Volver al Panel
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">Detalle de Estudiante</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Perfil */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 text-center">
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-pca-blue mb-4 relative">
              <Image src={student.avatar} alt={student.name} fill className="object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{student.name}</h1>
            <p className="text-gray-400 text-sm mb-4">{student.email}</p>
            <div className="inline-block px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-pca-blue border border-gray-700">
              {student.course}
            </div>
            
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" fullWidth>Enviar Email</Button>
              <Button variant="secondary" fullWidth>WhatsApp</Button>
            </div>
          </div>

          {/* Estadísticas Rápidas */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-white font-bold mb-4">Métricas Clave</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-400 text-sm">Asistencia</span>
                <span className="text-green-400 font-bold">{student.stats.attendance}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-400 text-sm">Promedio</span>
                <span className="text-pca-blue font-bold">{student.stats.avgScore}/100</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-400 text-sm">Progreso</span>
                <span className="text-white font-bold">{student.stats.completedModules}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Calificaciones y Acciones */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tarjeta de Nueva Calificación */}
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pca-blue/10 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl font-bold text-white">Centro de Calificaciones</h2>
              <Button variant="primary" onClick={() => setIsGrading(!isGrading)}>
                {isGrading ? 'Cancelar' : '+ Nueva Nota'}
              </Button>
            </div>

            {isGrading && (
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-6 animate-fade-in-up">
                <h3 className="text-white font-bold mb-4">Registrar Evaluación Manual</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Actividad / Tarea</label>
                    <input type="text" placeholder="Ej. Exposición Oral" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-pca-blue" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Calificación (0-100)</label>
                    <input type="number" placeholder="90" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-pca-blue" />
                  </div>
                </div>
                <div className="mb-4">
                   <label className="text-xs text-gray-400 block mb-1">Feedback para el estudiante</label>
                   <textarea placeholder="Excelente pronunciación, mejorar entonación..." className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-pca-blue h-20"></textarea>
                </div>
                <div className="flex justify-end">
                  <Button variant="primary" onClick={() => alert('Calificación Guardada')}>Guardar Nota</Button>
                </div>
              </div>
            )}

            {/* Historial de Notas */}
            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                    <th className="py-3">Fecha</th>
                    <th className="py-3">Actividad</th>
                    <th className="py-3">Tipo</th>
                    <th className="py-3 text-right">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {student.grades.map(grade => (
                    <tr key={grade.id} className="text-sm">
                      <td className="py-4 text-gray-400">{grade.date}</td>
                      <td className="py-4 text-white font-medium">{grade.activity}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          grade.type === 'Automático' ? 'bg-purple-500/10 text-purple-400' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {grade.type}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className={`font-bold ${grade.score >= 90 ? 'text-green-400' : grade.score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {grade.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Progreso del Temario (Vista Profesor) */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-white font-bold mb-4">Progreso del Temario</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-black text-xs">✓</div>
                <span className="text-gray-400 line-through decoration-gray-600">Module 1: First Steps</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-black text-xs">✓</div>
                <span className="text-gray-400 line-through decoration-gray-600">Module 2: Numbers & Time</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-pca-blue"></div>
                <span className="text-white font-bold">Module 3: My World (Actual)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-gray-700"></div>
                <span className="text-gray-600">Module 4: Family Ties</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}