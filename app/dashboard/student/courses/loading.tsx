export default function LoadingStudentCourses() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-gray-800 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-800/50 rounded"></div>
        </div>
        <div className="h-10 w-32 bg-gray-800 rounded-lg"></div>
      </div>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#30363d] pb-3">
        <div className="h-8 w-28 bg-gray-800 rounded"></div>
        <div className="h-8 w-28 bg-gray-800/50 rounded"></div>
      </div>
      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <div className="h-40 bg-gray-800"></div>
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-gray-800 rounded"></div>
              <div className="h-4 w-full bg-gray-800/50 rounded"></div>
              <div className="h-4 w-1/2 bg-gray-800/50 rounded"></div>
              <div className="h-2 w-full bg-gray-800 rounded-full mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
