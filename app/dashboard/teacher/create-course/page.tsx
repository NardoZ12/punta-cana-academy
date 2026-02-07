'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';

export default function CreateCoursePage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    level: 'Principiante',
    modality: 'Online',
    schedule: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('Debes iniciar sesión para crear un curso');
        setLoading(false);
        return;
      }

      // 2. Convertir precio a número (0 si no es válido)
      const priceValue = parseFloat(formData.price.replace(/[^0-9.]/g, '')) || 0;

      // 3. Insertar curso
      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert({
          title: formData.title,
          description: formData.description,
          price: priceValue,
          level: formData.level,
          modality: formData.modality,
          schedule: formData.schedule,
          instructor_id: user.id,
          image_url: '/images/courses/default-course.jpg',
          is_published: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error al crear curso:', insertError);
        setError('Error al crear curso: ' + insertError.message);
        setLoading(false);
        return;
      }

      alert('¡Curso creado exitosamente! 🎉');
      router.push('/dashboard/teacher');

    } catch (err: any) {
      console.error('Error inesperado:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-black border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Crear Nuevo Curso</h1>
        <p className="text-gray-400 mb-8">Este curso aparecerá inmediatamente en la página web.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-300">Nombre del Curso</label>
            <input 
              name="title" required onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-blue-500 outline-none"
              placeholder="Ej: Marketing Digital Avanzado"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-300">Descripción Corta</label>
            <textarea 
              name="description" required onChange={handleChange} rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-blue-500 outline-none"
              placeholder="¿De qué trata el curso?"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Precio */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Precio (Texto)</label>
              <input 
                name="price" required onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3"
                placeholder="Ej: $99 USD"
              />
            </div>
            {/* Nivel */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Nivel</label>
              <select name="level" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3">
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Modalidad */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Modalidad</label>
              <select name="modality" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3">
                <option value="Online">Online</option>
                <option value="Presencial">Presencial (Friusa)</option>
                <option value="Híbrido">Híbrido</option>
              </select>
            </div>
            {/* Horario */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Horario</label>
              <input 
                name="schedule" onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3"
                placeholder="Ej: Mar y Jue 7:00 PM"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={() => router.push('/dashboard/teacher')} 
              className="flex-1 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <Button type="submit" disabled={loading} fullWidth className="flex-1">
              {loading ? 'Publicando...' : '🚀 Crear y Publicar'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}