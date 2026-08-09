import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Shared by every "Add X" flow so modals look and behave identically:
// closes on Escape, closes on backdrop click, consistent header/spacing.
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = size === 'lg' ? 'max-w-lg' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className={`relative w-full ${widthClass} bg-card border border-border rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
          <h3 className="text-base font-semibold text-text">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
