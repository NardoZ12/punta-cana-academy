// Script para insertar datos de prueba en la base de datos
const { createClient } = require('@supabase/supabase-js')

// Configurar Supabase con las credenciales del proyecto
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'TU_URL_AQUI',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_KEY_AQUI'
)

async function insertTestData() {
  try {
    console.log('🚀 Insertando datos de prueba...')

    // 1. Crear perfiles de prueba (usuarios)
    const testUsers = [
      {
        id: 'b88d8d60-ef84-4764-9889-237acb49bbc4', // UUID del instructor que ya tienes
        first_name: 'Carlos',
        last_name: 'Martínez',
        email: 'profesor@test.com',
        user_type: 'teacher',
        phone: '+1-809-555-0101',
        bio: 'Instructor de programación con 10 años de experiencia',
        skills: ['JavaScript', 'Python', 'React', 'Node.js'],
        social_links: {
          linkedin: 'https://linkedin.com/in/carlos-martinez',
          twitter: '@carlosmartinez'
        }
      },
      {
        id: 'a77c7c50-de73-3653-8778-126acb48aab3', // Nuevo UUID para estudiante
        first_name: 'María',
        last_name: 'García',
        email: 'estudiante@test.com',
        user_type: 'student',
        phone: '+1-809-555-0102'
      },
      {
        id: 'c99e9e70-fe94-4865-9990-348bcd59bbc5', // Nuevo UUID para admin
        first_name: 'Admin',
        last_name: 'Sistema',
        email: 'admin@test.com',
        user_type: 'admin',
        phone: '+1-809-555-0100'
      }
    ]

    // Insertar perfiles
    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert(testUsers, { onConflict: 'id' })

    if (profilesError) {
      console.error('❌ Error insertando perfiles:', profilesError)
      return
    }
    console.log('✅ Perfiles insertados correctamente')

    // 2. Crear cursos de prueba
    const testCourses = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'JavaScript Fundamentals',
        description: 'Aprende los fundamentos de JavaScript desde cero. Incluye variables, funciones, objetos, DOM y más.',
        instructor_id: 'b88d8d60-ef84-4764-9889-237acb49bbc4',
        category: 'programming',
        level: 'beginner',
        duration: '6 semanas',
        price: 0.00,
        status: 'published',
        tags: ['javascript', 'web', 'programming'],
        requirements: ['Conocimiento básico de computación'],
        learning_objectives: [
          'Dominar la sintaxis de JavaScript',
          'Manipular el DOM',
          'Crear aplicaciones interactivas'
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Inglés para Turismo',
        description: 'Curso de inglés especializado para trabajadores del sector turístico en Punta Cana.',
        instructor_id: 'b88d8d60-ef84-4764-9889-237acb49bbc4',
        category: 'languages',
        level: 'intermediate',
        duration: '8 semanas',
        price: 0.00,
        status: 'published',
        tags: ['english', 'tourism', 'hospitality'],
        requirements: ['Conocimiento básico de inglés'],
        learning_objectives: [
          'Comunicarse efectivamente con turistas',
          'Manejar situaciones del hotel y restaurante',
          'Vocabulario especializado del turismo'
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'React para Principiantes',
        description: 'Construye aplicaciones web modernas con React. Aprende componentes, hooks, estado y más.',
        instructor_id: 'b88d8d60-ef84-4764-9889-237acb49bbc4',
        category: 'programming',
        level: 'beginner',
        duration: '10 semanas',
        price: 0.00,
        status: 'draft',
        tags: ['react', 'javascript', 'web', 'frontend'],
        requirements: ['Conocimiento básico de JavaScript', 'HTML y CSS'],
        learning_objectives: [
          'Crear componentes reutilizables',
          'Manejar estado con hooks',
          'Integrar APIs externas'
        ]
      }
    ]

    // Insertar cursos
    const { error: coursesError } = await supabase
      .from('courses')
      .upsert(testCourses, { onConflict: 'id' })

    if (coursesError) {
      console.error('❌ Error insertando cursos:', coursesError)
      return
    }
    console.log('✅ Cursos insertados correctamente')

    // 3. Crear lecciones para el primer curso
    const testLessons = [
      {
        id: '660f9511-f3ac-52e5-b827-557766551001',
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Introducción a JavaScript',
        content: 'Bienvenido al mundo de JavaScript. En esta lección aprenderemos qué es JavaScript y por qué es importante.',
        order_index: 1,
        duration_minutes: 30,
        lesson_type: 'video'
      },
      {
        id: '660f9511-f3ac-52e5-b827-557766551002',
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Variables y Tipos de Datos',
        content: 'Aprende sobre variables, números, strings, booleanos y más tipos de datos en JavaScript.',
        order_index: 2,
        duration_minutes: 45,
        lesson_type: 'video'
      },
      {
        id: '660f9511-f3ac-52e5-b827-557766551003',
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Funciones',
        content: 'Las funciones son bloques de código reutilizables. Aprende a crear y usar funciones efectivamente.',
        order_index: 3,
        duration_minutes: 60,
        lesson_type: 'video'
      }
    ]

    const { error: lessonsError } = await supabase
      .from('course_lessons')
      .upsert(testLessons, { onConflict: 'id' })

    if (lessonsError) {
      console.error('❌ Error insertando lecciones:', lessonsError)
      return
    }
    console.log('✅ Lecciones insertadas correctamente')

    // 4. Crear inscripción de prueba
    const testEnrollment = {
      id: '770a0621-g4bd-63f6-c938-668877662001',
      student_id: 'a77c7c50-de73-3653-8778-126acb48aab3',
      course_id: '550e8400-e29b-41d4-a716-446655440001',
      status: 'active',
      progress: 33 // 33% completado
    }

    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert([testEnrollment], { onConflict: 'id' })

    if (enrollmentError) {
      console.error('❌ Error insertando inscripción:', enrollmentError)
      return
    }
    console.log('✅ Inscripción insertada correctamente')

    console.log('\n🎉 ¡Datos de prueba insertados exitosamente!')
    console.log('\n📧 Cuentas de prueba creadas:')
    console.log('   Profesor: profesor@test.com (password: password123)')
    console.log('   Estudiante: estudiante@test.com (password: password123)')
    console.log('   Admin: admin@test.com (password: password123)')
    console.log('\n💡 Nota: Debes crear estas cuentas en Supabase Auth manualmente o usando la interfaz de registro.')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  insertTestData()
}

module.exports = { insertTestData }