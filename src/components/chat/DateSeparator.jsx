import React from "react";
import { format, isToday, isYesterday } from "date-fns";

export default function DateSeparator({ date }) {
  const d = new Date(date);
  let label;
  if (isToday(d)) label = "Today";
  else if (isYesterday(d)) label = "Yesterday";
  else label = format(d, "d MMMM yyyy");

  return (
    <div className="flex items-center gap-3 my-4 select-none">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[11px] font-semibold text-gray-400 px-2 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
