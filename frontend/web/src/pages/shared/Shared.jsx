import {
  Copy,
  ExternalLink,
  FileText,
  Folder,
  Link2,
  Loader2,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  useMyShares,
  useRevokeShare,
  useUpdateSharePermission,
} from "../../hooks/useSharedFiles";
import { fileIconFor, formatBytes, formatDate } from "../../utils/drive";
import ConfirmationDialog from "../../components/confimationDialog"; // Make sure to adjust this path to your folder setup

const permissionOptions = [
  { value: "view", label: "View" },
  { value: "download", label: "Download" },
  { value: "edit", label: "Edit" },
];

const Shared = () => {
  const [searchFilter, setSearchFilter] = useState("");
  const [shareToRevoke, setShareToRevoke] = useState(null); // Tracks the item currently being revoked

  const { data: shares = [], isLoading, isError, refetch } = useMyShares();
  const updatePermission = useUpdateSharePermission();
  const revokeShare = useRevokeShare();

  const filteredShares = useMemo(() => {
    const term = searchFilter.trim().toLowerCase();
    if (!term) return shares;

    return shares.filter((share) => {
      const resourceName = share.resource?.name || "";
      return (
        resourceName.toLowerCase().includes(term) ||
        share.resourceType?.toLowerCase().includes(term) ||
        share.shareLink?.toLowerCase().includes(term)
      );
    });
  }, [searchFilter, shares]);

  const copyLink = async (shareLink) => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Share link copied");
    } catch {
      toast.error("Could not copy link automatically");
    }
  };

  const handlePermissionChange = (share, permission) => {
    updatePermission.mutate({
      shareId: share._id,
      permission,
    });
  };

  const handleRevokeClick = (share) => {
    setShareToRevoke(share);
  };

  const confirmRevoke = () => {
    if (!shareToRevoke) return;
    
    revokeShare.mutate(shareToRevoke._id, {
      onSuccess: () => {
        setShareToRevoke(null);
      },
    });
  };

  const getPermission = (share) => share.permissions?.[0] || "view";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-600">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Sharing
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Shared Links
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage files and folders you are sharing by link.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/60 bg-slate-50 px-4 py-3 text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Links
            </div>
            <div className="mt-1 text-xl font-bold leading-none text-slate-800">
              {filteredShares.length}
            </div>
          </div>
        </header>

        <main className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
                placeholder="Search shared links..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-slate-400">Loading shared links...</p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <div className="inline-block rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-2 text-sm font-medium text-rose-600">
                Failed to load shared links.
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="mx-auto mt-3 block text-xs font-bold text-indigo-600 hover:underline"
              >
                Try Refreshing
              </button>
            </div>
          ) : !filteredShares.length ? (
            <div className="m-6 rounded-xl border-2 border-dashed border-slate-100 py-16 text-center text-sm text-slate-400">
              {searchFilter ? "No shared links match your search." : "No files or folders are shared yet."}
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Header Row */}
              <div className="hidden border-b border-slate-200/80 bg-slate-50/70 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 md:grid md:grid-cols-12 md:gap-4 md:items-center">
                <div className="md:col-span-4 font-bold">Item</div>
                <div className="md:col-span-3 font-bold">Link</div>
                <div className="md:col-span-2 font-bold">Permission</div>
                <div className="md:col-span-2 font-bold">Created</div>
                <div className="md:col-span-1 text-right font-bold md:pr-2">Actions</div>
              </div>

              {/* Data Rows */}
              <div className="divide-y divide-slate-100 text-sm">
                {filteredShares.map((share) => {
                  const resource = share.resource || {};
                  const isFolder = share.resourceType === "folder";
                  const isBroken = !resource._id;

                  return (
                    <div
                      key={share._id}
                      className="grid grid-cols-1 gap-4 px-6 py-5 transition-colors hover:bg-slate-50/60 md:grid-cols-12 md:items-center md:gap-4 md:py-4"
                    >
                      {/* Item Info Column */}
                      <div className="md:col-span-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                            {isFolder ? (
                              <Folder className="h-5 w-5 text-indigo-600" />
                            ) : isBroken ? (
                              <FileText className="h-5 w-5 text-slate-400" />
                            ) : (
                              fileIconFor(resource)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {resource.name || "Missing item"}
                            </p>
                            <p className="mt-0.5 text-xs capitalize text-slate-400">
                              {share.resourceType}{" "}
                              {!isFolder && ` - ${resource.size ? formatBytes(resource.size) : "(Unknown size)"}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Link Column */}
                      <div className="md:col-span-3">
                        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Link</span>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate font-mono text-xs">{share.shareLink}</span>
                        </div>
                      </div>

                      {/* Permission Column */}
                      <div className="md:col-span-2">
                        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Permission</span>
                        <select
                          value={getPermission(share)}
                          disabled={updatePermission.isPending}
                          onChange={(event) => handlePermissionChange(share, event.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                        >
                          {permissionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Created Date Column */}
                      <div className="md:col-span-2 text-slate-500">
                        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Created</span>
                        <span className="text-xs md:text-sm">{formatDate(share.createdAt)}</span>
                      </div>

                      {/* Actions Column */}
                      <div className="flex md:col-span-1 flex-col items-start md:items-end md:justify-end md:pr-2">
                        <span className="mb-2 block text-xs font-medium text-slate-400 md:hidden">Actions</span>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyLink(share.shareLink)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            title="Copy link"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(share.shareLink, "_blank", "noopener,noreferrer")}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            title="Open link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeClick(share)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title="Stop sharing"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Confirmation Dialog integration */}
      <ConfirmationDialog
        isOpen={Boolean(shareToRevoke)}
        onClose={() => setShareToRevoke(null)}
        onConfirm={confirmRevoke}
        isLoading={revokeShare.isPending}
        variant="danger"
        title="Stop Sharing?"
        confirmLabel="Stop Sharing"
        cancelLabel="Cancel"
        description={
          <p>
            Are you sure you want to stop sharing{" "}
            <span className="font-semibold text-slate-800 break-all">
              "{shareToRevoke?.resource?.name || "this item"}"
            </span>
            ? The current access link will instantly stop working.
          </p>
        }
      />
    </div>
  );
};

export default Shared;
