import React from "react";
import { X } from "lucide-react";

export default function ReplyPreview({ message, onCancel }) {
  if (!message) return null;

  const senderName = message.senderId?.fullName || message.author || "Unknown";
  const preview = message.isDeleted
    ? "This message was deleted"
    : message.text
    ? message.text.slice(0, 80) + (message.text.length > 80 ? "\u2026" : "")
    : message.fileType === "image"
    ? "\uD83D\uDCF7 Image"
    : message.fileType === "document"
    ? "\uD83D\uDCC4 Document"
    : "\uD83D\uDCCE Attachment";

  return (
    <div className="mx-3 mb-1 flex items-center gap-2 bg-purple-50 border-l-4 border-[#6C48F5] rounded-r-lg px-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-[#6C48F5] truncate">{senderName}</p>
        <p className="text-xs text-gray-500 truncate">{preview}</p>
      </div>
      <button
        onClick={onCancel}
        className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-500 transition-colors"
      >
        <X size={11} />
      </button>
    </div>
  );
}
