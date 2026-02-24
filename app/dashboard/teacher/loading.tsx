// src/app/dashboard/teacher/loading.tsx
export default function LoadingTeacherDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Cargando tu panel fresco...</h2>
      <p className="text-sm text-gray-500">Preparando tus cursos y estadísticas</p>
    </div>
  );
}
