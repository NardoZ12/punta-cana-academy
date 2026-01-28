// Script para corregir el usuario profesor que cambió a estudiante
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixTeacherUser() {
  // Usar las variables de entorno del proyecto
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno faltantes:')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    return
  }

  console.log('🔧 Conectando a Supabase:', supabaseUrl.substring(0, 30) + '...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Buscar el usuario con el email específico
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .or('full_name.ilike.%punta%,full_name.ilike.%academy%')
    
    if (searchError) {
      console.error('Error buscando usuarios:', searchError)
      return
    }

    console.log('Usuarios encontrados:', profiles)

    // También buscar por aproximación del email
    const { data: profilesByEmail, error: emailError } = await supabase
      .from('profiles')
      .select('*')
    
    if (emailError) {
      console.error('Error obteniendo todos los perfiles:', emailError)
      return
    }

    console.log('\n=== TODOS LOS USUARIOS ===')
    profilesByEmail.forEach(profile => {
      console.log(`ID: ${profile.id}`)
      console.log(`Nombre: ${profile.full_name}`)
      console.log(`Tipo: ${profile.user_type}`)
      console.log(`Creado: ${profile.created_at}`)
      console.log('---')
    })

    // Buscar usuarios que podrían ser profesores pero están marcados como estudiantes
    const possibleTeachers = profilesByEmail.filter(profile => 
      profile.full_name && 
      (
        profile.full_name.toLowerCase().includes('academy') ||
        profile.full_name.toLowerCase().includes('teacher') ||
        profile.full_name.toLowerCase().includes('profesor') ||
        profile.full_name.toLowerCase().includes('punta')
      ) &&
      profile.user_type === 'student'
    )

    console.log('\n=== POSIBLES PROFESORES MAL CONFIGURADOS ===')
    possibleTeachers.forEach(profile => {
      console.log(`ID: ${profile.id}`)
      console.log(`Nombre: ${profile.full_name}`)
      console.log(`Tipo actual: ${profile.user_type}`)
      console.log('---')
    })

    // Si encontramos usuarios sospechosos, preguntaremos antes de actualizar
    if (possibleTeachers.length > 0) {
      console.log(`\n¿Deseas actualizar estos ${possibleTeachers.length} usuario(s) a tipo 'teacher'?`)
      console.log('Por favor revisa manualmente y ejecuta la actualización si es necesario:')
      
      possibleTeachers.forEach(profile => {
        console.log(`
UPDATE para ${profile.full_name}:
await supabase
  .from('profiles')
  .update({ user_type: 'teacher' })
  .eq('id', '${profile.id}')
        `)
      })
    }

  } catch (error) {
    console.error('Error general:', error)
  }
}

// Ejecutar el script
fixTeacherUser()
  .then(() => {
    console.log('Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error ejecutando script:', error)
    process.exit(1)
  })