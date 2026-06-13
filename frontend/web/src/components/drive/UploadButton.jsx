import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

const UploadButton = () => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    console.log("Selected file:", files[0].name);

    setTimeout(() => {
      setIsUploading(false);
      alert(`"${files[0].name}" uploaded successfully!`);
    }, 1500);
  };

  return (
    // Changed to w-full sm:w-auto so the container adjusts correctly on mobile
    <div className="relative w-full sm:w-auto inline-block">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      {/* Adjusted Responsive Button */}
      <button
        type="button"
        disabled={isUploading}
        onClick={handleButtonClick}
        className={`
          flex items-center justify-center gap-2.5
          rounded-xl font-medium text-sm
          bg-[#185FA5] text-white shadow-sm
          w-full sm:w-auto px-5 py-2.5 h-11
          transition-all duration-150
          hover:bg-[#14508c] hover:shadow
          active:scale-[0.98]
          focus:outline-none focus:ring-4 focus:ring-[#185FA5]/20
          disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none
          group
        `}
      >
        {isUploading ? (
          <Loader2 size={18} className="animate-spin text-[#85B7EB]" />
        ) : (
          <Upload size={18} className="text-[#85B7EB] transition-transform group-hover:-translate-y-0.5" />
        )}
        
        <span className="whitespace-nowrap">
          {isUploading ? "Uploading..." : "Upload files"}
        </span>
      </button>
    </div>
  );
};

export default UploadButton;