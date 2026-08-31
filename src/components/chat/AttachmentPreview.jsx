import React from "react";
import { X, FileText, Film, Music } from "lucide-react";

function humanFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentPreview({ attachment, onRemove }) {
  if (!attachment) return null;
  const { fileUrl, fileType, fileName, fileSize, localPreview } = attachment;
  const src = localPreview || fileUrl;

  return (
    <div className="mx-3 mb-1 relative inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 max-w-xs">
      {fileType === "image" ? (
        <img src={src} alt="preview" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      ) : fileType === "video" ? (
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Film size={20} className="text-blue-500" />
        </div>
      ) : fileType === "audio" ? (
        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
          <Music size={20} className="text-green-500" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <FileText size={20} className="text-amber-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{fileName || "File"}</p>
        {fileSize > 0 && <p className="text-[10px] text-gray-400">{humanFileSize(fileSize)}</p>}
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
      >
        <X size={10} />
      </button>
    </div>
  );
}
