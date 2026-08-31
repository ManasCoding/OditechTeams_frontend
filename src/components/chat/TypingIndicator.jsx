import React from "react";

export default function TypingIndicator({ name }) {
  return (
    <div className="flex gap-2 max-w-[75%] mr-auto items-end">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
        {name ? name[0]?.toUpperCase() : "?"}
      </div>
      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex flex-col gap-0.5">
        {name && (
          <span className="text-[10px] font-semibold text-gray-400">{name} is typing</span>
        )}
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1s" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1s" }} />
        </div>
      </div>
    </div>
  );
}
