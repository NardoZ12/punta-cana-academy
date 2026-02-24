export default function LoadingSettings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 bg-gray-800 rounded mb-2"></div>
        <div className="h-4 w-64 bg-gray-800/50 rounded"></div>
      </div>
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="h-4 w-28 bg-gray-800 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-800/50 rounded-lg"></div>
          </div>
        ))}
        <div className="flex justify-end">
          <div className="h-10 w-36 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
