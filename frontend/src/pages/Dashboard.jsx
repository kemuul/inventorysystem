import React, { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, TrendingUp, PackageX } from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import StatCard from '../components/StatCard';
import ProfitLossChart from '../components/ProfitLossChart';
import BusinessInsights from '../components/BusinessInsights';
import TopSellingProducts from '../components/TopSellingProducts';
import LowStockAlerts from '../components/LowStockAlerts';

// Demo data — shown instantly on first paint and used as a fallback if the
// API isn't reachable yet, so the UI is never a blank / broken screen.
const DEMO = {
  summary: {
    totalSalesToday: 15890, totalSalesChangePct: 12.5,
    totalRevenueToday: 24560, totalRevenueChangePct: 8.2,
    totalProfitToday: 8670, totalProfitChangePct: 15.3,
    lowStockItems: 8
  },
  trend: [
    { day: '2026-08-03', revenue: 14200, profit: 6100, expenses: 4200 },
    { day: '2026-08-04', revenue: 14800, profit: 6400, expenses: 4400 }
  ],
  topSelling: [
    { id: 1, name: 'Product X', sold: 120, revenue: 6240 },
    { id: 2, name: 'Product Y', sold: 98, revenue: 4900 },
    { id: 3, name: 'Product A', sold: 75, revenue: 3750 },
    { id: 4, name: 'Product B', sold: 60, revenue: 3000 },
    { id: 5, name: 'Product C', sold: 45, revenue: 2250 }
  ],
  lowStock: [
    { id: 6, name: 'Product D', current_stock: 3, status: 'Low Stock' },
    { id: 7, name: 'Product E', current_stock: 5, status: 'Low Stock' },
    { id: 8, name: 'Product F', current_stock: 0, status: 'Out of Stock' },
    { id: 9, name: 'Product G', current_stock: 2, status: 'Low Stock' }
  ],
  insights: [
    { type: 'best_seller', title: 'Product X is your best seller this week.', detail: 'Sold 120 items, generating ₱6,240.00.' },
    { type: 'low_stock', title: '8 products are running low in stock.', detail: 'Please restock to avoid missing sales.' },
    { type: 'profit_up', title: 'Profit has increased by 15.3%.', detail: 'Great job! Your business is growing.' },
    { type: 'low_sales', title: 'Product Z has low sales.', detail: 'Consider a promotion or price adjustment.' }
  ]
};

const peso = (n) => `₱${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [summary, setSummary] = useState(DEMO.summary);
  const [trend, setTrend] = useState(DEMO.trend);
  const [topSelling, setTopSelling] = useState(DEMO.topSelling);
  const [lowStock, setLowStock] = useState(DEMO.lowStock);
  const [insights, setInsights] = useState(DEMO.insights);
  const [range, setRange] = useState('week');
  const [usingDemoData, setUsingDemoData] = useState(false);

  const loadTrend = async (r) => {
    try {
      const res = await dashboardApi.getProfitLossTrend(r);
      if (res.data?.length) setTrend(res.data);
    } catch {
      /* keep whatever is currently shown */
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [s, t, top, low, ins] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getProfitLossTrend(range),
          dashboardApi.getTopSelling(5),
          dashboardApi.getLowStockAlerts(),
          dashboardApi.getInsights()
        ]);
        if (cancelled) return;
        setSummary(s.data);
        if (t.data?.length) setTrend(t.data);
        if (top.data?.length) setTopSelling(top.data);
        setLowStock(low.data);
        if (ins.data?.length) setInsights(ins.data);
      } catch {
        // Backend not running yet — keep the demo data so the UI still looks complete.
        if (!cancelled) setUsingDemoData(true);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = (r) => {
    setRange(r);
    loadTrend(r);
  };

  return (
    <div className="space-y-6">
      {usingDemoData && (
        <div className="bg-primary/10 border border-primary/30 text-primary text-sm rounded-lg px-4 py-2">
          Showing sample data — connect the backend API to see live numbers.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          iconBg="#1E3A8A"
          iconColor="#60A5FA"
          label="Total Sales (Today)"
          value={peso(summary.totalSalesToday)}
          changePct={summary.totalSalesChangePct}
        />
        <StatCard
          icon={DollarSign}
          iconBg="#312E81"
          iconColor="#A78BFA"
          label="Total Revenue (Today)"
          value={peso(summary.totalRevenueToday)}
          changePct={summary.totalRevenueChangePct}
        />
        <StatCard
          icon={TrendingUp}
          iconBg="#14532D"
          iconColor="#4ADE80"
          label="Total Profit (Today)"
          value={peso(summary.totalProfitToday)}
          changePct={summary.totalProfitChangePct}
        />
        <StatCard
          icon={PackageX}
          iconBg="#78350F"
          iconColor="#FBBF24"
          label="Low Stock Items"
          value={summary.lowStockItems}
          footerText="View items"
          footerLink
        />
      </div>

      {/* Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProfitLossChart data={trend} range={range} onRangeChange={handleRangeChange} />
        </div>
        <BusinessInsights insights={insights} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellingProducts products={topSelling} />
        <LowStockAlerts items={lowStock} />
      </div>
    </div>
  );
}
