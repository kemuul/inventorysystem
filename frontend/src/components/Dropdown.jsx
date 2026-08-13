import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// A small generic dropdown (button + menu) with outside-click handling.
// options: [{ value, label }]
export default function Dropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm bg-card border border-border rounded-lg px-3 py-2 text-text hover:bg-white/5 transition-colors"
      >
        {current?.label}
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-10">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                opt.value === value ? 'text-primary font-medium' : 'text-text hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
