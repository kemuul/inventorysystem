import React, { useEffect, useState } from 'react';
import { reportsApi } from '../api/reportsApi';
import { peso } from '../utils/format';
import { downloadCSV } from '../utils/csv';
import StatCard from '../components/StatCard';
import TableStatusRow from '../components/TableStatusRow';
import ExportButton from '../components/ExportButton';
import { ShoppingCart, DollarSign, TrendingUp, Package, Boxes, Wallet } from 'lucide-react';

const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const formatDay = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'inventory'

  // Sales report
  const [fromDate, setFromDate] = useState(isoDaysAgo(29));
  const [toDate, setToDate] = useState(isoDaysAgo(0));
  const [salesReport, setSalesReport] = useState(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState(null);

  // Inventory report
  const [inventoryReport, setInventoryReport] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);

  const loadSalesReport = async (from, to) => {
    setSalesLoading(true);
    setSalesError(null);
    try {
      const res = await reportsApi.getSalesReport(from, to);
      setSalesReport(res.data);
    } catch (err) {
      setSalesError(err.message || 'Failed to load sales report');
    } finally {
      setSalesLoading(false);
    }
  };

  const loadInventoryReport = async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const res = await reportsApi.getInventoryReport();
      setInventoryReport(res.data);
    } catch (err) {
      setInventoryError(err.message || 'Failed to load inventory report');
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    loadSalesReport(fromDate, toDate);
    loadInventoryReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyRange = (from, to) => {
    setFromDate(from);
    setToDate(to);
    loadSalesReport(from, to);
  };

  const applyQuickRange = (days) => applyRange(isoDaysAgo(days - 1), isoDaysAgo(0));

  const applyThisMonth = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    applyRange(from, isoDaysAgo(0));
  };

  const handleGenerate = () => loadSalesReport(fromDate, toDate);

  const exportDailyCSV = () => {
    if (!salesReport) return;
    downloadCSV(`sales-by-day_${fromDate}_to_${toDate}.csv`, salesReport.byDay, [
      { key: 'day', label: 'Date' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'profit', label: 'Profit' }
    ]);
  };

  const exportTopProductsCSV = () => {
    if (!salesReport) return;
    downloadCSV(`top-products_${fromDate}_to_${toDate}.csv`, salesReport.topProducts, [
      { key: 'name', label: 'Product' },
      { key: 'units_sold', label: 'Units Sold' },
      { key: 'revenue', label: 'Revenue' }
    ]);
  };

  const exportInventoryCSV = () => {
    if (!inventoryReport) return;
    downloadCSV('inventory-valuation.csv', inventoryReport.items, [
      { key: 'name', label: 'Product' },
      { key: 'category_name', label: 'Category' },
      { key: 'current_stock', label: 'Stock' },
      { key: 'cost_price', label: 'Cost Price' },
      { key: 'selling_price', label: 'Selling Price' },
      { key: 'stock_value_at_cost', label: 'Value at Cost' },
      { key: 'stock_value_at_selling', label: 'Value at Selling' }
    ]);
  };

  const showDailyStatusRow = salesLoading || salesError || (salesReport && salesReport.byDay.length === 0);
  const showTopProductsStatusRow = salesLoading || salesError || (salesReport && salesReport.topProducts.length === 0);
  const showInventoryStatusRow = inventoryLoading || inventoryError || (inventoryReport && inventoryReport.items.length === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Reports</h2>
          <p className="text-sm text-muted mt-0.5">Sales performance and current inventory value</p>
        </div>

        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {[
            { key: 'sales', label: 'Sales Report' },
            { key: 'inventory', label: 'Inventory Report' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key ? 'bg-primary text-white' : 'text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'sales' ? (
        <>
          {/* Date range controls */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={handleGenerate}
                className="bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Generate
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => applyQuickRange(7)} className="text-sm font-medium text-muted hover:text-text px-3 py-2">
                  Last 7 days
                </button>
                <button onClick={() => applyQuickRange(30)} className="text-sm font-medium text-muted hover:text-text px-3 py-2">
                  Last 30 days
                </button>
                <button onClick={applyThisMonth} className="text-sm font-medium text-muted hover:text-text px-3 py-2">
                  This Month
                </button>
              </div>
            </div>
          </div>

          {salesError && (
            <div className="bg-loss/10 border border-loss/30 text-loss text-sm rounded-lg px-4 py-2">{salesError}</div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={ShoppingCart}
              iconBg="#1E3A8A"
              iconColor="#60A5FA"
              label="Orders"
              value={salesLoading ? '—' : salesReport?.summary.orders ?? 0}
              footerText={`${fromDate} to ${toDate}`}
            />
            <StatCard
              icon={DollarSign}
              iconBg="#312E81"
              iconColor="#A78BFA"
              label="Revenue"
              value={salesLoading ? '—' : peso(salesReport?.summary.revenue)}
              footerText="Total sales value"
            />
            <StatCard
              icon={TrendingUp}
              iconBg="#14532D"
              iconColor="#4ADE80"
              label="Profit"
              value={salesLoading ? '—' : peso(salesReport?.summary.profit)}
              valueClassName="text-profit"
              footerText="Revenue minus cost of goods"
            />
            <StatCard
              icon={Package}
              iconBg="#78350F"
              iconColor="#FBBF24"
              label="Units Sold"
              value={salesLoading ? '—' : salesReport?.summary.units_sold ?? 0}
              footerText="Across all products"
            />
          </div>

          {/* Daily breakdown */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text">Daily Breakdown</h3>
              <ExportButton onClick={exportDailyCSV} />
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="font-medium pb-3">Date</th>
                  <th className="font-medium pb-3">Revenue</th>
                  <th className="font-medium pb-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {showDailyStatusRow ? (
                  <TableStatusRow
                    colSpan={3}
                    loading={salesLoading}
                    error={salesError}
                    isEmpty={!salesLoading && !salesError && salesReport?.byDay.length === 0}
                    emptyText="No sales in this date range"
                  />
                ) : (
                  salesReport.byDay.map((row) => (
                    <tr key={row.day} className="border-t border-border">
                      <td className="py-3 text-sm text-text">{formatDay(row.day)}</td>
                      <td className="py-3 text-sm text-text">{peso(row.revenue)}</td>
                      <td className="py-3 text-sm font-medium text-profit text-right">{peso(row.profit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Top products in range */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text">Top Products</h3>
              <ExportButton onClick={exportTopProductsCSV} />
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="font-medium pb-3">Product</th>
                  <th className="font-medium pb-3">Units Sold</th>
                  <th className="font-medium pb-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {showTopProductsStatusRow ? (
                  <TableStatusRow
                    colSpan={3}
                    loading={salesLoading}
                    error={salesError}
                    isEmpty={!salesLoading && !salesError && salesReport?.topProducts.length === 0}
                    emptyText="No sales in this date range"
                  />
                ) : (
                  salesReport.topProducts.map((product) => (
                    <tr key={product.id} className="border-t border-border">
                      <td className="py-3 text-sm font-medium text-text">{product.name}</td>
                      <td className="py-3 text-sm text-text">{product.units_sold}</td>
                      <td className="py-3 text-sm text-text text-right">{peso(product.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {inventoryError && (
            <div className="bg-loss/10 border border-loss/30 text-loss text-sm rounded-lg px-4 py-2">{inventoryError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={Wallet}
              iconBg="#78350F"
              iconColor="#FBBF24"
              label="Stock Value (at Cost)"
              value={inventoryLoading ? '—' : peso(inventoryReport?.totals.total_cost_value)}
              footerText="What's currently tied up in inventory"
            />
            <StatCard
              icon={DollarSign}
              iconBg="#312E81"
              iconColor="#A78BFA"
              label="Stock Value (at Selling Price)"
              value={inventoryLoading ? '—' : peso(inventoryReport?.totals.total_selling_value)}
              footerText="Potential revenue if all sold"
            />
            <StatCard
              icon={Boxes}
              iconBg="#1E3A8A"
              iconColor="#60A5FA"
              label="Total Units in Stock"
              value={inventoryLoading ? '—' : inventoryReport?.totals.total_units ?? 0}
              footerText="Across all active products"
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text">Inventory Valuation</h3>
              <ExportButton onClick={exportInventoryCSV} />
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="font-medium pb-3">Product</th>
                  <th className="font-medium pb-3">Category</th>
                  <th className="font-medium pb-3">Stock</th>
                  <th className="font-medium pb-3">Value at Cost</th>
                  <th className="font-medium pb-3 text-right">Value at Selling</th>
                </tr>
              </thead>
              <tbody>
                {showInventoryStatusRow ? (
                  <TableStatusRow
                    colSpan={5}
                    loading={inventoryLoading}
                    error={inventoryError}
                    isEmpty={!inventoryLoading && !inventoryError && inventoryReport?.items.length === 0}
                    emptyText="No active products found"
                    onRetry={loadInventoryReport}
                  />
                ) : (
                  inventoryReport.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="py-3 text-sm font-medium text-text">{item.name}</td>
                      <td className="py-3 text-sm text-muted">{item.category_name || '—'}</td>
                      <td className="py-3 text-sm text-text">{item.current_stock}</td>
                      <td className="py-3 text-sm text-text">{peso(item.stock_value_at_cost)}</td>
                      <td className="py-3 text-sm text-text text-right">{peso(item.stock_value_at_selling)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
