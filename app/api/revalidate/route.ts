import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paths } = body;

    // Rutas base que siempre queremos limpiar
    const defaultPaths = [
      '/',
      '/cursos',
      '/dashboard/student',
      '/dashboard/teacher',
    ];

    const pathsToRevalidate: string[] = Array.isArray(paths) && paths.length > 0
      ? paths
      : defaultPaths;

    for (const path of pathsToRevalidate) {
      revalidatePath(path);
    }

    return NextResponse.json({
      revalidated: true,
      paths: pathsToRevalidate,
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error revalidating:', message);
    return NextResponse.json(
      { revalidated: false, error: message },
      { status: 500 }
    );
  }
}
