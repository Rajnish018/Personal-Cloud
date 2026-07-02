import { HardDrive } from "lucide-react";
import { useProfile } from "../../hooks/useUsers";
import { formatBytes } from "../../utils/drive";

const StorageCard = () => {
  const { data } = useProfile();
  const storage = data?.storage || {
    used: data?.user?.storageUsed || 0,
    total: data?.user?.storageLimit || 15 * 1024 ** 3,
    remaining: Math.max((data?.user?.storageLimit || 15 * 1024 ** 3) - (data?.user?.storageUsed || 0), 0),
  };

  const percentage = storage.total ? Math.min((storage.used / storage.total) * 100, 100) : 0;
  const isLowStorage = percentage >= 85;
  const isCriticalStorage = percentage >= 95;
  const progressColor = isCriticalStorage
    ? "bg-rose-500"
    : isLowStorage
      ? "bg-amber-500"
      : "bg-[#185FA5]";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive size={18} className="text-[#185FA5]" />
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
            Account Storage
          </h3>
        </div>
        <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-500">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-3 space-y-1 text-xs text-gray-500">
        <p>
          <span className="font-semibold text-gray-900">{formatBytes(storage.used)}</span> used
        </p>
        <p>{formatBytes(storage.remaining)} available of {formatBytes(storage.total)}</p>
      </div>
    </div>
  );
};

export default StorageCard;
