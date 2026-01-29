// Script de diagnóstico rápido para ejecutar en la consola del navegador
// Abrir DevTools (F12) y pegar este código en la consola

(function() {
  console.log('🚀 Iniciando diagnóstico rápido...');
  
  // Función principal de diagnóstico
  async function quickDiagnosis() {
    try {
      // 1. Verificar si hay elementos de autenticación en localStorage
      console.log('\n📱 Revisando localStorage...');
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth')
      );
      
      if (authKeys.length > 0) {
        console.log('✅ Claves de autenticación encontradas:', authKeys);
        authKeys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (parsed.access_token) {
                console.log(`✅ Token válido encontrado en ${key}`);
              }
            }
          } catch (e) {
            console.log(`⚠️ No se pudo parsear ${key}`);
          }
        });
      } else {
        console.log('❌ No se encontraron claves de autenticación');
      }

      // 2. Verificar si window.supabase está disponible
      console.log('\n🔧 Verificando cliente Supabase...');
      if (typeof window.supabase !== 'undefined') {
        console.log('✅ window.supabase está disponible');
        
        // Verificar sesión
        try {
          const session = await window.supabase.auth.getSession();
          if (session.data.session) {
            console.log('✅ Sesión activa:', {
              user: session.data.session.user.email,
              expires: new Date(session.data.session.expires_at * 1000)
            });
            
            // Verificar perfil
            const profile = await window.supabase
              .from('profiles')
              .select('*')
              .eq('id', session.data.session.user.id)
              .single();
            
            if (profile.data) {
              console.log('✅ Perfil encontrado:', profile.data);
              console.log(`👤 Tipo de usuario: ${profile.data.user_type}`);
              
              if (profile.data.user_type === 'teacher') {
                console.log('🎓 Usuario es PROFESOR - debería ir a /dashboard/teacher');
              } else if (profile.data.user_type === 'student') {
                console.log('📚 Usuario es ESTUDIANTE - debería ir a /dashboard/student');
              } else {
                console.log('❓ Tipo de usuario no reconocido:', profile.data.user_type);
              }
            } else {
              console.log('❌ Error obteniendo perfil:', profile.error);
            }
            
          } else {
            console.log('❌ No hay sesión activa');
          }
        } catch (error) {
          console.log('❌ Error verificando sesión:', error);
        }
      } else {
        console.log('❌ window.supabase NO está disponible');
        console.log('💡 Intentando importar desde módulos...');
        
        // Intentar crear cliente manualmente
        try {
          const { createClient } = await import('@/utils/supabase/client');
          const supabase = createClient();
          window.supabase = supabase; // Para uso futuro
          console.log('✅ Cliente Supabase creado manualmente');
          
          // Repetir verificación de sesión
          const session = await supabase.auth.getSession();
          if (session.data.session) {
            console.log('✅ Sesión activa con cliente manual:', session.data.session.user.email);
          } else {
            console.log('❌ No hay sesión activa');
          }
        } catch (importError) {
          console.log('❌ No se pudo importar cliente:', importError);
        }
      }

      // 3. Verificar URL actual y redirección esperada
      console.log('\n🌐 Información de navegación:');
      console.log('URL actual:', window.location.href);
      console.log('Pathname:', window.location.pathname);
      
      if (window.location.pathname === '/dashboard') {
        console.log('⚠️ Estás en /dashboard (página de redirección)');
        console.log('💡 Esta página debería redirigir automáticamente según el tipo de usuario');
      }

      // 4. Verificar errores en la consola
      console.log('\n🐛 Para ver errores de red, ve a la pestaña Network en DevTools');
      console.log('💡 Busca errores 406, 500, o problemas de CORS');
      
      // 5. Sugerir acciones
      console.log('\n🔧 Acciones recomendadas:');
      console.log('1. Si no hay sesión activa, ir a /login');
      console.log('2. Si hay sesión pero no perfil, crear perfil');
      console.log('3. Si el tipo de usuario es incorrecto, actualizar en Supabase');
      console.log('4. Si hay errores 406, verificar variables de entorno');
      
    } catch (error) {
      console.log('💥 Error en diagnóstico:', error);
    }
  }

  // Función para limpiar autenticación
  window.clearAuth = function() {
    console.log('🧹 Limpiando datos de autenticación...');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
        console.log('🗑️ Eliminado:', key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key);
        console.log('🗑️ Eliminado de sesión:', key);
      }
    });
    
    console.log('✅ Limpieza completada. Recarga la página para probar login fresco.');
  };

  // Función para forzar redirección manual
  window.goToDashboard = function(userType = 'student') {
    const url = `/dashboard/${userType}`;
    console.log(`🚀 Redirigiendo a: ${url}`);
    window.location.href = url;
  };

  // Ejecutar diagnóstico
  quickDiagnosis();

  console.log('\n🛠️ Funciones disponibles:');
  console.log('- quickDiagnosis() - Re-ejecutar este diagnóstico');
  console.log('- clearAuth() - Limpiar datos de autenticación');
  console.log('- goToDashboard("student") - Ir al dashboard de estudiante');
  console.log('- goToDashboard("teacher") - Ir al dashboard de profesor');

  // Hacer funciones globales
  window.quickDiagnosis = quickDiagnosis;

})();

console.log('📋 Diagnóstico completado. Revisa los resultados arriba.');