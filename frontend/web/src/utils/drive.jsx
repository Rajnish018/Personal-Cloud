import { FileArchive, FileAudio, FileText, Image, Video, File } from "lucide-react";

export const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

export const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const fileIconFor = (file, size = 20) => {
  const type = file?.resourceType;
  const extension = file?.extension || file?.format || "";

  if (type === "image") return <Image size={size} className="text-emerald-600" />;
  if (type === "video") return <Video size={size} className="text-rose-600" />;
  if (file?.mimeType?.startsWith("audio/")) {
    return <FileAudio size={size} className="text-violet-600" />;
  }
  if (["zip", "rar", "7z"].includes(extension)) {
    return <FileArchive size={size} className="text-amber-600" />;
  }
  if (["pdf", "doc", "docx", "txt"].includes(extension)) {
    return <FileText size={size} className="text-blue-600" />;
  }

  return <File size={size} className="text-slate-500" />;
};
