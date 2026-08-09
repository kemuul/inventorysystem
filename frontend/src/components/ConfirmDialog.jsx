import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

// Shared by every "Delete X" action so confirmation looks and behaves the
// same everywhere: a warning icon, a message explaining the consequence,
// and a red confirm button that shows its own loading/error state.
export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', submitting, error
}) {
  return (
    <Modal isOpen={isOpen} onClose={submitting ? () => {} : onClose} title={title}>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-loss/15 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-loss" />
        </div>
        <p className="text-sm text-muted leading-relaxed">{message}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-loss bg-loss/10 border border-loss/30 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-muted hover:text-text transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="flex items-center gap-2 bg-loss hover:bg-loss/90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
