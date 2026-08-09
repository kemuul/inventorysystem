import React, { useEffect, useState } from 'react';
import { Pencil, History as HistoryIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { pricingApi } from '../api/pricingApi';
import { peso } from '../utils/format';
import PageHeader from '../components/PageHeader';
import TableStatusRow from '../components/TableStatusRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FormActions from '../components/FormActions';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const TREND_META = {
  increased: { icon: TrendingUp, className: 'text-profit', label: 'Price increased' },
  decreased: { icon: TrendingDown, className: 'text-loss', label: 'Price decreased' },
  no_change: { icon: Minus, className: 'text-muted', label: 'No change yet' }
};

export default function Pricing() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit price modal
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ cost_price: '', selling_price: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Price history modal
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const loadPricing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pricingApi.getAll();
      setPricing(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricing();
  }, []);

  const openEditModal = (product) => {
    setEditTarget(product);
    setForm({ cost_price: String(product.cost_price), selling_price: String(product.selling_price) });
    setFieldErrors({});
    setSubmitError(null);
  };

  const closeEditModal = () => {
    if (submitting) return;
    setEditTarget(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errors = {};
    if (form.cost_price === '' || Number(form.cost_price) < 0) errors.cost_price = 'Enter a valid cost price';
    if (form.selling_price === '' || Number(form.selling_price) < 0) errors.selling_price = 'Enter a valid selling price';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await pricingApi.updatePrice(editTarget.id, {
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price)
      });
      setEditTarget(null);
      await loadPricing();
    } catch (err) {
      setSubmitError(err.message || 'Failed to update price');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryModal = async (product) => {
    setHistoryTarget(product);
    setHistoryData(null);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const res = await pricingApi.getHistory(product.id);
      setHistoryData(res.data);
    } catch (err) {
      setHistoryError(err.message || 'Failed to load price history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => setHistoryTarget(null);

  const showStatusRow = loading || error || pricing.length === 0;
  const trendMeta = historyData ? TREND_META[historyData.trend] || TREND_META.no_change : null;

  return (
    <div>
      <PageHeader
        title="Pricing"
        subtitle={`${pricing.length} ${pricing.length === 1 ? 'product' : 'products'} priced`}
      />

      <div className="bg-card border border-border rounded-xl p-5">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-medium pb-3">Product</th>
              <th className="font-medium pb-3">Cost Price</th>
              <th className="font-medium pb-3">Selling Price</th>
              <th className="font-medium pb-3">Profit / Unit</th>
              <th className="font-medium pb-3">Margin</th>
              <th className="font-medium pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showStatusRow ? (
              <TableStatusRow
                colSpan={6}
                loading={loading}
                error={error}
                isEmpty={!loading && !error && pricing.length === 0}
                emptyText="No priced products found"
                onRetry={loadPricing}
              />
            ) : (
              pricing.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="py-3 text-sm font-medium text-text">{product.name}</td>
                  <td className="py-3 text-sm text-muted">{peso(product.cost_price)}</td>
                  <td className="py-3 text-sm text-text">{peso(product.selling_price)}</td>
                  <td className={`py-3 text-sm font-medium ${product.profit_per_unit >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {peso(product.profit_per_unit)}
                  </td>
                  <td className="py-3 text-sm text-text">
                    {product.margin_percent === null ? '—' : `${product.margin_percent}%`}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        aria-label="Edit price"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-primary transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => openHistoryModal(product)}
                        aria-label="View price history"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-text transition-colors"
                      >
                        <HistoryIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit price modal */}
      <Modal isOpen={editTarget !== null} onClose={closeEditModal} title={editTarget ? `Edit Price — ${editTarget.name}` : 'Edit Price'}>
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Cost Price"
            name="cost_price"
            type="number"
            step="0.01"
            min="0"
            value={form.cost_price}
            onChange={handleChange}
            required
            error={fieldErrors.cost_price}
          />
          <FormField
            label="Selling Price"
            name="selling_price"
            type="number"
            step="0.01"
            min="0"
            value={form.selling_price}
            onChange={handleChange}
            required
            error={fieldErrors.selling_price}
          />
          <p className="text-xs text-muted -mt-2 mb-4">
            This is logged to price history automatically, so the trend shown in "View History" stays accurate.
          </p>
          <FormActions onCancel={closeEditModal} submitLabel="Save Price" submitting={submitting} submitError={submitError} />
        </form>
      </Modal>

      {/* Price history modal */}
      <Modal isOpen={historyTarget !== null} onClose={closeHistoryModal} title={historyTarget ? `Price History — ${historyTarget.name}` : 'Price History'}>
        {historyLoading && <p className="text-sm text-muted py-6 text-center">Loading history...</p>}

        {!historyLoading && historyError && (
          <p className="text-sm text-loss py-6 text-center">{historyError}</p>
        )}

        {!historyLoading && !historyError && historyData && (
          <>
            {trendMeta && (
              <div className={`flex items-center gap-2 text-sm font-medium mb-4 ${trendMeta.className}`}>
                <trendMeta.icon size={16} />
                {trendMeta.label}
              </div>
            )}

            {historyData.history.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No price changes recorded yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="font-medium pb-2">Cost Price</th>
                    <th className="font-medium pb-2">Selling Price</th>
                    <th className="font-medium pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[...historyData.history].reverse().map((entry, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="py-2 text-sm text-muted">{peso(entry.cost_price)}</td>
                      <td className="py-2 text-sm text-text">{peso(entry.selling_price)}</td>
                      <td className="py-2 text-sm text-muted text-right">{formatDate(entry.changed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
