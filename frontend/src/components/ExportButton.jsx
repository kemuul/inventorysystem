import React from 'react';
import { Download } from 'lucide-react';

export default function ExportButton({ onClick, label = 'Export CSV' }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-medium text-muted hover:text-text border border-border rounded-lg px-3 py-1.5 transition-colors"
    >
      <Download size={14} />
      {label}
    </button>
  );
}
