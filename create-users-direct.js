// Script para crear usuarios de prueba
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function createTestUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('🔧 Conectando a Supabase:', supabaseUrl?.substring(0, 30) + '...')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables de entorno no encontradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Verificar la conexión listando tablas existentes
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (tablesError) {
      console.error('❌ Error conectando a la tabla profiles:', tablesError)
      return
    }

    console.log('✅ Conexión exitosa a Supabase')

    // Crear usuarios de prueba directamente en la tabla profiles
    const testUsers = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Juan Estudiante',
        user_type: 'student',
        phone: '+1-809-555-0101',
        language: 'es'
      },
      {
        id: '00000000-0000-0000-0000-000000000002', 
        full_name: 'María Profesora',
        user_type: 'teacher',
        phone: '+1-809-555-0102',
        language: 'es'
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        full_name: 'Punta Cana Academy Admin',
        user_type: 'teacher',
        phone: '+1-809-555-0100',
        language: 'es'
      }
    ]

    console.log('📝 Insertando usuarios de prueba...')
    
    for (const user of testUsers) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert([user])
          .select()
        
        if (error) {
          console.error(`❌ Error insertando ${user.full_name}:`, error)
        } else {
          console.log(`✅ Usuario creado: ${user.full_name} (${user.user_type})`)
        }
      } catch (userError) {
        console.error(`❌ Error con ${user.full_name}:`, userError)
      }
    }

    // Listar usuarios después de la inserción
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error listando usuarios:', error)
      return
    }

    console.log('\n=== USUARIOS EXISTENTES ===')
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.full_name || 'Sin nombre'} (${profile.user_type})`)
        console.log(`   ID: ${profile.id}`)
        console.log(`   Teléfono: ${profile.phone || 'No especificado'}`)
        console.log(`   Creado: ${profile.created_at}`)
        console.log('---')
      })
    } else {
      console.log('No se encontraron usuarios')
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
createTestUsers()
  .then(() => {
    console.log('\n✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })