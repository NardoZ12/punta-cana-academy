// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/atoms/Button';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    
    // Simulamos un login exitoso redirigiendo según el rol
    if (role === 'student') {
      router.push('/dashboard/student');
    } else {
      router.push('/dashboard/teacher');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-pca-black p-4 relative overflow-hidden">
      
      {/* Fondo Decorativo */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2000"
          alt="Background" 
          fill 
          className="object-cover opacity-20 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pca-black via-pca-black/80 to-pca-black/60" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-gray-900/90 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl relative z-10"
      >
        {/* Header del Login */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="relative w-20 h-20 mx-auto">
               <Image src="/images/logos/logo-pca.png" alt="PCA Logo" fill className="object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Bienvenido de nuevo</h1>
          <p className="text-gray-400 text-sm mt-2">Ingresa a tu plataforma educativa</p>
        </div>

        {/* Selector de Rol (Estudiante vs Profesor) */}
        <div className="flex p-1 bg-gray-800 rounded-lg mb-8">
          <button
            onClick={() => setRole('student')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              role === 'student' 
                ? 'bg-pca-blue text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Soy Estudiante
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              role === 'teacher' 
                ? 'bg-white text-pca-black shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Soy Profesor
          </button>
        </div>

        {/* Formulario */}
        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">
              {role === 'student' ? 'Correo institucional o personal' : 'Correo de docente'}
            </label>
            <input 
              type="email" 
              placeholder="nombre@ejemplo.com"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pca-blue outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">
              Contraseña
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pca-blue outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-700 bg-gray-800 text-pca-blue focus:ring-pca-blue" />
              <span className="text-gray-400">Recordarme</span>
            </label>
            <Link href="#" className="text-pca-blue hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button 
            variant={role === 'student' ? 'primary' : 'secondary'} 
            fullWidth 
            type="submit"
          >
            {role === 'student' ? 'Entrar al Aula Virtual' : 'Acceder al Panel Docente'}
          </Button>
        </form>

        {/* Footer del Login */}
        <div className="mt-8 text-center text-sm text-gray-500">
          ¿No tienes una cuenta?{' '}
          <Link href="/contacto" className="text-white hover:text-pca-blue font-medium transition-colors">
            Contacta a Admisiones
          </Link>
        </div>
      </motion.div>
    </main>
  );
}