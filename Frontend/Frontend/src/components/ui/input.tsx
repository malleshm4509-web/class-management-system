import React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none ${className}`}
      {...props}
    />
  );
}

export default Input;
