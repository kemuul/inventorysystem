import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

// UI-only for now, same as the page-level "Add" button — wire these up to
// real edit/delete flows once those endpoints are ready on the frontend.
export default function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onEdit}
        aria-label="Edit"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-primary transition-colors"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={onDelete}
        aria-label="Delete"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-loss transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
