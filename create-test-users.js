// Script para crear usuarios de prueba en Supabase Auth
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configurar Supabase con las credenciales del proyecto
console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')
console.log('🔧 Service Key disponible:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // Usaremos anon key por ahora
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createTestUsers() {
  try {
    console.log('🚀 Creando usuarios de prueba...')

    // Usuarios de prueba
    const testUsers = [
      {
        email: 'profesor@test.com',
        password: 'password123',
        userType: 'teacher',
        userData: {
          first_name: 'Carlos',
          last_name: 'Martínez',
          user_type: 'teacher',
          phone: '+1-809-555-0101',
          bio: 'Instructor de programación con 10 años de experiencia',
          skills: ['JavaScript', 'Python', 'React', 'Node.js'],
          social_links: {
            linkedin: 'https://linkedin.com/in/carlos-martinez',
            twitter: '@carlosmartinez'
          }
        }
      },
      {
        email: 'estudiante@test.com',
        password: 'password123',
        userType: 'student',
        userData: {
          first_name: 'María',
          last_name: 'García',
          user_type: 'student',
          phone: '+1-809-555-0102'
        }
      },
      {
        email: 'admin@test.com',
        password: 'password123',
        userType: 'admin',
        userData: {
          first_name: 'Admin',
          last_name: 'Sistema',
          user_type: 'admin',
          phone: '+1-809-555-0100'
        }
      }
    ]

    for (const user of testUsers) {
      console.log(`\n📝 Creando usuario: ${user.email}`)
      
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: user.userData
      })

      if (authError) {
        console.error(`❌ Error creando usuario ${user.email}:`, authError.message)
        continue
      }

      console.log(`✅ Usuario Auth creado: ${user.email}`)

      // 2. Crear perfil en la tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: user.email,
          ...user.userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error(`❌ Error creando perfil para ${user.email}:`, profileError.message)
      } else {
        console.log(`✅ Perfil creado: ${user.email}`)
      }
    }

    console.log('\n🎉 ¡Usuarios de prueba creados exitosamente!')
    console.log('\n📧 Credenciales de acceso:')
    console.log('   👨‍🏫 Profesor: profesor@test.com / password123')
    console.log('   🎓 Estudiante: estudiante@test.com / password123')
    console.log('   👤 Admin: admin@test.com / password123')
    console.log('\n🔗 Ahora puedes acceder a http://localhost:3000/login')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  createTestUsers()
}

module.exports = { createTestUsers }