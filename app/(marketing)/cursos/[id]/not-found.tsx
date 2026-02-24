import Link from 'next/link';
import { Button } from '@/components/atoms/Button';

export default function CourseNotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Curso no encontrado 🤒</h1>
      <p className="text-gray-400 mb-8">El curso que buscas no existe o fue eliminado.</p>
      <Link href="/cursos"><Button variant="outline">Volver al catálogo</Button></Link>
    </div>
  );
}
