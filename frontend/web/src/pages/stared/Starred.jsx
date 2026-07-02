import { Sparkles, Star } from "lucide-react";

import FileGrid from "../../components/drive/FileGrid";
import { useStarredFiles } from "../../hooks/useFiles";

const Starred = () => {
  const starredFiles = useStarredFiles();
  const files = starredFiles.data || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500/10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-amber-500">
              <Star className="h-6 w-6 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <div className="mb-0.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
                Favorites
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Starred Files
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Files you star in My Drive appear here automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50 px-4 py-2.5 sm:self-center">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase leading-none tracking-wider text-slate-400">
                Bookmarked
              </div>
              <div className="mt-0.5 text-sm font-bold text-slate-700">
                {files.length} files
              </div>
            </div>
          </div>
        </header>

        <main className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <FileGrid
            files={files}
            isLoading={starredFiles.isLoading}
            isError={starredFiles.isError}
            variant="starred"
            viewMode="list"
          />
        </main>
      </div>
    </div>
  );
};

export default Starred;
