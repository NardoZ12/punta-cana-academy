export default function LoadingTasks() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-32 bg-gray-800 rounded mb-2"></div>
        <div className="h-4 w-56 bg-gray-800/50 rounded"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-800 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-5 w-48 bg-gray-800 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-800/50 rounded"></div>
            </div>
            <div className="h-8 w-24 bg-gray-800 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
