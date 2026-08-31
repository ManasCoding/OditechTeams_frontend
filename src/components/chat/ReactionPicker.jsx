import React from "react";

const QUICK_REACTIONS = ["\uD83D\uDC4D", "\u2764\uFE0F", "\uD83D\uDE02", "\uD83D\uDE2E", "\uD83D\uDE22", "\uD83C\uDF89"];

export default function ReactionPicker({ onReact, onClose }) {
  return (
    <div
      className="absolute z-50 bottom-full mb-1 bg-white border border-gray-200 rounded-2xl shadow-xl px-2 py-1.5 flex gap-1"
      onMouseLeave={onClose}
    >
      {QUICK_REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => { onReact(emoji); onClose(); }}
          className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-gray-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
