'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';

export default function StudentDetail() {
  const { id } = useParams(); // Esto captura el ID de la URL
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [newGrade, setNewGrade] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchStudentData() {
      // 1. Si el ID parece un email (error común), intentamos buscar por email
      const isEmail = (id as string).includes('@');
      
      let studentId = id;

      if (isEmail) {
        // Truco por si la URL llegó con email
        const { data: userByEmail } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', id)
          .single();
        if (userByEmail) studentId = userByEmail.id;
      }

      // 2. Cargar datos del estudiante
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      // 3. Cargar inscripción y curso
      // Nota: Traemos la primera inscripción que encontremos para este profe
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', studentId);
      
      if (profile) setStudent(profile);
      if (enrollments && enrollments.length > 0) {
        setEnrollment(enrollments[0]); // Tomamos el primer curso activo
        setNewGrade(enrollments[0].grade || '');
      }
      
      setLoading(false);
    }

    if (id) fetchStudentData();
  }, [id]);

  const handleUpdateGrade = async () => {
    if (!enrollment) return;
    
    // 👇 Solo enviamos el 'grade', nada más.
    const { error } = await supabase
      .from('enrollments')
      .update({ 
        grade: parseFloat(newGrade) 
      })
      .eq('id', enrollment.id);

    if (!error) {
      alert('¡Nota guardada! 💾');
      // router.refresh(); // Opcional: recargar si quieres ver el cambio reflejado
    } else {
      console.error(error); // Para ver el error real si pasa algo
      alert('Error al guardar');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Cargando expediente...</div>;
  if (!student) return <div className="min-h-screen bg-gray-900 text-white p-8">Estudiante no encontrado.</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <Link href="/dashboard/teacher" className="text-gray-400 hover:text-white mb-6 inline-block">
        ← Volver al Panel
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* TARJETA DE PERFIL */}
        <div className="bg-black p-8 rounded-2xl border border-gray-800 text-center h-fit">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            {student.full_name?.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold">{student.full_name}</h2>
          <p className="text-gray-400 text-sm mb-6">{student.email}</p>
          
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-left">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Curso Actual</p>
            <p className="font-medium text-blue-400">{enrollment?.courses?.title || 'Sin curso asignado'}</p>
          </div>
        </div>

        {/* ZONA DE CALIFICACIÓN */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Panel de Progreso */}
          <div className="bg-black p-8 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold mb-6">Desempeño Académico</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900 p-4 rounded-xl">
                <p className="text-gray-400 text-xs uppercase">Progreso del Curso</p>
                <p className="text-3xl font-bold mt-1">{enrollment?.progress}%</p>
                <div className="w-full bg-gray-800 h-1.5 mt-3 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full" style={{width: `${enrollment?.progress}%`}}></div>
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded-xl">
                 <p className="text-gray-400 text-xs uppercase">Estado</p>
                 <span className="inline-block mt-2 px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm font-bold border border-green-900">
                   Activo
                 </span>
              </div>
            </div>

            {/* FORMULARIO DE NOTA */}
            <div className="border-t border-gray-800 pt-6">
              <label className="block text-sm font-bold mb-2 text-gray-300">Calificación Final (0-100)</label>
              <div className="flex gap-4">
                <input 
                  type="number" 
                  max="100"
                  min="0"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-lg focus:border-blue-500 focus:outline-none w-32"
                  placeholder="Ej: 95"
                />
                <Button onClick={handleUpdateGrade} disabled={saving}>
                  {saving ? 'Guardando...' : '💾 Guardar Nota'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Al guardar, el estudiante verá esta nota en su panel inmediatamente.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}