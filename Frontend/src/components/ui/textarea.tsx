import React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string };

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`border rounded-md px-3 py-2 w-full min-h-[100px] focus:ring-2 focus:ring-blue-400 outline-none ${className}`}
      {...props}
    />
  );
}

export default Textarea;
