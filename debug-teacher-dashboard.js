// Script para diagnosticar problemas del dashboard de profesores
const { createClient } = require('@supabase/supabase-js')

// Configurar el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'tu-url-aqui'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'tu-key-aqui'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugTeacherDashboard() {
  try {
    console.log('🔍 Iniciando diagnóstico del dashboard de profesores...\n')

    // 1. Verificar conexión a Supabase
    console.log('1. Verificando conexión...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError.message)
      return
    }
    console.log('✅ Conexión exitosa\n')

    // 2. Verificar políticas RLS
    console.log('2. Verificando políticas RLS...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'profiles' })
      .single()
    
    if (policiesError) {
      console.log('⚠️ No se pueden verificar políticas directamente')
    } else {
      console.log('Políticas encontradas:', policies)
    }

    // 3. Intentar leer perfiles como usuario anónimo
    console.log('\n3. Probando lectura de perfiles (anónimo)...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, user_type')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Error leyendo perfiles:', profilesError.message)
      console.error('💡 Esto sugiere un problema con las políticas RLS')
    } else {
      console.log('✅ Perfiles leídos:', profiles.length, 'encontrados')
      console.log('Ejemplo:', profiles[0])
    }

    // 4. Verificar usuarios autenticados actualmente
    console.log('\n4. Verificando sesión actual...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('⚠️ No hay usuario autenticado actualmente')
    } else if (user) {
      console.log('✅ Usuario autenticado:', user.email)
      
      // Intentar obtener perfil del usuario actual
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (userProfileError) {
        console.error('❌ Error obteniendo perfil del usuario:', userProfileError.message)
      } else {
        console.log('✅ Perfil del usuario:', userProfile.full_name, '- Tipo:', userProfile.user_type)
      }
    }

    // 5. Verificar tablas relacionadas
    console.log('\n5. Verificando tablas relacionadas...')
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, instructor_id')
      .limit(3)
    
    if (coursesError) {
      console.error('❌ Error leyendo cursos:', coursesError.message)
    } else {
      console.log('✅ Cursos encontrados:', courses.length)
    }

    console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:')
    console.log('- Conexión:', connectionError ? '❌' : '✅')
    console.log('- Lectura perfiles:', profilesError ? '❌' : '✅')
    console.log('- Usuario autenticado:', userError ? '❌' : user ? '✅' : '⚠️')
    console.log('- Lectura cursos:', coursesError ? '❌' : '✅')
    
    if (profilesError) {
      console.log('\n🔧 SOLUCIÓN RECOMENDADA:')
      console.log('Ejecuta el script arreglar-rls.sql en el SQL Editor de Supabase')
      console.log('para arreglar las políticas Row Level Security')
    }

  } catch (error) {
    console.error('💥 Error general en el diagnóstico:', error)
  }
}

// Ejecutar diagnóstico
debugTeacherDashboard()