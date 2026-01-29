// Script para debuggear problemas de autenticación en producción
async function debugAuthProduction() {
  console.log('🔍 Iniciando diagnóstico de autenticación en producción...');
  
  // Verificar variables de entorno de Supabase
  console.log('\n📋 Variables de entorno:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada');
  
  if (typeof window !== 'undefined') {
    console.log('\n🌐 Variables en el navegador:');
    console.log('URL:', window.location.href);
    console.log('User Agent:', navigator.userAgent);
    
    // Verificar si Supabase está disponible
    if (typeof window.supabase !== 'undefined' || window._supabase) {
      console.log('✅ Supabase client disponible en window');
    } else {
      console.log('❌ Supabase client NO disponible en window');
    }
    
    // Verificar localStorage
    try {
      const authToken = localStorage.getItem('supabase.auth.token');
      if (authToken) {
        console.log('✅ Token de autenticación encontrado en localStorage');
      } else {
        console.log('❌ No hay token de autenticación en localStorage');
      }
    } catch (error) {
      console.log('❌ Error accediendo a localStorage:', error);
    }
    
    // Verificar sessionStorage
    try {
      const sessionData = Object.keys(sessionStorage)
        .filter(key => key.includes('supabase'))
        .map(key => ({ key, value: sessionStorage.getItem(key) }));
      
      if (sessionData.length > 0) {
        console.log('✅ Datos de sesión encontrados:', sessionData.length, 'items');
      } else {
        console.log('❌ No hay datos de sesión de Supabase');
      }
    } catch (error) {
      console.log('❌ Error accediendo a sessionStorage:', error);
    }
  }
}

// Ejecutar diagnóstico
if (typeof window !== 'undefined') {
  // En el navegador
  window.debugAuthProduction = debugAuthProduction;
  console.log('🚀 Función debugAuthProduction() disponible en la consola del navegador');
} else {
  // En Node.js
  debugAuthProduction();
}

// Función para verificar la conectividad con Supabase
async function testSupabaseConnection() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NO_CONFIGURED';
    console.log(`\n🔗 Probando conexión a Supabase: ${supabaseUrl}`);
    
    if (supabaseUrl === 'NO_CONFIGURED') {
      console.log('❌ URL de Supabase no configurada');
      return;
    }
    
    // Hacer una petición básica a Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Conexión exitosa con Supabase');
    } else {
      console.log(`❌ Error de conexión: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Error probando conexión:', error.message);
  }
}

// Exportar funciones para uso en el navegador
if (typeof window !== 'undefined') {
  window.testSupabaseConnection = testSupabaseConnection;
}

module.exports = {
  debugAuthProduction,
  testSupabaseConnection
};