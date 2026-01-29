'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function DiagnosticPage() {
  const [diagnostic, setDiagnostic] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // 1. Verificar variables de entorno
      results.environment = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada',
      };

      // 2. Verificar sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      results.session = {
        exists: sessionData.session ? '✅ Activa' : '❌ No hay sesión',
        user: sessionData.session?.user?.email || 'No disponible',
        userId: sessionData.session?.user?.id || 'No disponible',
        error: sessionError?.message || 'Sin errores'
      };

      if (sessionData.session?.user) {
        // 3. Verificar perfil del usuario
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single();

        results.profile = {
          exists: profileData ? '✅ Perfil encontrado' : '❌ Sin perfil',
          userType: profileData?.user_type || 'No definido',
          fullName: profileData?.full_name || 'No definido',
          email: profileData?.email || 'No definido',
          error: profileError?.message || 'Sin errores',
          needsCreation: !profileData
        };

        setUserProfile(profileData);

        // 4. Verificar acceso a tablas relacionadas
        try {
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('id')
            .limit(1);

          results.tables = {
            courses: coursesError ? `❌ Error: ${coursesError.message}` : '✅ Accesible',
          };
        } catch (tableError) {
          results.tables = {
            courses: `❌ Error: ${tableError}`,
          };
        }

        // 5. Verificar políticas RLS
        try {
          const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', sessionData.session.user.id);

          results.rls = {
            profileAccess: testError ? `❌ Error: ${testError.message}` : '✅ Acceso permitido',
          };
        } catch (rlsError) {
          results.rls = {
            profileAccess: `❌ Error: ${rlsError}`,
          };
        }
      }

      setDiagnostic(results);
    } catch (error: any) {
      setError(error.message);
      console.error('Error en diagnóstico:', error);
    }

    setLoading(false);
  };

  const createMissingProfile = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        alert('No hay sesión activa');
        return;
      }

      const profileData = {
        id: sessionData.session.user.id,
        email: sessionData.session.user.email,
        full_name: sessionData.session.user.user_metadata?.full_name || 'Usuario',
        user_type: 'teacher', // Por defecto crear como profesor
        language: 'es'
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select();

      if (error) {
        alert(`Error creando perfil: ${error.message}`);
      } else {
        alert('✅ Perfil de PROFESOR creado exitosamente!');
        runDiagnostic(); // Re-ejecutar diagnóstico
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const updateUserType = async (newType: 'student' | 'teacher' | 'admin') => {
    if (!userProfile?.id) {
      alert('No hay perfil para actualizar');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newType })
        .eq('id', userProfile.id);

      if (error) {
        alert(`Error actualizando tipo: ${error.message}`);
      } else {
        alert(`Tipo de usuario actualizado a: ${newType}`);
        runDiagnostic(); // Re-ejecutar diagnóstico
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="mt-4">Ejecutando diagnóstico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Diagnóstico del Sistema</h1>

        {error && (
          <div className="bg-red-600 p-4 rounded mb-6">
            <h2 className="font-bold">Error General:</h2>
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-6">
          {/* Variables de Entorno */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">🌐 Variables de Entorno</h2>
            {Object.entries(diagnostic.environment || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2">
                <span>{key}:</span>
                <span>{value as string}</span>
              </div>
            ))}
          </div>

          {/* Sesión */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">👤 Sesión de Usuario</h2>
            {Object.entries(diagnostic.session || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2">
                <span>{key}:</span>
                <span className="text-right">{value as string}</span>
              </div>
            ))}
          </div>

          {/* Perfil */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">📝 Perfil de Usuario</h2>
            {diagnostic.profile ? (
              <>
                {Object.entries(diagnostic.profile).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2">
                    <span>{key}:</span>
                    <span className="text-right">{value as string}</span>
                  </div>
                ))}
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => updateUserType('student')}
                    className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Hacer Estudiante
                  </button>
                  <button
                    onClick={() => updateUserType('teacher')}
                    className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
                  >
                    Hacer Profesor
                  </button>
                  <button
                    onClick={() => updateUserType('admin')}
                    className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Hacer Admin
                  </button>
                </div>
              </>
            ) : (
              <div>
                <p className="text-yellow-400 mb-4">⚠️ No se encontró perfil para el usuario actual</p>
                <p className="text-sm text-gray-400 mb-4">
                  Para usar el sistema necesitas tener un perfil. Haz clic en el botón de abajo para crear uno como PROFESOR.
                </p>
                <button
                  onClick={createMissingProfile}
                  className="bg-green-600 px-6 py-3 rounded-lg hover:bg-green-700 font-bold"
                >
                  🎓 Crear Perfil de PROFESOR
                </button>
              </div>
            )}
          </div>

          {/* Tablas */}
          {diagnostic.tables && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">🗃️ Acceso a Tablas</h2>
              {Object.entries(diagnostic.tables).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2">
                  <span>{key}:</span>
                  <span className="text-right">{value as string}</span>
                </div>
              ))}
            </div>
          )}

          {/* RLS */}
          {diagnostic.rls && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">🔒 Políticas RLS</h2>
              {Object.entries(diagnostic.rls).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2">
                  <span>{key}:</span>
                  <span className="text-right">{value as string}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={runDiagnostic}
            className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 font-bold"
          >
            🔄 Re-ejecutar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
}