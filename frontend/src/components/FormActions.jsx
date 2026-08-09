import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// submitError is a top-of-form message (e.g. a network/server error), separate
// from per-field validation errors which FormField/FormSelect render inline.
export default function FormActions({ onCancel, submitLabel = 'Save', submitting, submitError }) {
  return (
    <div className="pt-2">
      {submitError && (
        <div className="flex items-center gap-2 text-sm text-loss bg-loss/10 border border-loss/30 rounded-lg px-3 py-2 mb-4">
          <AlertCircle size={14} className="shrink-0" />
          {submitError}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-muted hover:text-text transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
