import React from 'react';

const VARIANTS = {
  ok: { className: 'bg-profit/15 text-profit', label: 'In Stock' },
  low: { className: 'bg-amber-400/15 text-amber-400', label: 'Low Stock' },
  out: { className: 'bg-loss/15 text-loss', label: 'Out of Stock' }
};

// status is the short key ('ok' | 'low' | 'out') — see utils/format.js:stockStatusKey
export default function StatusBadge({ status }) {
  const variant = VARIANTS[status] || VARIANTS.ok;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${variant.className}`}>
      {variant.label}
    </span>
  );
}
