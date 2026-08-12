import React from 'react';
import { Package } from 'lucide-react';

// Deterministic accent color per product so the little thumbnail swatch
// isn't just gray for every row.
const SWATCHES = ['#3B82F6', '#22C55E', '#EF4444', '#3B82F6', '#F59E0B'];

export default function TopSellingProducts({ products = [], onViewAll }) {
  const maxSold = Math.max(...products.map((p) => p.sold), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text">Top Selling Products</h2>
        <button onClick={onViewAll} className="text-sm font-medium text-primary hover:underline">
          View All
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="font-medium pb-3">Product</th>
            <th className="font-medium pb-3">Sold</th>
            <th className="font-medium pb-3 text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={p.id} className="border-t border-border">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${SWATCHES[idx % SWATCHES.length]}22` }}
                  >
                    <Package size={16} style={{ color: SWATCHES[idx % SWATCHES.length] }} />
                  </div>
                  <div className="min-w-[110px]">
                    <p className="text-sm font-medium text-text">{p.name}</p>
                    <div className="w-24 h-1.5 bg-background rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(p.sold / maxSold) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </td>
              <td className="text-sm text-text py-3">{p.sold}</td>
              <td className="text-sm text-text py-3 text-right">₱{Number(p.revenue).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && <p className="text-sm text-muted py-4">No sales recorded this week yet.</p>}
    </div>
  );
}
