export default function LoadingStudentDashboard() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-4 w-24 bg-gray-800 rounded mb-2"></div>
        <div className="h-8 w-72 bg-gray-800 rounded mb-2"></div>
        <div className="h-4 w-56 bg-gray-800/50 rounded"></div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="h-4 w-20 bg-gray-800 rounded mb-3"></div>
            <div className="h-7 w-12 bg-gray-800 rounded"></div>
          </div>
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="h-5 w-40 bg-gray-800 rounded mb-3"></div>
            <div className="h-4 w-full bg-gray-800/50 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-800/50 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
