// Script SIMPLIFICADO para crear usuarios de prueba
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configurar Supabase 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function crearUsuariosDePrueba() {
  try {
    console.log('🚀 Creando usuarios de prueba usando signUp...')
    console.log('⚠️  Los usuarios necesitarán confirmar su email o lo haremos manualmente después')

    // Usuarios de prueba simplificados
    const usuarios = [
      {
        email: 'profesor@test.com',
        password: 'password123',
        profile: {
          full_name: 'Carlos Martínez',
          user_type: 'teacher',
          phone: '+1-809-555-0101'
        }
      },
      {
        email: 'estudiante@test.com', 
        password: 'password123',
        profile: {
          full_name: 'María García',
          user_type: 'student',
          phone: '+1-809-555-0102'
        }
      },
      {
        email: 'estudiante2@test.com',
        password: 'password123',
        profile: {
          full_name: 'Juan Pérez',
          user_type: 'student', 
          phone: '+1-809-555-0103'
        }
      }
    ]

    for (const usuario of usuarios) {
      console.log(`\n📝 Creando usuario: ${usuario.email}`)
      
      // Crear usuario usando signUp
      const { data, error } = await supabase.auth.signUp({
        email: usuario.email,
        password: usuario.password,
        options: {
          data: usuario.profile // metadata del usuario
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⚠️  Usuario ${usuario.email} ya existe`)
          continue
        }
        console.error(`❌ Error creando ${usuario.email}:`, error.message)
        continue
      }

      if (data.user) {
        console.log(`✅ Usuario creado: ${usuario.email}`)
        
        // El perfil se debería crear automáticamente por un trigger
        // Si no, podemos crearlo manualmente:
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: usuario.profile.full_name,
            user_type: usuario.profile.user_type,
            phone: usuario.profile.phone,
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.log(`ℹ️  Info perfil para ${usuario.email}:`, profileError.message)
        }
      }
    }

    console.log('\n🎉 ¡Proceso completado!')
    console.log('\n📧 Credenciales de prueba:')
    console.log('   👨‍🏫 Profesor: profesor@test.com / password123')
    console.log('   🎓 Estudiante: estudiante@test.com / password123')
    console.log('   🎓 Estudiante 2: estudiante2@test.com / password123')
    console.log('\n⚠️  IMPORTANTE:')
    console.log('Si Supabase requiere confirmación de email, ve a:')
    console.log('Supabase Dashboard > Authentication > Users')
    console.log('Y confirma manualmente cada usuario.')
    console.log('\n🔗 Luego accede a: http://localhost:3000/login')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar
crearUsuariosDePrueba()