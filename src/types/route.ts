import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()

    // 1. Inicializar cliente de Supabase en el servidor
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de escritura de cookies en Server Components/Routes
            }
          },
        },
      }
    )

    // 2. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 3. Procesar el FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const assignmentId = formData.get('assignmentId') as string
    const courseId = formData.get('courseId') as string

    if (!file || !assignmentId || !courseId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (archivo, assignmentId o courseId)' },
        { status: 400 }
      )
    }

    // 4. Validaciones del archivo (Tamaño y Tipo)
    // Límite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede el límite de 10MB' }, { status: 400 })
    }

    // 5. Generar ruta segura: {course_id}/{assignment_id}/{student_id}/{timestamp}_{filename}
    // Esto asegura que los estudiantes no sobreescriban archivos de otros y organiza el bucket.
    const fileExt = file.name.split('.').pop()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${courseId}/${assignmentId}/${user.id}/${Date.now()}_${sanitizedFileName}`

    // 6. Subir a Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError)
      return NextResponse.json({ error: 'Error al subir el archivo a Storage' }, { status: 500 })
    }

    // 7. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('assignments')
      .getPublicUrl(filePath)

    return NextResponse.json({ success: true, url: publicUrl, path: filePath })

  } catch (error: any) {
    console.error('Error interno:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}