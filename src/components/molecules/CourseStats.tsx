'use client';

interface CourseStatsProps {
  totalStudents: number;
  averageGrade: number;
  passRate: number;
  gradeDistribution: { range: string; count: number }[];
}

export function CourseStats({ totalStudents, averageGrade, passRate, gradeDistribution }: CourseStatsProps) {
  const maxCount = Math.max(...gradeDistribution.map(d => d.count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tarjeta de Resumen */}
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
        <h3 className="text-gray-400 text-sm font-medium mb-4">Rendimiento General</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0f1115] p-4 rounded-xl border border-gray-800">
            <div className="text-2xl font-bold text-white">{averageGrade}%</div>
            <div className="text-xs text-gray-500">Nota Promedio</div>
          </div>
          <div className="bg-[#0f1115] p-4 rounded-xl border border-gray-800">
            <div className={`text-2xl font-bold ${passRate >= 70 ? 'text-green-500' : 'text-yellow-500'}`}>
              {passRate}%
            </div>
            <div className="text-xs text-gray-500">Tasa de Aprobación</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progreso del Curso (Global)</span>
            <span>{totalStudents > 0 ? 'Activo' : 'Sin datos'}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${passRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Gráfica de Distribución de Notas */}
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
        <h3 className="text-gray-400 text-sm font-medium mb-6">Distribución de Calificaciones</h3>
        <div className="flex items-end justify-between h-40 gap-2">
          {gradeDistribution.map((item, idx) => {
            const heightPercentage = (item.count / maxCount) * 100;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 group">
                <div className="relative w-full flex justify-center items-end h-full">
                  <div 
                    className="w-full max-w-[30px] bg-cyan-900/50 border-t border-x border-cyan-500/30 rounded-t-sm hover:bg-cyan-600/50 transition-all duration-300 relative"
                    style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 mt-2 font-mono">{item.range}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
