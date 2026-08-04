import React from 'react';
import { Package } from 'lucide-react';

export default function LowStockAlerts({ items = [] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text">Low Stock Alerts</h2>
        <button className="text-sm font-medium text-primary hover:underline">View All</button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="font-medium pb-3">Product</th>
            <th className="font-medium pb-3">Stock Left</th>
            <th className="font-medium pb-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isOut = item.status === 'Out of Stock';
            return (
              <tr key={item.id} className="border-t border-border">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                      <Package size={16} className="text-muted" />
                    </div>
                    <p className="text-sm font-medium text-text">{item.name}</p>
                  </div>
                </td>
                <td className={`text-sm py-3 font-medium ${isOut ? 'text-loss' : 'text-amber-400'}`}>
                  {item.current_stock}
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      isOut ? 'bg-loss/15 text-loss' : 'bg-amber-400/15 text-amber-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {items.length === 0 && <p className="text-sm text-muted py-4">All products are sufficiently stocked.</p>}
    </div>
  );
}
