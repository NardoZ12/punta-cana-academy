'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook que combina 3 estrategias de invalidación de caché:
 * 1. React Query — limpia datos cacheados en el cliente (await)
 * 2. revalidatePath (vía API Route) — limpia caché del servidor (fire & forget)
 * 3. router.refresh() — fuerza re-render de Server Components (fire & forget)
 *
 * Las operaciones del servidor se lanzan en segundo plano para NO bloquear
 * la navegación del usuario (evita que la página se quede cargando).
 */
export function useRevalidate() {
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Llama esta función después de crear, editar, publicar o eliminar un curso.
   * Invalida React Query (síncrono) + servidor y router (en background).
   */
  const revalidateAfterCourseUpdate = async (courseId?: string) => {
    // 1. Limpiar memoria local (React Query) — esto SÍ lo esperamos
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['courses'] }),
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] }),
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] }),
      ...(courseId
        ? [
            queryClient.invalidateQueries({ queryKey: ['course', courseId] }),
            queryClient.invalidateQueries({ queryKey: ['course-structure', courseId] }),
          ]
        : []),
    ]);

    // 2. Limpiar caché del servidor — fire & forget (NO bloquea navegación)
    const paths = [
      '/',
      '/cursos',
      '/dashboard/student',
      '/dashboard/teacher',
      ...(courseId ? [`/cursos/${courseId}`] : []),
    ];

    fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    }).catch((err) => {
      console.warn('Error al revalidar rutas del servidor:', err);
    });

    // 3. Refrescar el router — fire & forget (NO bloquea navegación)
    try {
      router.refresh();
    } catch {
      // Ignorar — puede fallar si el usuario ya navegó a otra página
    }
  };

  return { revalidateAfterCourseUpdate };
}
