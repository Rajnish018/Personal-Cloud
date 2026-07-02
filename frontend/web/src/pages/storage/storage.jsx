import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  HardDrive,
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  Trash2,
  Search,
  ArrowUpDown,
  ChevronDown,
  FolderOpen,
  Clock,
  Download,
  Eye,
  Cloud,
  Database,
  TrendingUp,
  File,
  Music,
  Archive,
  Code,
} from "lucide-react";
import { fileApi } from "../../api";
import { useProfile } from "../../hooks/useUsers";
import { formatBytes } from "../../utils/drive";
import { QUERY_KEYS } from "../../utils/constants";

const Storage = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("size-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"

  const { data: profileData } = useProfile();

  const {
    data: storageMetrics,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.storageMetrics,
    queryFn: async () => {
      const response = await fileApi.getStorageMetrics();
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
  console.log("Storage Metrics:", storageMetrics);

  const deleteFileMutation = useMutation({
    mutationFn: (fileId) => fileApi.permanentlyDeleteFile(fileId),
    onSuccess: () => {
      toast.success("File deleted permanently.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storageMetrics });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recentFiles });
    },
    onError: (err) => {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to delete file permanently.");
    },
  });

  const allFiles = storageMetrics?.files || storageMetrics?.largeFiles || [];

  const visibleFiles = useMemo(() => {
    let filtered =
      typeFilter === "all"
        ? [...allFiles]
        : allFiles.filter((file) => file.typeGroup === typeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name?.toLowerCase().includes(q) ||
          f.typeGroup?.toLowerCase().includes(q)
      );
    }

    const sorters = {
      "size-desc": (a, b) => (b.size || 0) - (a.size || 0),
      "size-asc": (a, b) => (a.size || 0) - (b.size || 0),
      "name-asc": (a, b) => (a.name || "").localeCompare(b.name || ""),
      "name-desc": (a, b) => (b.name || "").localeCompare(a.name || ""),
      "date-desc": (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
      "date-asc": (a, b) =>
        new Date(a.updatedAt || a.createdAt || 0) -
        new Date(b.updatedAt || b.createdAt || 0),
    };

    return filtered.sort(sorters[sortBy] || sorters["size-desc"]);
  }, [allFiles, sortBy, typeFilter, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-400">
        <div className="relative">
          <Loader2 size={40} className="animate-spin text-[#185FA5]" />
          <div className="absolute inset-0 animate-ping rounded-full bg-[#185FA5]/10" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Loading storage details...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <AlertTriangle size={28} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Storage unavailable</h3>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          {error?.response?.data?.message || "Failed to load storage details."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-[#185FA5] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#185FA5]/20 transition hover:bg-[#14508c]"
        >
          Try again
        </button>
      </div>
    );
  }

  const rawUsed =
    storageMetrics?.usedSpaceBytes ?? profileData?.user?.storageUsed ?? 0;
  const rawTotal =
    storageMetrics?.totalSpaceBytes ??
    profileData?.user?.storageLimit ??
    15 * 1024 ** 3;
  const rawRemaining = Math.max(rawTotal - rawUsed, 0);

  const percentageUsed = rawTotal ? Math.min((rawUsed / rawTotal) * 100, 100) : 0;

  const isLowStorage = percentageUsed >= 85;
  const isCriticalStorage = percentageUsed >= 95;

  const categories = storageMetrics?.categories || [];

  const filterOptions = [
    { value: "all", label: "All files", count: allFiles.length },
    ...categories.map((category) => ({
      value: category.key,
      label: category.label,
      count: category.count,
    })),
  ];

  const getCategoryIcon = (label) => {
    const l = label?.toLowerCase();
    if (l?.includes("video")) return Video;
    if (l?.includes("image") || l?.includes("photo")) return ImageIcon;
    if (l?.includes("document") || l?.includes("pdf")) return FileText;
    if (l?.includes("spreadsheet") || l?.includes("data")) return FileSpreadsheet;
    if (l?.includes("audio") || l?.includes("music")) return Music;
    if (l?.includes("archive") || l?.includes("zip")) return Archive;
    if (l?.includes("code")) return Code;
    return File;
  };

  const getCategoryColor = (category) => {
    const key = category?.key || category?.label?.toLowerCase();
    if (key?.includes("photo") || key?.includes("image")) return "bg-emerald-500";
    if (key?.includes("video")) return "bg-rose-500";
    if (key?.includes("document")) return "bg-blue-500";
    if (key?.includes("spreadsheet")) return "bg-amber-500";
    if (key?.includes("audio")) return "bg-purple-500";
    if (key?.includes("archive")) return "bg-slate-500";
    return "bg-[#185FA5]";
  };

  const getCategoryBgColor = (category) => {
    const key = category?.key || category?.label?.toLowerCase();
    if (key?.includes("photo") || key?.includes("image")) return "bg-emerald-50 text-emerald-600";
    if (key?.includes("video")) return "bg-rose-50 text-rose-600";
    if (key?.includes("document")) return "bg-blue-50 text-blue-600";
    if (key?.includes("spreadsheet")) return "bg-amber-50 text-amber-600";
    if (key?.includes("audio")) return "bg-purple-50 text-purple-600";
    if (key?.includes("archive")) return "bg-slate-50 text-slate-600";
    return "bg-[#185FA5]/5 text-[#185FA5]";
  };

  const getFileIcon = (file) => {
    const type = (file.typeGroup || file.resourceType || "").toLowerCase();
    if (type.includes("video")) return Video;
    if (type.includes("image")) return ImageIcon;
    if (type.includes("spreadsheet")) return FileSpreadsheet;
    if (type.includes("audio")) return Music;
    if (type.includes("archive")) return Archive;
    if (type.includes("code")) return Code;
    return FileText;
  };

  const getFileColor = (file) => {
    const type = (file.typeGroup || file.resourceType || "").toLowerCase();
    if (type.includes("video")) return "bg-rose-50 text-rose-500";
    if (type.includes("image")) return "bg-emerald-50 text-emerald-500";
    if (type.includes("spreadsheet")) return "bg-amber-50 text-amber-500";
    if (type.includes("audio")) return "bg-purple-50 text-purple-500";
    if (type.includes("archive")) return "bg-slate-50 text-slate-500";
    if (type.includes("code")) return "bg-cyan-50 text-cyan-500";
    return "bg-blue-50 text-blue-500";
  };

  const formatFileDate = (file) => {
    const value = file.updatedAt || file.createdAt;
    if (!value) return "-";
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const toggleFileSelection = (fileId) => {
    const next = new Set(selectedFiles);
    if (next.has(fileId)) next.delete(fileId);
    else next.add(fileId);
    setSelectedFiles(next);
  };

  const selectAll = () => {
    if (selectedFiles.size === visibleFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(visibleFiles.map((f) => f._id || f.id)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 antialiased selection:bg-[#185FA5]/10">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#185FA5] via-[#1a6bb8] to-[#0d3a66] p-8 sm:p-10 shadow-2xl shadow-[#185FA5]/20">
          <div className="absolute right-0 top-0 h-72 w-72 -translate-y-1/3 translate-x-1/4 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 h-56 w-56 -translate-x-1/4 translate-y-1/3 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm">
                <Database size={13} />
                <span>Storage Management</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Storage Overview
              </h1>
              <p className="mt-2 max-w-lg text-base text-white/70">
                Manage your files, track usage, and optimize your storage space.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm min-w-[120px]">
                <p className="text-2xl font-bold text-white">{formatBytes(rawUsed)}</p>
                <p className="mt-0.5 text-xs font-medium text-white/60">Used</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm min-w-[120px]">
                <p className="text-2xl font-bold text-white">{formatBytes(rawRemaining)}</p>
                <p className="mt-0.5 text-xs font-medium text-white/60">Free</p>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={HardDrive}
            label="Total Capacity"
            value={formatBytes(rawTotal)}
            color="blue"
          />
          <StatCard
            icon={Database}
            label="Used Space"
            value={formatBytes(rawUsed)}
            color="indigo"
            trend={`${Math.round(percentageUsed)}%`}
          />
          <StatCard
            icon={Cloud}
            label="Available"
            value={formatBytes(rawRemaining)}
            color="emerald"
          />
          <StatCard
            icon={File}
            label="Total Files"
            value={allFiles.length.toLocaleString()}
            color="amber"
          />
        </div>

        {/* Main Storage Bar */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Storage Usage
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {Math.round(percentageUsed)}%
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  used of {formatBytes(rawTotal)}
                </span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                isCriticalStorage
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : isLowStorage
                  ? "border-amber-200 bg-amber-50 text-amber-600"
                  : "border-emerald-200 bg-emerald-50 text-emerald-600"
              }`}
            >
              {isCriticalStorage ? (
                <AlertTriangle size={13} />
              ) : isLowStorage ? (
                <TrendingUp size={13} />
              ) : (
                <Cloud size={13} />
              )}
              {isCriticalStorage
                ? "Critical"
                : isLowStorage
                ? "Running low"
                : "Healthy"}
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
            <div className="flex h-full">
              {categories.length > 0 ? (
                categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className={`${getCategoryColor(cat)} h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${(cat.sizeBytes / rawTotal) * 100}%` }}
                    title={`${cat.label}: ${formatBytes(cat.sizeBytes)}`}
                  />
                ))
              ) : (
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isCriticalStorage
                      ? "bg-rose-500"
                      : isLowStorage
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-[#185FA5] to-[#4A9FD4]"
                  }`}
                  style={{ width: `${percentageUsed}%` }}
                />
              )}
            </div>
          </div>

          {/* Category Legend */}
          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5"
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${getCategoryColor(cat)}`}
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    {cat.label}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {formatBytes(cat.sizeBytes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Cards */}
        {categories.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat, idx) => {
              const Icon = getCategoryIcon(cat.label);
              const percent = rawTotal ? (cat.sizeBytes / rawTotal) * 100 : 0;
              return (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${getCategoryBgColor(cat)} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {cat.count} files
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-900">
                    {cat.label}
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    {formatBytes(cat.sizeBytes)}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${getCategoryColor(cat)} transition-all duration-700`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
                    {Math.round(percent)}% of total storage
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Files Section */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  All Storage Files
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  {visibleFiles.length} file{visibleFiles.length !== 1 ? "s" : ""} found
                  {selectedFiles.size > 0 && (
                    <span className="ml-2 text-[#185FA5]">
                      • {selectedFiles.size} selected
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-48 rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-[#185FA5]/30 focus:bg-white focus:ring-4 focus:ring-[#185FA5]/5"
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-600 outline-none transition hover:border-slate-300 focus:border-[#185FA5]"
                  >
                    {filterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-600 outline-none transition hover:border-slate-300 focus:border-[#185FA5]"
                  >
                    <option value="size-desc">Largest first</option>
                    <option value="size-asc">Smallest first</option>
                    <option value="name-asc">Name A–Z</option>
                    <option value="name-desc">Name Z–A</option>
                    <option value="date-desc">Newest first</option>
                    <option value="date-asc">Oldest first</option>
                  </select>
                  <ArrowUpDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                      viewMode === "list"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                      viewMode === "grid"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Grid
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedFiles.size > 0 && (
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#185FA5]/[0.02] px-6 py-3 animate-in slide-in-from-top-2">
              <span className="text-sm font-bold text-[#185FA5]">
                {selectedFiles.size} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFiles(new Set())}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Clear
                </button>
                <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition">
                  Delete selected
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!visibleFiles.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Search size={28} />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-900">
                No files found
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : viewMode === "list" ? (
            /* List View */
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3.5">
                      <input
                        type="checkbox"
                        checked={
                          visibleFiles.length > 0 &&
                          selectedFiles.size === visibleFiles.length
                        }
                        onChange={selectAll}
                        className="h-4 w-4 rounded border-slate-300 text-[#185FA5] focus:ring-[#185FA5]/20"
                      />
                    </th>
                    <th className="px-2 py-3.5">File</th>
                    <th className="px-6 py-3.5 hidden sm:table-cell">Type</th>
                    <th className="px-6 py-3.5 hidden md:table-cell">Location</th>
                    <th className="px-6 py-3.5">Size</th>
                    <th className="px-6 py-3.5 hidden lg:table-cell">Modified</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visibleFiles.map((file) => {
                    const FileIcon = getFileIcon(file);
                    const isSelected = selectedFiles.has(file._id || file.id);
                    return (
                      <tr
                        key={file._id || file.id}
                        className={`group transition-colors hover:bg-slate-50/80 ${
                          isSelected ? "bg-[#185FA5]/[0.02]" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleFileSelection(file._id || file.id)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-[#185FA5] focus:ring-[#185FA5]/20"
                          />
                        </td>
                        <td className="px-2 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${getFileColor(file)}`}
                            >
                              <FileIcon size={16} />
                            </div>
                            <span className="max-w-[200px] truncate text-sm font-bold text-slate-900">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="inline-flex rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            {file.typeGroup || file.resourceType || "file"}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <FolderOpen size={13} />
                            {file.location || "/"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-600">
                            {formatBytes(file.size)}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock size={13} />
                            {formatFileDate(file)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition">
                              <Eye size={14} />
                            </button>
                            <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition">
                              <Download size={14} />
                            </button>
                            <button
                              disabled={deleteFileMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Delete this file permanently?"
                                  )
                                ) {
                                  deleteFileMutation.mutate(
                                    file._id || file.id
                                  );
                                }
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-40"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleFiles.map((file) => {
                const FileIcon = getFileIcon(file);
                const isSelected = selectedFiles.has(file._id || file.id);
                return (
                  <div
                    key={file._id || file.id}
                    onClick={() => toggleFileSelection(file._id || file.id)}
                    className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/5 ${
                      isSelected
                        ? "border-[#185FA5] bg-[#185FA5]/[0.02] ring-1 ring-[#185FA5]/20"
                        : "border-slate-200/80 bg-white hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${getFileColor(file)}`}
                      >
                        <FileIcon size={18} />
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(file._id || file.id);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-[#185FA5] focus:ring-[#185FA5]/20"
                      />
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-900 line-clamp-2">
                      {file.name}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                      {formatBytes(file.size)}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock size={11} />
                      {formatFileDate(file)}
                    </div>

                    {/* Hover actions */}
                    <div className="absolute right-3 top-14 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm("Delete this file permanently?")
                          ) {
                            deleteFileMutation.mutate(file._id || file.id);
                          }
                        }}
                        className="rounded-lg bg-white p-1.5 text-slate-400 shadow-sm hover:text-rose-600 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, trend }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon size={20} />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-[11px] font-bold text-slate-400">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-3 text-lg font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
    </div>
  );
};

export default Storage;