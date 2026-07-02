import { useMemo } from "react";
import { FileText, Folder,RefreshCw,Trash2 } from "lucide-react";
import { formatBytes, formatDate } from "../../utils/drive";

const TrashGrid = ({ items, onRestore, onPermanentlyDelete }) => {
  const rows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        isFolder: Boolean(item.isDeleted && item.name && item.parentFolder !== undefined),
      })),
    [items]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="select-none border-b border-slate-200/80 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <th className="px-6 py-4 font-bold">Name</th>
            <th className="px-6 py-4 font-bold">Type</th>
            <th className="px-6 py-4 font-bold">Deleted</th>
            <th className="px-6 py-4 font-bold">Size</th>
            <th className="px-6 py-4 pr-8 text-right font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {rows.map((item) => (
            <tr key={item._id} className="group transition-all duration-150 hover:bg-slate-50/50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-3.5">
                  <span className="rounded-xl border border-slate-100 bg-slate-50 p-2">
                    {item.isFolder ? <Folder size={18} /> : <FileText size={18} />}
                  </span>
                  <span className="font-semibold text-slate-700 transition-colors group-hover:text-rose-600">
                    {item.name}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-slate-500">{item.isFolder ? "Folder" : item.extension || item.resourceType || "File"}</td>
              <td className="whitespace-nowrap px-6 py-4 text-slate-500">{formatDate(item.deletedAt)}</td>
              <td className="whitespace-nowrap px-6 py-4 text-slate-400">{item.isFolder ? "—" : formatBytes(item.size)}</td>
              <td className="whitespace-nowrap px-6 py-4 pr-6 text-right">
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRestore(item)}
                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                    title="Restore"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPermanentlyDelete(item)}
                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrashGrid;
