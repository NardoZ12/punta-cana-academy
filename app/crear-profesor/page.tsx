'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function CreateTeacherProfile() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const createTeacherProfile = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Verificar usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No hay usuario logueado. Ve a /login primero.');
      }

      console.log('✅ Usuario encontrado:', user.email);

      // 2. Crear/actualizar perfil como profesor
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Profesor',
        user_type: 'teacher',
        language: 'es',
        phone: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 Creando perfil:', profileData);

      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (profileError) {
        throw new Error(`Error creando perfil: ${profileError.message}`);
      }

      console.log('✅ Perfil creado:', profileResult);
      setResult(`✅ ¡Perfil de PROFESOR creado exitosamente!
      
📋 Detalles:
• Tipo: ${profileResult.user_type}
• Email: ${profileResult.email}
• Nombre: ${profileResult.full_name}

🎉 Serás redirigido al dashboard en 3 segundos...`);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);

    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
    }

    setLoading(false);
  };

  const goToLogin = () => {
    window.location.href = '/login';
  };

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8">🎓 Crear Perfil de Profesor</h1>
        
        <div className="bg-gray-800 p-8 rounded-lg">
          {!result && !error && !loading && (
            <>
              <p className="text-gray-300 mb-6">
                Esta herramienta creará tu perfil como profesor en el sistema.
              </p>
              
              <button
                onClick={createTeacherProfile}
                className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-bold text-xl transition-colors"
              >
                🎓 Crear Perfil de PROFESOR
              </button>
            </>
          )}

          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-xl">Creando perfil de profesor...</p>
            </div>
          )}

          {result && (
            <div className="text-left">
              <div className="bg-green-600 p-4 rounded-lg mb-4">
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            </div>
          )}

          {error && (
            <div className="text-left">
              <div className="bg-red-600 p-4 rounded-lg mb-6">
                <h3 className="font-bold mb-2">❌ Error:</h3>
                <p className="text-sm">{error}</p>
              </div>
              
              <div className="space-x-4">
                <button
                  onClick={goToLogin}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
                >
                  🔐 Ir a Login
                </button>
                <button
                  onClick={createTeacherProfile}
                  className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg"
                >
                  🔄 Reintentar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 space-x-4">
          <button
            onClick={goToLogin}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            🔐 Ir a Login
          </button>
          <button
            onClick={goToDashboard}
            className="text-green-400 hover:text-green-300 underline"
          >
            📊 Ir a Dashboard
          </button>
          <a 
            href="/diagnostico" 
            className="text-purple-400 hover:text-purple-300 underline"
          >
            🔍 Diagnóstico Completo
          </a>
        </div>
      </div>
    </div>
  );
}