export default function LoadingManageCourses() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="border-l border-gray-200 h-6"></div>
              <div>
                <div className="h-7 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-64 bg-gray-100 rounded"></div>
              </div>
            </div>
            <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full"></div>
          ))}
        </div>
        {/* Course cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-5 w-40 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-100 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
