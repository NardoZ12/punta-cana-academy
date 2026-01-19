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
    phone: '', // NUEVO: Campo de teléfono
    password: '',
    confirmPassword: '',
    userType: 'student' // Nuevo campo para tipo de usuario
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
    if (!formData.email || !formData.password || !formData.fullName || !formData.phone) {
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

    // Validación básica del teléfono (al menos 10 dígitos)
    const phoneDigits = formData.phone.replace(/\D/g, ''); // Remover caracteres no numéricos
    if (phoneDigits.length < 10) {
      setError('El número de teléfono debe tener al menos 10 dígitos');
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
            phone: formData.phone, // NUEVO: Agregamos el teléfono
            user_type: formData.userType,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      console.log('📋 Respuesta de Supabase:', { data, error: signUpError });

      if (signUpError) {
        console.error('❌ Error de Supabase:', signUpError);
        setError(signUpError.message);
        setIsLoading(false);
      } else {
        console.log('✅ Registro exitoso!');
        
        // Verificar si el email necesita confirmación
        if (data.user && !data.user.email_confirmed_at) {
          console.log('📧 Email necesita confirmación, redirigiendo a verificar-email');
          
          // Crear perfil en la base de datos (aunque no esté confirmado)
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: formData.fullName,
              phone: formData.phone, // NUEVO: Agregamos el teléfono al perfil
              user_type: formData.userType,
              email: formData.email
            });
          
          if (insertError && !insertError.message.includes('duplicate')) {
            console.error('❌ Error creando perfil:', insertError);
          }
          
          // Redirigir a la página de verificación con el email
          router.push(`/verificar-email?email=${encodeURIComponent(formData.email)}`);
          return;
        }
        
        // Si el email ya está confirmado, proceder normalmente
        console.log(`🎯 Email confirmado, redirigiendo a dashboard de ${formData.userType}`);
        
        // Redirigir según el tipo de usuario
        if (formData.userType === 'teacher') {
          router.push('/dashboard/teacher');
        } else {
          router.push('/dashboard/student');
        }
        
        // Refresh para asegurar que el middleware detecte los cambios
        router.refresh();
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      setError('Error inesperado. Por favor, intenta de nuevo.');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Formateo especial para el campo de teléfono
    if (name === 'phone') {
      // Remover todos los caracteres no numéricos excepto el +
      const digits = value.replace(/[^\d+]/g, '');
      
      // Formatear automáticamente (ejemplo: +1-809-123-4567)
      let formattedPhone = digits;
      if (digits.length > 1 && !digits.startsWith('+')) {
        formattedPhone = '+' + digits;
      }
      
      setFormData({
        ...formData,
        [name]: formattedPhone
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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
              <label htmlFor="userType" className="block text-sm font-medium text-gray-300 mb-3">
                ¿Cómo te vas a registrar?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, userType: 'student'})}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.userType === 'student'
                      ? 'border-pca-blue bg-pca-blue/20 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">🎓</div>
                  <div>Estudiante</div>
                  <div className="text-xs opacity-75">Aprende y certifícate</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, userType: 'teacher'})}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.userType === 'teacher'
                      ? 'border-pca-blue bg-pca-blue/20 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">👨‍🏫</div>
                  <div>Profesor</div>
                  <div className="text-xs opacity-75">Crea y enseña cursos</div>
                </button>
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                Número de Teléfono
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="Ej: +1-809-123-4567"
                  className="appearance-none block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-pca-blue focus:border-pca-blue sm:text-sm"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Incluye código de país. Ejemplo: +1-809-123-4567 (República Dominicana)
                </p>
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