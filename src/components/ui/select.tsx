import React, { createContext, useContext, useMemo, useState, useRef, useEffect } from "react";

type SelectContextType = {
  value: string | number | "";
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (b: boolean) => void;
};

const SelectContext = createContext<SelectContextType | null>(null);

export type SelectProps = {
  value?: string | number | "";
  onValueChange?: (v: string) => void;
  children?: React.ReactNode;
  className?: string;
};

export function Select({ value = "", onValueChange = () => {}, children, className = "" }: SelectProps) {
  const [open, setOpen] = useState(false);

  // Controlled-ish: if value changes externally, keep it
  const ctx = useMemo(
    () => ({
      value: value ?? "",
      onValueChange: (v: string) => onValueChange(v),
      open,
      setOpen,
    }),
    [value, onValueChange, open]
  );

  return (
    <SelectContext.Provider value={ctx}>
      <div className={`relative inline-block text-left ${className}`}>{children}</div>
    </SelectContext.Provider>
  );
}

export default Select;

/* Trigger */
export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ children, className = "", ...props }, ref) => {
    const ctx = useContext(SelectContext);
    if (!ctx) return null;
    const { setOpen, open } = ctx;
    return (
      <button
        type="button"
        ref={ref}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 px-3 py-2 border rounded ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

/* Value (display current selection inside trigger) */
export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  const { value } = ctx;
  return <span>{value === "" || value == null ? placeholder ?? "" : String(value)}</span>;
}

/* Content (dropdown) */
export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => {
  const ctx = useContext(SelectContext);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        ctx?.setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ctx]);
  if (!ctx) return null;
  if (!ctx.open) return null;
  return (
    <div
      ref={ref}
      role="listbox"
      tabIndex={-1}
      className={`absolute z-50 mt-2 w-56 max-h-64 overflow-auto rounded-md border bg-white shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
SelectContent.displayName = "SelectContent";

/* Item */
export const SelectItem: React.FC<{ value: string | number; children?: React.ReactNode; className?: string }> = ({
  value,
  children,
  className = "",
}) => {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  const { onValueChange, setOpen } = ctx;
  return (
    <button
      type="button"
      role="option"
      onClick={() => {
        onValueChange(String(value));
        setOpen(false);
      }}
      className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${className}`}
    >
      {children ?? String(value)}
    </button>
  );
};
SelectItem.displayName = "SelectItem";
