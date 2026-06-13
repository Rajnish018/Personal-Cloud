const StorageCard = () => {
  const used = 3.8; // Changed to test color shifting state
  const total = 5;
  const percentage = (used / total) * 100;

  // Dynamic status configurations based on storage depletion
  const isLowStorage = percentage >= 85;
  const isCriticalStorage = percentage >= 95;

  const getProgressColor = () => {
    if (isCriticalStorage) return "bg-red-500";
    if (isLowStorage) return "bg-amber-500";
    return "bg-[#185FA5]"; // Signature blue accent
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm select-none">
      {/* Title & Info Row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
          Account Storage
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isCriticalStorage ? "bg-red-50 text-red-600" : 
          isLowStorage ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500"
        }`}>
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-4 w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Numerical read-out footer */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <p className="text-gray-500">
          <span className="font-medium text-gray-900">{used} GB</span> of {total} GB used
        </p>
        
        {isLowStorage && (
          <button 
            type="button" 
            className="font-semibold text-[#185FA5] hover:text-[#14508c] hover:underline transition-colors"
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
};

export default StorageCard;