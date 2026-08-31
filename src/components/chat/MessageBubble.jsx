import React, { useState, useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Check, CheckCheck, Clock, AlertCircle, Reply, Copy, Edit2, Trash2, Smile, Download, FileText, Film, Music, CornerUpRight } from "lucide-react";
import { getMediaUrl } from "../../api";
import ReactionPicker from "./ReactionPicker";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatMsgTime(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday " + format(d, "h:mm a");
  return format(d, "MMM d, h:mm a");
}

function humanFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Status icon shown for sent messages
function StatusIcon({ status }) {
  if (status === "sending") return <Clock size={11} className="text-gray-400 animate-spin" />;
  if (status === "failed") return <AlertCircle size={11} className="text-red-400" />;
  if (status === "sent") return <Check size={12} className="text-gray-400" />;
  if (status === "delivered") return <CheckCheck size={12} className="text-gray-400" />;
  if (status === "read" || status === "seen") return <CheckCheck size={12} className="text-[#3582FB]" />;
  return <Check size={12} className="text-gray-400" />;
}

// Quoted reply block inside bubble
function ReplyQuote({ replyTo, onScrollTo }) {
  if (!replyTo) return null;
  const name = replyTo.senderId?.fullName || "Unknown";
  const preview = replyTo.isDeleted
    ? "This message was deleted"
    : replyTo.text
    ? replyTo.text.slice(0, 60) + (replyTo.text.length > 60 ? "\u2026" : "")
    : replyTo.fileType === "image" ? "\uD83D\uDCF7 Image" : "\uD83D\uDCCE Attachment";

  return (
    <div
      onClick={() => onScrollTo && onScrollTo(replyTo._id)}
      className="mb-1.5 border-l-2 border-[#6C48F5]/50 bg-black/5 rounded-r-lg px-2 py-1 cursor-pointer hover:bg-black/10 transition-colors"
    >
      <p className="text-[10px] font-bold text-[#6C48F5]/80 truncate">{name}</p>
      <p className="text-[11px] text-gray-600 truncate">{preview}</p>
    </div>
  );
}

// Attachment rendering inside a bubble
function AttachmentContent({ msg }) {
  const { fileUrl, fileType, fileName, fileSize } = msg;
  if (!fileUrl) return null;
  const src = getMediaUrl(fileUrl);

  if (fileType === "image") {
    return (
      <div className="mt-1 mb-1 rounded-xl overflow-hidden max-w-[220px]">
        <img
          src={src}
          alt={fileName || "Image"}
          className="w-full object-cover rounded-xl"
          onError={e => { e.currentTarget.style.display = "none"; }}
        />
      </div>
    );
  }
  if (fileType === "video") {
    return (
      <video controls className="mt-1 rounded-xl max-w-[220px]" src={src}>
        Your browser does not support video.
      </video>
    );
  }
  if (fileType === "audio") {
    return (
      <audio controls className="mt-1 w-full max-w-[220px]" src={src} />
    );
  }
  // document / file
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="mt-1 flex items-center gap-2 bg-white/30 rounded-xl px-3 py-2 hover:bg-white/50 transition-colors max-w-[220px]"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
        <FileText size={16} className="text-amber-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-800 truncate">{fileName || "File"}</p>
        {fileSize > 0 && <p className="text-[10px] text-gray-500">{humanFileSize(fileSize)}</p>}
      </div>
      <Download size={14} className="text-gray-500 flex-shrink-0" />
    </a>
  );
}

// Reactions row below bubble
function ReactionsRow({ reactions, currentUserId, onReact }) {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map(r => {
        const myReacted = r.users?.some(uid => {
          const id = typeof uid === "object" ? uid._id || uid.id : uid;
          return id === currentUserId;
        });
        return (
          <button
            key={r.emoji}
            onClick={() => onReact(r.emoji)}
            className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
              myReacted
                ? "bg-[#6C48F5]/10 border-[#6C48F5]/40 text-[#6C48F5]"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <span>{r.emoji}</span>
            <span className="font-semibold">{r.users?.length || 0}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function MessageBubble({
  msg,
  isMe,
  showAvatar,
  showName,
  currentUserId,
  token,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRetry,
  onScrollTo,
}) {
  const [hovered, setHovered] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text || "");
  const bubbleRef = useRef(null);

  const senderName = msg.senderId?.fullName || msg.author || "Member";
  const avatarUrl = getMediaUrl(msg.senderId?.avatar);
  const initials = senderName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const timeStr = formatMsgTime(msg.createdAt);
  const status = msg.status || msg.messageStatus || "sent";

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim() === msg.text) { setIsEditing(false); return; }
    await onEdit(msg._id, editText.trim());
    setIsEditing(false);
  };

  if (msg.isDeleted) {
    return (
      <div
        id={`msg-${msg._id}`}
        className={cn("flex gap-2 max-w-[75%] group", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}
      >
        {!isMe && <div className="w-8 flex-shrink-0" />}
        <div className={cn(
          "px-4 py-2 rounded-2xl text-[13px] italic text-gray-400 border",
          isMe ? "bg-gray-100 rounded-tr-sm border-gray-200" : "bg-gray-50 rounded-tl-sm border-gray-200"
        )}>
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div
      id={`msg-${msg._id}`}
      className={cn("flex gap-2 max-w-[75%] group relative", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowReactionPicker(false); }}
    >
      {/* Avatar */}
      {!isMe && (
        showAvatar ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-auto overflow-hidden">
            {avatarUrl
              ? <img src={avatarUrl} alt={senderName} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
              : initials
            }
          </div>
        ) : <div className="w-8 flex-shrink-0" />
      )}

      {/* Bubble column */}
      <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>

        {/* Sender name (group chats) */}
        {!isMe && showName && (
          <span className="text-[10px] font-semibold text-orange-500 mb-0.5 ml-1">{senderName}</span>
        )}

        {/* Bubble */}
        <div className="relative">
          <div
            ref={bubbleRef}
            className={cn(
              "relative px-3 py-2 text-[14px] shadow-sm flex flex-col transition-all",
              isMe
                ? "bg-[#EDE9FF] text-gray-800 rounded-2xl rounded-tr-sm"
                : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100",
              status === "failed" && "opacity-80"
            )}
          >
            {/* Reply quote */}
            {msg.replyTo && (
              <ReplyQuote replyTo={msg.replyTo} onScrollTo={onScrollTo} />
            )}

            {/* Attachment */}
            <AttachmentContent msg={msg} />

            {/* Text — editable mode */}
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <textarea
                  autoFocus
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                  className="bg-transparent outline-none resize-none text-[14px] min-w-[120px] w-full border-b border-[#6C48F5]/40 pb-0.5"
                  rows={2}
                />
                <div className="flex gap-1 justify-end">
                  <button onClick={() => setIsEditing(false)} className="text-[10px] text-gray-400 hover:text-gray-600">Cancel</button>
                  <button onClick={handleSaveEdit} className="text-[10px] text-[#6C48F5] font-semibold hover:text-purple-700">Save</button>
                </div>
              </div>
            ) : (
              msg.text && (
                <span className="break-words leading-snug pb-4 pr-10 whitespace-pre-wrap">
                  {msg.text}
                  {msg.isEdited && (
                    <span className="text-[9px] text-gray-400 ml-1 align-middle">(edited)</span>
                  )}
                </span>
              )
            )}

            {/* Timestamp + status */}
            <div className={cn(
              "absolute bottom-1.5 flex items-center gap-0.5",
              isMe ? "right-2" : "right-2"
            )}>
              <span className="text-[9px] text-gray-400/90 leading-none whitespace-nowrap">{timeStr}</span>
              {isMe && (
                <span>
                  <StatusIcon status={status} />
                </span>
              )}
            </div>

            {/* Failed retry */}
            {isMe && status === "failed" && (
              <button
                onClick={() => onRetry && onRetry(msg)}
                className="mt-1 text-[10px] text-red-500 font-semibold hover:text-red-700 flex items-center gap-1"
              >
                <AlertCircle size={10} /> Retry
              </button>
            )}
          </div>

          {/* Reaction picker */}
          {showReactionPicker && (
            <ReactionPicker
              onReact={(emoji) => onReact && onReact(msg._id, emoji)}
              onClose={() => setShowReactionPicker(false)}
            />
          )}
        </div>

        {/* Reactions row */}
        <ReactionsRow
          reactions={msg.reactions}
          currentUserId={currentUserId}
          onReact={(emoji) => onReact && onReact(msg._id, emoji)}
        />
      </div>

      {/* Hover action bar */}
      {hovered && !isEditing && (
        <div className={cn(
          "absolute top-0 flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl shadow-md px-1 py-0.5 z-20",
          isMe ? "left-0 -translate-x-full -ml-1" : "right-0 translate-x-full ml-1"
        )}>
          <button
            title="Reply"
            onClick={() => onReply && onReply(msg)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Reply size={13} />
          </button>
          <button
            title="React"
            onClick={() => setShowReactionPicker(v => !v)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Smile size={13} />
          </button>
          <button
            title="Copy"
            onClick={() => msg.text && navigator.clipboard.writeText(msg.text)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Copy size={13} />
          </button>
          {isMe && (
            <>
              <button
                title="Edit"
                onClick={() => { setEditText(msg.text || ""); setIsEditing(true); setHovered(false); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Edit2 size={13} />
              </button>
              <button
                title="Delete"
                onClick={() => onDelete && onDelete(msg._id)}
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
