import React from 'react';

// iconBg / iconColor let each card use its own accent (blue / purple / green / amber)
// while the card itself always uses the shared `card` background.
// valueClassName is optional — defaults to the neutral text color, but lets
// callers (e.g. a Net Profit card that can go negative) color the number itself.
// changeLabel defaults to 'from yesterday' but callers with a period selector
// (e.g. Dashboard's Past Week / Past Month) can override it to match.
export default function StatCard({ icon: Icon, iconBg, iconColor, label, value, changePct, changeLabel = 'from yesterday', footerText, footerLink, onFooterClick, valueClassName = 'text-text' }) {
  const isPositive = changePct !== undefined && changePct >= 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <p className="text-sm text-muted">{label}</p>
      </div>

      <p className={`text-2xl font-bold mb-1 ${valueClassName}`}>{value}</p>

      {changePct !== undefined ? (
        <p className={`text-xs font-medium ${isPositive ? 'text-profit' : 'text-loss'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(changePct)}% {changeLabel}
        </p>
      ) : footerLink ? (
        <button onClick={onFooterClick} className="text-xs font-medium text-primary hover:underline">
          {footerText}
        </button>
      ) : (
        <p className="text-xs text-muted">{footerText}</p>
      )}
    </div>
  );
}
