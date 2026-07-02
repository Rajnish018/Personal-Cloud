import { AlertTriangle, Info, Loader2, X } from "lucide-react";
import { useEffect } from "react";

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  variant = "danger", // 'danger' | 'warning' | 'info'
}) => {
  // Close modal when user hits Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !isLoading) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  // Configuration mapping based on the chosen visual variant
  const styles = {
    danger: {
      icon: <AlertTriangle className="h-5 w-5" />,
      iconBg: "bg-rose-50 border-rose-100 text-rose-600",
      confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 disabled:bg-rose-600/70",
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      iconBg: "bg-amber-50 border-amber-100 text-amber-600",
      confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 disabled:bg-amber-600/70",
    },
    info: {
      icon: <Info className="h-5 w-5" />,
      iconBg: "bg-indigo-50 border-indigo-100 text-indigo-600",
      confirmBtn: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 disabled:bg-indigo-600/70",
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Backdrop Blur Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => !isLoading && onClose()}
      />

      {/* Dialog Shell */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none disabled:opacity-50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content Body */}
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.iconBg}`}>
            {styles.icon}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              {title}
            </h3>
            <div className="text-sm text-slate-500 leading-relaxed">
              {description}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none disabled:cursor-not-allowed ${styles.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmationDialog;