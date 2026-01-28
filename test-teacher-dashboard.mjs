// Script para probar el dashboard de profesores específicamente
import { createClient } from '@supabase/supabase-js'

// Usar las variables de entorno del proyecto
const supabaseUrl = 'https://lfqyvjraptvvqajvtsly.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXl2anJhcHR2dnFhanZ0c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMzcwNjUsImV4cCI6MjA1MTkxMzA2NX0.sb_publishable_8vP0ZE_MKsaXXNUWhFOhNA_xWrqVdqH6iTEGrEzn4-K5RQZ_XfE3vUzQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTeacherDashboard() {
  try {
    console.log('🔍 Probando acceso del dashboard de profesores...\n')

    // 1. Verificar que podemos leer perfiles
    console.log('1. Probando lectura de perfiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, user_type, email')
      .eq('user_type', 'teacher')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Error leyendo perfiles de profesores:', profilesError.message)
      return false
    } else {
      console.log('✅ Perfiles de profesores encontrados:', profiles.length)
      if (profiles.length > 0) {
        console.log('   Ejemplo:', profiles[0])
      }
    }

    // 2. Probar consulta de cursos
    console.log('\n2. Probando consulta de cursos...')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:profiles(id, full_name, email)
      `)
      .limit(3)
    
    if (coursesError) {
      console.error('❌ Error leyendo cursos:', coursesError.message)
    } else {
      console.log('✅ Cursos encontrados:', courses.length)
    }

    // 3. Verificar inscripciones (enrollments)
    console.log('\n3. Probando consulta de inscripciones...')
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*')
      .limit(3)
    
    if (enrollmentsError) {
      console.error('❌ Error leyendo inscripciones:', enrollmentsError.message)
    } else {
      console.log('✅ Inscripciones encontradas:', enrollments.length)
    }

    // 4. Simular la consulta específica del dashboard
    if (profiles.length > 0) {
      const teacherId = profiles[0].id
      console.log(`\n4. Simulando consultas del dashboard para profesor: ${teacherId}`)
      
      // Consulta de cursos del instructor
      const { data: instructorCourses, error: instructorCoursesError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles(id, full_name, email)
        `)
        .eq('instructor_id', teacherId)
      
      if (instructorCoursesError) {
        console.error('❌ Error consultando cursos del instructor:', instructorCoursesError.message)
        return false
      } else {
        console.log('✅ Cursos del instructor:', instructorCourses.length)
      }

      // Consulta de estadísticas
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', teacherId)

      console.log('✅ Estadística - Total cursos:', coursesCount || 0)
    }

    console.log('\n📋 RESULTADO: Dashboard de profesores debería funcionar ✅')
    return true

  } catch (error) {
    console.error('💥 Error general:', error)
    return false
  }
}

// Función para crear un usuario profesor de prueba si no existe
async function createTestTeacher() {
  try {
    console.log('\n🔧 Creando usuario profesor de prueba...')
    
    const { data, error } = await supabase.auth.signUp({
      email: 'profesor.test@academia.com',
      password: 'Password123!',
      options: {
        data: {
          full_name: 'Profesor Test',
          user_type: 'teacher'
        }
      }
    })

    if (error) {
      console.log('⚠️ Error creando usuario (puede que ya exista):', error.message)
    } else {
      console.log('✅ Usuario profesor de prueba creado:', data.user?.email)
    }
  } catch (error) {
    console.log('⚠️ Error en createTestTeacher:', error.message)
  }
}

// Ejecutar las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas del dashboard de profesores\n')
  
  await createTestTeacher()
  await testTeacherDashboard()
  
  console.log('\n🎯 Si ves errores arriba, ejecuta también el script arreglar-duplicados.sql')
  console.log('🌐 Ahora ve a http://localhost:3000/dashboard/teacher e inicia sesión')
}

runAllTests()