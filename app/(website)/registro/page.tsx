'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client'; // Importamos tu nuevo cliente

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // PRUEBA INICIAL - Solo para ver si la función se ejecuta
    console.log('🚀 FUNCIÓN EJECUTADA!');
    alert('La función se ejecutó - paso 1');
    
    setError('');
    setIsLoading(true);

    console.log('🔍 Iniciando registro con datos:', {
      email: formData.email,
      fullName: formData.fullName,
      passwordLength: formData.password.length
    });

    // 1. Validaciones básicas
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Por favor, llena todos los campos');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      // 2. CONEXIÓN REAL CON SUPABASE
      console.log('🔗 Creando cliente de Supabase...');
      const supabase = createClient();
      
      console.log('📧 Enviando datos a Supabase...');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      console.log('📋 Respuesta de Supabase:', { data, error: signUpError });

      if (signUpError) {
        console.error('❌ Error de Supabase:', signUpError);
        setError(signUpError.message);
        setIsLoading(false);
      } else {
        console.log('✅ Registro exitoso!');
        alert('¡Cuenta creada! Revisa tu correo para confirmar (si está activado) o inicia sesión.');
        router.push('/dashboard/student'); 
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      setError('Error inesperado. Por favor, intenta de nuevo.');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-pca-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="text-3xl font-bold text-white tracking-wider mb-6 inline-block">
          PCA
        </Link>
        <h2 className="text-3xl font-extrabold text-white">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          ¿Ya eres estudiante?{' '}
          <Link href="/login" className="font-medium text-pca-blue hover:text-white transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-gray-800">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                Nombre Completo
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-pca-blue focus:border-pca-blue sm:text-sm"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-pca-blue focus:border-pca-blue sm:text-sm"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-pca-blue focus:border-pca-blue sm:text-sm"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirmar Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-pca-blue focus:border-pca-blue sm:text-sm"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Button variant="primary" fullWidth disabled={isLoading} type="submit">
                {isLoading ? 'Creando cuenta...' : 'Registrarse'}
              </Button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}