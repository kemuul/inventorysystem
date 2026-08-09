import React from 'react';
import { Plus } from 'lucide-react';

// Used at the top of every list page (Categories, Products, Stocks, Suppliers)
// so the "title + Add button" row looks and behaves identically everywhere.
export default function PageHeader({ title, subtitle, addLabel, onAdd }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-text">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>

      {addLabel && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          {addLabel}
        </button>
      )}
    </div>
  );
}
