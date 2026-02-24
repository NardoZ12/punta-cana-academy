import Link from 'next/link';

export default function TeacherNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔍</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Página no encontrada</h2>
        <p className="text-gray-400 mb-6">La sección que buscas no existe o fue movida.</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard/teacher"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/dashboard/teacher/manage-courses"
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors"
          >
            Mis Cursos
          </Link>
        </div>
      </div>
    </div>
  );
}
