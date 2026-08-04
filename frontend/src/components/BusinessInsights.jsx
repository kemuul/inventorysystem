import React from 'react';
import { TrendingUp, PackageSearch, LineChart, TrendingDown } from 'lucide-react';

const ICONS = {
  best_seller: { icon: TrendingUp, bg: '#14532D', color: '#22C55E' },
  low_stock: { icon: PackageSearch, bg: '#78350F', color: '#F59E0B' },
  profit_up: { icon: LineChart, bg: '#1E3A8A', color: '#3B82F6' },
  profit_down: { icon: LineChart, bg: '#1E3A8A', color: '#3B82F6' },
  low_sales: { icon: TrendingDown, bg: '#7F1D1D', color: '#EF4444' }
};

export default function BusinessInsights({ insights = [] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      <h2 className="text-lg font-bold text-text mb-4">Business Insights</h2>

      <div className="divide-y divide-border">
        {insights.map((item, idx) => {
          const cfg = ICONS[item.type] || ICONS.profit_up;
          const Icon = cfg.icon;
          return (
            <div key={idx} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: cfg.bg }}
              >
                <Icon size={16} style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text leading-snug">{item.title}</p>
                <p className="text-xs text-muted mt-0.5 leading-snug">{item.detail}</p>
              </div>
            </div>
          );
        })}

        {insights.length === 0 && (
          <p className="text-sm text-muted py-4">No insights yet — insights appear once you record some sales.</p>
        )}
      </div>
    </div>
  );
}
