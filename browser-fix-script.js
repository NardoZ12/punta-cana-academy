// Script para ejecutar en la consola del navegador
// Abre la consola del desarrollador (F12) y pega este código

async function checkAndFixUsers() {
  // Este código debe ejecutarse en una página donde el cliente de Supabase esté disponible
  // Asegúrate de estar en http://localhost:3000/dashboard/teacher o similar
  
  try {
    // Verificar que tenemos acceso al cliente de Supabase
    if (typeof window !== 'undefined' && window.supabase) {
      console.log('✅ Cliente de Supabase encontrado')
      
      // Listar todos los usuarios
      const { data: profiles, error } = await window.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error obteniendo perfiles:', error)
        return
      }
      
      console.log('👥 Usuarios encontrados:', profiles.length)
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.full_name || 'Sin nombre'} (${profile.user_type}) - ID: ${profile.id}`)
      })
      
      // Buscar usuarios que podrían ser profesores
      const possibleTeachers = profiles.filter(profile => 
        profile.user_type === 'student' && 
        profile.full_name && (
          profile.full_name.toLowerCase().includes('academy') ||
          profile.full_name.toLowerCase().includes('punta') ||
          profile.full_name.toLowerCase().includes('teacher') ||
          profile.full_name.toLowerCase().includes('profesor')
        )
      )
      
      if (possibleTeachers.length > 0) {
        console.log('\n🔍 Usuarios que podrían ser profesores:')
        possibleTeachers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.full_name} (${user.user_type}) - ID: ${user.id}`)
        })
        
        // Para actualizar manualmente, ejecuta:
        console.log('\n🔧 Para corregir, ejecuta:')
        possibleTeachers.forEach(user => {
          console.log(`
// Actualizar ${user.full_name}
await window.supabase
  .from('profiles')
  .update({ user_type: 'teacher' })
  .eq('id', '${user.id}')
          `)
        })
      } else {
        console.log('✅ No se encontraron usuarios con configuración incorrecta')
      }
      
    } else {
      console.log('❌ Cliente de Supabase no disponible. Asegúrate de estar en una página del dashboard.')
    }
  } catch (error) {
    console.error('❌ Error ejecutando script:', error)
  }
}

// Ejecutar la función
checkAndFixUsers()

// También exponer una función para actualizar usuario específico
window.updateUserToTeacher = async function(userId) {
  try {
    const { data, error } = await window.supabase
      .from('profiles')
      .update({ user_type: 'teacher' })
      .eq('id', userId)
      .select()
    
    if (error) {
      console.error('❌ Error actualizando usuario:', error)
    } else {
      console.log('✅ Usuario actualizado exitosamente:', data)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

console.log(`
🚀 Script cargado. Funciones disponibles:
- checkAndFixUsers() - Buscar usuarios con configuración incorrecta
- updateUserToTeacher('USER_ID') - Actualizar usuario específico a profesor
`);