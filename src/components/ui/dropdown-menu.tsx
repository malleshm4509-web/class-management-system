import React from "react";

type Item = {
  key?: string | number;
  label: React.ReactNode;
  onClick?: () => void;
};

export function DropdownMenu({ items = [] as Item[], className = "" }: { items?: Item[]; className?: string }) {
  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div>
        <button type="button" className="inline-flex justify-center w-full rounded-md border px-2 py-1 bg-white">⋮</button>
      </div>
      <div className="absolute right-0 mt-2 w-40 origin-top-right bg-white border rounded-md shadow-lg z-10">
        {items.map((it, idx) => (
          <div
            key={it.key ?? idx}
            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
            onClick={it.onClick}
          >
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DropdownMenu;
