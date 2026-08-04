import React from 'react';

// iconBg / iconColor let each card use its own accent (blue / purple / green / amber)
// while the card itself always uses the shared `card` background.
export default function StatCard({ icon: Icon, iconBg, iconColor, label, value, changePct, footerText, footerLink }) {
  const isPositive = changePct !== undefined && changePct >= 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <p className="text-sm text-muted">{label}</p>
      </div>

      <p className="text-2xl font-bold text-text mb-1">{value}</p>

      {changePct !== undefined ? (
        <p className={`text-xs font-medium ${isPositive ? 'text-profit' : 'text-loss'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(changePct)}% from yesterday
        </p>
      ) : footerLink ? (
        <button className="text-xs font-medium text-primary hover:underline">{footerText}</button>
      ) : (
        <p className="text-xs text-muted">{footerText}</p>
      )}
    </div>
  );
}
