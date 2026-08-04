import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ChevronDown } from 'lucide-react';

const COLORS = {
  revenue: '#3B82F6',
  profit: '#22C55E',
  expenses: '#EF4444'
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-xs text-muted mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: ₱{Number(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

const dayLabel = (isoDate) =>
  new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

export default function ProfitLossChart({ data = [], range, onRangeChange }) {
  const [open, setOpen] = useState(false);

  const chartData = data.map((d) => ({
    day: dayLabel(d.day),
    Revenue: d.revenue,
    Profit: d.profit,
    Expenses: d.expenses
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-text">Profit &amp; Loss Overview</h2>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 text-sm bg-background border border-border rounded-lg px-3 py-1.5 text-text hover:bg-white/5"
          >
            {range === 'month' ? 'This Month' : 'This Week'}
            <ChevronDown size={14} className="text-muted" />
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-32 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-10">
              {['week', 'month'].map((r) => (
                <button
                  key={r}
                  onClick={() => { onRangeChange(r); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-text hover:bg-white/5"
                >
                  {r === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        {Object.entries({ Revenue: COLORS.revenue, Profit: COLORS.profit, Expenses: COLORS.expenses }).map(
          ([name, color]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-muted">{name}</span>
            </div>
          )
        )}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.revenue} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.revenue} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.profit} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.profit} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.expenses} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.expenses} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₱${v / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area type="monotone" dataKey="Revenue" stroke={COLORS.revenue} fill="url(#gradRevenue)" strokeWidth={2} />
          <Area type="monotone" dataKey="Profit" stroke={COLORS.profit} fill="url(#gradProfit)" strokeWidth={2} />
          <Area type="monotone" dataKey="Expenses" stroke={COLORS.expenses} fill="url(#gradExpenses)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
