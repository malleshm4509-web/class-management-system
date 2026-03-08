import React from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & { className?: string };

export function Label({ children, className = "", ...props }: LabelProps) {
  return (
    <label className={`block text-sm font-medium mb-1 ${className}`} {...props}>
      {children}
    </label>
  );
}

export default Label;
