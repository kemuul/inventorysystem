import React from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';

// Renders inside a <tbody> as a single full-width row. Every list page uses
// this so "loading / error / no data found" look and behave identically
// instead of each page inventing its own version.
//
// Usage:
//   <tbody>
//     {loading || error || items.length === 0 ? (
//       <TableStatusRow colSpan={4} loading={loading} error={error}
//                        isEmpty={items.length === 0} onRetry={reload} />
//     ) : (
//       items.map(...)
//     )}
//   </tbody>
export default function TableStatusRow({ colSpan, loading, error, isEmpty, emptyText = 'No data found', onRetry }) {
  if (loading) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-12 text-center">
          <div className="flex items-center justify-center gap-2 text-muted text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle size={20} className="text-loss" />
            <p className="text-sm text-loss">{error}</p>
            {onRetry && (
              <button onClick={onRetry} className="text-xs font-medium text-primary hover:underline mt-1">
                Try again
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  if (isEmpty) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-12 text-center">
          <div className="flex flex-col items-center gap-2 text-muted">
            <Inbox size={20} />
            <p className="text-sm">{emptyText}</p>
          </div>
        </td>
      </tr>
    );
  }

  return null;
}
