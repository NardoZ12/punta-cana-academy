// Script SIMPLE para eliminar solo datos de usuarios (NO auth)
// Este script elimina los perfiles y datos relacionados, pero NO los registros de autenticación
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function limpiarDatosUsuarios() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('🔧 Conectando a Supabase...')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables de entorno no encontradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // 1. Mostrar usuarios actuales
    console.log('\n📋 USUARIOS ACTUALES EN PROFILES:')
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
      return
    }

    console.log('\n🗑️  Eliminando datos de usuarios (NO se eliminarán de auth.users)...')

    // 2. Eliminar datos en orden correcto para evitar errores FK
    console.log('Eliminando quiz_attempts...')
    const { error: quizError } = await supabase
      .from('quiz_attempts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (quizError) console.log('Error quiz_attempts:', quizError.message)

    console.log('Eliminando task_submissions...')
    const { error: taskError } = await supabase
      .from('task_submissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (taskError) console.log('Error task_submissions:', taskError.message)

    console.log('Eliminando lesson_progress...')
    const { error: lessonError } = await supabase
      .from('lesson_progress')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (lessonError) console.log('Error lesson_progress:', lessonError.message)

    console.log('Eliminando course_enrollments...')
    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (enrollmentError) console.log('Error course_enrollments:', enrollmentError.message)

    console.log('Eliminando notification_settings...')
    const { error: notifError } = await supabase
      .from('notification_settings')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000')
    
    if (notifError) console.log('Error notification_settings:', notifError.message)

    console.log('Eliminando profiles...')
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (profileError) {
      console.error('❌ Error eliminando profiles:', profileError.message)
      return
    }

    // 3. Verificar que todo se eliminó
    console.log('\n✅ LIMPIEZA COMPLETADA!')
    console.log('Verificando tablas:')
    
    const checks = await Promise.all([
      supabase.from('profiles').select('count').single(),
      supabase.from('course_enrollments').select('count').single(),
      supabase.from('lesson_progress').select('count').single(),
      supabase.from('quiz_attempts').select('count').single(),
      supabase.from('task_submissions').select('count').single(),
      supabase.from('notification_settings').select('count').single()
    ])

    console.log('- Profiles restantes:', checks[0].data?.count || 0)
    console.log('- Course enrollments restantes:', checks[1].data?.count || 0)
    console.log('- Lesson progress restante:', checks[2].data?.count || 0)
    console.log('- Quiz attempts restantes:', checks[3].data?.count || 0)
    console.log('- Task submissions restantes:', checks[4].data?.count || 0)
    console.log('- Notification settings restantes:', checks[5].data?.count || 0)

    console.log('\n⚠️  IMPORTANTE:')
    console.log('Los registros de auth.users NO fueron eliminados.')
    console.log('Si quieres eliminarlos también, necesitas:')
    console.log('1. Ir a Supabase Dashboard > Authentication > Users')
    console.log('2. Eliminar manualmente cada usuario')
    console.log('3. O configurar SUPABASE_SERVICE_ROLE_KEY y usar el script completo')
    
    console.log('\n💡 Ahora puedes ejecutar create-test-users.js para crear usuarios de prueba.')

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  }
}

// Ejecutar el script
limpiarDatosUsuarios()