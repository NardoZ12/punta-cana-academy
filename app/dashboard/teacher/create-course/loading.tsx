export default function LoadingCreateCourse() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-56 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-80 bg-gray-100 rounded"></div>
        </div>
        {/* Form skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i}>
              <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
            </div>
          ))}
          <div>
            <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
            <div className="h-32 w-full bg-gray-100 rounded-lg"></div>
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
