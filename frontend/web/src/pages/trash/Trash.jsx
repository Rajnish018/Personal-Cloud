import {Trash2, XCircle } from "lucide-react";

import {
  useEmptyTrash,
  usePermanentlyDeleteFile,
  useRestoreFile,
  useTrashFiles,
} from "../../hooks/useFiles";
import {
  useEmptyTrashFolders,
  useTrashFolders,
  useRestoreFolder,
  usePermanentlyDeleteFolder,
} from "../../hooks/useFolders";
// import { fileIconFor, formatBytes, formatDate } from "../../utils/drive";
import TrashGrid from "../../components/drive/TrashGrid";

const Trash = () => {
  const trashFiles = useTrashFiles();
  const trashFolders = useTrashFolders();
  const restoreFile = useRestoreFile();
  const permanentlyDeleteFile = usePermanentlyDeleteFile();
  const restoreFolder = useRestoreFolder();
  const permanentlyDeleteFolder = usePermanentlyDeleteFolder();
  const emptyTrash = useEmptyTrash();
  const emptyTrashFolders = useEmptyTrashFolders();

  const files = trashFiles.data || [];
  const folders = trashFolders.data || [];
  // const isMutating =
  //   restoreFile.isPending ||
  //   permanentlyDeleteFile.isPending ||
  //   restoreFolder.isPending ||
  //   permanentlyDeleteFolder.isPending ||
  //   emptyTrash.isPending;

  const handleEmptyTrash = () => {
    if ((!files.length && !folders.length) || emptyTrash.isPending || emptyTrashFolders.isPending) return;
    if (files.length) emptyTrash.mutate();
    if (folders.length) emptyTrashFolders.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-rose-500/10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-0.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600">
                System Storage
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Trash
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Items in trash are permanently deleted after 30 days.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEmptyTrash}
            disabled={(!files.length && !folders.length) || emptyTrash.isPending || emptyTrashFolders.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200/60 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
          >
            <XCircle size={16} />
            {emptyTrash.isPending || emptyTrashFolders.isPending ? "Emptying..." : "Empty Trash"}
          </button>
        </header>

        <main className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          {trashFiles.isLoading || trashFolders.isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : trashFiles.isError || trashFolders.isError ? (
            <div className="p-8 text-center text-sm font-medium text-rose-600">
              Unable to load trash.
            </div>
          ) : !files.length && !folders.length ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-400">
                <Trash2 size={32} />
              </div>
              <h3 className="font-semibold text-slate-700">Trash is empty</h3>
              <p className="mt-1 text-sm text-slate-400">Deleted files and folders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6 p-4">
              {folders.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Folders</h2>
                  <TrashGrid
                    items={folders}
                    onRestore={(item) => restoreFolder.mutate(item._id)}
                    onPermanentlyDelete={(item) => permanentlyDeleteFolder.mutate(item._id)}
                  />
                </div>
              )}

              {files.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Files</h2>
                  <TrashGrid
                    items={files}
                    onRestore={(item) => restoreFile.mutate(item._id)}
                    onPermanentlyDelete={(item) => permanentlyDeleteFile.mutate(item._id)}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Trash;
