// Script para deshabilitar RLS y crear usuarios
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function setupUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('🔧 Conectando a Supabase...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Primero, intentar ejecutar comandos SQL directos para deshabilitar RLS
    console.log('🔓 Intentando deshabilitar RLS...')
    
    const { data: disableRLS, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
    })

    if (rlsError) {
      console.log('❌ No se pudo deshabilitar RLS via RPC (normal):', rlsError.message)
      console.log('📋 Por favor ejecuta manualmente en Supabase SQL Editor:')
      console.log('   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;')
      console.log('   O crea las políticas apropiadas.')
    }

    // Intentar crear usuarios usando el método de autenticación real
    console.log('\n📝 Creando usuarios usando auth.signUp...')

    const testUsers = [
      {
        email: 'estudiante@test.com',
        password: 'password123',
        userData: {
          full_name: 'Juan Estudiante Test',
          user_type: 'student',
          phone: '+1-809-555-0201'
        }
      },
      {
        email: 'profesor@test.com', 
        password: 'password123',
        userData: {
          full_name: 'María Profesora Test',
          user_type: 'teacher',
          phone: '+1-809-555-0202'
        }
      }
    ]

    for (const testUser of testUsers) {
      try {
        console.log(`\n👤 Creando ${testUser.userData.full_name}...`)
        
        const { data, error } = await supabase.auth.signUp({
          email: testUser.email,
          password: testUser.password,
          options: {
            data: {
              full_name: testUser.userData.full_name,
              user_type: testUser.userData.user_type,
            }
          }
        })

        if (error) {
          console.error(`❌ Error en auth.signUp:`, error.message)
          continue
        }

        if (data.user) {
          console.log(`✅ Usuario de auth creado: ${data.user.email}`)
          
          // Intentar crear el perfil manualmente si no se creó automáticamente
          try {
            const profileData = {
              id: data.user.id,
              ...testUser.userData,
              language: 'es'
            }

            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .insert([profileData])
              .select()

            if (profileError) {
              console.error(`❌ Error creando perfil:`, profileError.message)
            } else {
              console.log(`✅ Perfil creado exitosamente`)
            }
          } catch (profileError) {
            console.error(`❌ Error en inserción de perfil:`, profileError)
          }
        }
      } catch (userError) {
        console.error(`❌ Error creando ${testUser.userData.full_name}:`, userError)
      }
    }

    // Listar usuarios finales
    console.log('\n=== VERIFICANDO USUARIOS CREADOS ===')
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')

    if (error) {
      console.error('❌ Error listando usuarios:', error.message)
    } else if (profiles && profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.full_name || 'Sin nombre'} (${profile.user_type})`)
        console.log(`   Teléfono: ${profile.phone || 'N/A'}`)
      })
    } else {
      console.log('❗ Aún no hay usuarios - verifica las políticas RLS')
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

setupUsers()
  .then(() => {
    console.log('\n✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })