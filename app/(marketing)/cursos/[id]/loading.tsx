export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Hero skeleton */}
      <div className="relative w-full h-[75vh] min-h-[550px] flex items-center justify-center overflow-hidden -mt-20">
        <div className="absolute inset-0 z-0 bg-gray-900 animate-pulse" />
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-20">
          <div className="inline-block h-8 w-24 bg-gray-700 rounded-full mb-6 animate-pulse" />
          <div className="h-16 w-3/4 bg-gray-700 rounded-lg mb-6 mx-auto animate-pulse" />
          <div className="h-8 w-2/3 bg-gray-800 rounded-lg mx-auto animate-pulse" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto px-4 mt-20">
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8">
          <div className="h-8 w-48 bg-gray-700 rounded mb-8 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
