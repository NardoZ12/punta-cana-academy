// src/app/dashboard/teacher/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';

// DATOS SIMULADOS (Tus grupos de Friusa)
const groups = [
  { id: 'A1-Morning', name: 'Nivel A1 - Mañana', students: 12, schedule: 'Lun-Mie 9:00 AM' },
  { id: 'B2-Evening', name: 'Nivel B2 - Noche', students: 8, schedule: 'Mar-Jue 7:00 PM' },
];

// DATOS SIMULADOS (Estudiantes del grupo A1)
const students = [
  { id: 1, name: "Ana García", progress: 85, status: "Active", lastExam: 92 },
  { id: 2, name: "Carlos Pérez", progress: 45, status: "Warning", lastExam: 65 },
  { id: 3, name: "Elena Díaz", progress: 90, status: "Active", lastExam: 98 },
  { id: 4, name: "Luis Miguel", progress: 15, status: "Inactive", lastExam: 0 },
];

export default function TeacherDashboard() {
  const [selectedGroup, setSelectedGroup] = useState(groups[0].id);

  return (
    <div className="min-h-screen bg-pca-black flex">
      
      {/* SIDEBAR PROFESOR (Más simple) */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-800 flex gap-2 items-center">
          <div className="relative w-8 h-8">
             <Image src="/images/logos/logo-pca.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="font-bold text-white">PCA Teacher</span>
        </div>
        
        <nav className="p-4 space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase px-3 mb-2">Mis Grupos</div>
          {groups.map(group => (
            <button 
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                selectedGroup === group.id ? 'bg-pca-blue/20 text-pca-blue border border-pca-blue/50' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <p className="font-bold">{group.name}</p>
              <p className="text-xs opacity-70">{group.schedule}</p>
            </button>
          ))}

          <div className="mt-8">
             <Button variant="outline" fullWidth>+ Crear Nuevo Grupo</Button>
          </div>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="ml-64 flex-1 p-8">
        
        {/* Header con Acciones Rápidas */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
            <p className="text-gray-400">Gestionando: <span className="text-pca-blue font-bold">Nivel A1 - Mañana</span></p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">Asignar Tarea</Button>
            <Button variant="primary">Crear Examen</Button>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm">Estudiantes Activos</p>
            <p className="text-3xl font-bold text-white">12</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm">Promedio del Grupo</p>
            <p className="text-3xl font-bold text-green-400">88%</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm">Tareas Pendientes de Revisar</p>
            <p className="text-3xl font-bold text-yellow-400">5</p>
          </div>
        </div>

        {/* TABLA DE ESTUDIANTES */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 text-gray-400 text-sm uppercase">
                <th className="p-4">Estudiante</th>
                <th className="p-4">Progreso Unidad</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Último Examen</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pca-blue flex items-center justify-center text-white font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${student.progress < 50 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${student.progress}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-400">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      student.status === 'Active' ? 'bg-green-500/20 text-green-400' : 
                      student.status === 'Warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {student.status === 'Active' ? 'Activo' : student.status === 'Warning' ? 'Riesgo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 text-white font-mono">
                    {student.lastExam > 0 ? `${student.lastExam}/100` : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/dashboard/teacher/student/${student.id}`}>
                      <button className="text-pca-blue hover:text-white text-sm font-medium transition-colors">
                        Ver Perfil & Calificar
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}