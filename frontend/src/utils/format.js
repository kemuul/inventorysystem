// utils/format.js
// Shared formatting helpers so every page renders numbers/status the same way.

export const peso = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// Backend sends human-readable status strings ('In Stock' / 'Low Stock' /
// 'Out of Stock'). Map them to a short key so components like StatusBadge
// can stay presentation-only and don't need to know the backend's wording.
export const stockStatusKey = (status) => {
  if (status === 'Out of Stock') return 'out';
  if (status === 'Low Stock') return 'low';
  return 'ok';
};
