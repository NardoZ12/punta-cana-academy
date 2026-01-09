// src/app/(website)/registro/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulamos una petición al servidor (2 segundos)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      // Redirigimos al Dashboard después de mostrar el éxito
      setTimeout(() => {
        router.push('/dashboard/student');
      }, 2000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-pca-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 p-8 rounded-2xl border border-green-500/50 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">¡Registro Completado!</h2>
          <p className="text-gray-400 mb-6">Bienvenido a Punta Cana Academy. Te estamos redirigiendo a tu aula virtual...</p>
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2 }}
              className="h-full bg-green-500"
            />
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pca-black pt-20 pb-20 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">Comienza tu viaje hoy</h1>
          <p className="text-gray-400">Completa el formulario para crear tu perfil de estudiante.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Nombre Completo</label>
              <input required type="text" placeholder="Ej. Juan Pérez" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pca-blue outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Teléfono / WhatsApp</label>
              <input required type="tel" placeholder="Ej. 809-555-5555" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pca-blue outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Correo Electrónico</label>
            <input required type="email" placeholder="juan@ejemplo.com" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pca-blue outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Curso de Interés</label>
            <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pca-blue outline-none">
              <option>Inglés Intensivo (A1-C2)</option>
              <option>Desarrollo Web Full Stack</option>
              <option>Francés para Hotelería</option>
              <option>Otro / No estoy seguro</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Contraseña para tu cuenta</label>
            <input required type="password" placeholder="Crea una contraseña segura" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pca-blue outline-none" />
          </div>

          <Button variant="primary" fullWidth type="submit">
            {isSubmitting ? 'Procesando...' : 'Completar Inscripción'}
          </Button>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Al registrarte aceptas nuestros Términos de Servicio y Política de Privacidad.
          </p>
        </form>
      </div>
    </main>
  );
}