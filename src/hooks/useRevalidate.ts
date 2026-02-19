'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook que combina 3 estrategias de invalidación de caché:
 * 1. React Query — limpia datos cacheados en el cliente
 * 2. revalidatePath (vía API Route) — limpia caché del servidor (ISR/SSR)
 * 3. router.refresh() — fuerza re-render de Server Components
 */
export function useRevalidate() {
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Llama esta función después de crear, editar, publicar o eliminar un curso.
   * Invalida React Query + caché del servidor + refresca el router.
   */
  const revalidateAfterCourseUpdate = async (courseId?: string) => {
    // 1. Limpiar memoria local (React Query)
    await queryClient.invalidateQueries({ queryKey: ['courses'] });
    await queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    await queryClient.invalidateQueries({ queryKey: ['teacher-stats'] });

    if (courseId) {
      await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      await queryClient.invalidateQueries({ queryKey: ['course-structure', courseId] });
    }

    // 2. Limpiar memoria del servidor (llamar a nuestra API de revalidación)
    try {
      const paths = [
        '/',
        '/cursos',
        '/dashboard/student',
        '/dashboard/teacher',
        ...(courseId ? [`/cursos/${courseId}`] : []),
      ];

      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      });
    } catch (err) {
      console.warn('Error al revalidar rutas del servidor:', err);
    }

    // 3. Forzar actualización visual de Server Components
    router.refresh();
  };

  return { revalidateAfterCourseUpdate };
}
