// Script para eliminar TODOS los usuarios de Supabase (incluyendo auth)
// ⚠️ CUIDADO: Este script eliminará permanentemente todos los usuarios
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function eliminarTodosLosUsuarios() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Necesitas esta clave admin

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno no encontradas')
    console.log('Necesitas:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- SUPABASE_SERVICE_ROLE_KEY (service role key)')
    return
  }

  // Cliente admin con service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🔧 Conectando a Supabase como admin...')

  try {
    // 1. Mostrar usuarios antes de eliminar
    console.log('\n📋 USUARIOS ACTUALES:')
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, user_type, created_at')
      .order('created_at', { ascending: false })
    
    if (profiles && profiles.length > 0) {
      profiles.forEach(user => {
        console.log(`- ${user.full_name} (${user.user_type}) - ID: ${user.id.substring(0, 8)}...`)
      })
      console.log(`\nTotal: ${profiles.length} usuarios`)
    } else {
      console.log('No hay usuarios en la tabla profiles')
    }

    // 2. Confirmar eliminación
    console.log('\n⚠️  ¿Estás seguro que quieres eliminar TODOS los usuarios?')
    console.log('Esta acción NO se puede deshacer.')
    console.log('Para continuar, ejecuta: node eliminar-todos-usuarios-completo.js --confirmar')
    
    if (!process.argv.includes('--confirmar')) {
      console.log('\n❌ Operación cancelada. Agrega --confirmar para proceder.')
      return
    }

    console.log('\n🗑️  Iniciando eliminación de usuarios...')

    // 3. Eliminar datos relacionados (orden importante para FK)
    console.log('Eliminando quiz_attempts...')
    await supabase.from('quiz_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Eliminando task_submissions...')
    await supabase.from('task_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Eliminando lesson_progress...')
    await supabase.from('lesson_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Eliminando course_enrollments...')
    await supabase.from('course_enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Eliminando notification_settings...')
    await supabase.from('notification_settings').delete().neq('user_id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Eliminando profiles...')
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 4. Eliminar usuarios de auth (requiere service role)
    console.log('Obteniendo usuarios de autenticación...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios auth:', authError)
    } else if (authUsers.users && authUsers.users.length > 0) {
      console.log(`Eliminando ${authUsers.users.length} usuarios de autenticación...`)
      
      for (const user of authUsers.users) {
        console.log(`Eliminando usuario auth: ${user.email}`)
        const { error } = await supabase.auth.admin.deleteUser(user.id)
        if (error) {
          console.error(`Error eliminando ${user.email}:`, error)
        }
      }
    }

    console.log('\n✅ ELIMINACIÓN COMPLETADA!')
    console.log('Todos los usuarios han sido eliminados exitosamente.')
    console.log('\n💡 Ahora puedes ejecutar create-test-users.js para crear usuarios de prueba.')

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error)
  }
}

// Ejecutar el script
eliminarTodosLosUsuarios()