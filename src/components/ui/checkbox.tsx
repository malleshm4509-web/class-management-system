import React from "react";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode; className?: string };

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <input type="checkbox" className="w-4 h-4 rounded border" {...props} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export default Checkbox;
