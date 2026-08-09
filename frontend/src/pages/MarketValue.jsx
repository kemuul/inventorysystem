import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, RefreshCw } from 'lucide-react';
import { marketValueApi } from '../api/marketValueApi';
import { productApi } from '../api/productApi';
import { peso } from '../utils/format';
import PageHeader from '../components/PageHeader';
import TableStatusRow from '../components/TableStatusRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import FormActions from '../components/FormActions';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const emptyForm = () => ({ product_id: '', market_price: '', source: '' });

function gapClass(gap) {
  if (gap > 0) return 'text-amber-400';
  if (gap < 0) return 'text-primary';
  return 'text-muted';
}

export default function MarketValue() {
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Every active product, used to populate the product dropdown — the
  // comparison list only includes products that already have a market
  // price on file, but you should be able to record one for any product.
  const [productOptions, setProductOptions] = useState([]);

  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const loadComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await marketValueApi.getComparison();
      setComparison(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load market value data');
    } finally {
      setLoading(false);
    }
  };

  const loadProductOptions = async () => {
    try {
      const res = await productApi.getAll();
      setProductOptions(res.data.map((p) => ({ value: p.id, label: p.name })));
    } catch {
      setProductOptions([]);
    }
  };

  useEffect(() => {
    loadComparison();
    loadProductOptions();
  }, []);

  // Used both by the top "Record Market Price" button (no product preset)
  // and by each row's "Update" action (product preset from that row).
  const openModal = (product) => {
    setForm(
      product
        ? { product_id: String(product.id), market_price: String(product.market_price ?? ''), source: '' }
        : emptyForm()
    );
    setFieldErrors({});
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errors = {};
    if (!form.product_id) errors.product_id = 'Select a product';
    if (form.market_price === '' || Number(form.market_price) < 0) errors.market_price = 'Enter a valid market price';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await marketValueApi.recordPrice(form.product_id, {
        market_price: Number(form.market_price),
        source: form.source.trim() || 'Manual entry'
      });
      setModalOpen(false);
      await loadComparison();
    } catch (err) {
      setSubmitError(err.message || 'Failed to record market price');
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
      const res = await marketValueApi.getTrend(product.id);
      setHistoryData(res.data);
    } catch (err) {
      setHistoryError(err.message || 'Failed to load market price history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => setHistoryTarget(null);

  const showStatusRow = loading || error || comparison.length === 0;

  return (
    <div>
      <PageHeader
        title="Market Value Comparison"
        subtitle={`${comparison.length} ${comparison.length === 1 ? 'product' : 'products'} with market data`}
        addLabel="Record Market Price"
        onAdd={() => openModal(null)}
      />

      <div className="bg-card border border-border rounded-xl p-5">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-medium pb-3">Product</th>
              <th className="font-medium pb-3">Selling Price</th>
              <th className="font-medium pb-3">Market Price</th>
              <th className="font-medium pb-3">Gap</th>
              <th className="font-medium pb-3">Suggestion</th>
              <th className="font-medium pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showStatusRow ? (
              <TableStatusRow
                colSpan={6}
                loading={loading}
                error={error}
                isEmpty={!loading && !error && comparison.length === 0}
                emptyText="No market price data yet — record one to get started"
                onRetry={loadComparison}
              />
            ) : (
              comparison.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="py-3 text-sm font-medium text-text">{product.name}</td>
                  <td className="py-3 text-sm text-text">{peso(product.selling_price)}</td>
                  <td className="py-3 text-sm text-muted">{peso(product.market_price)}</td>
                  <td className={`py-3 text-sm font-medium ${gapClass(product.price_gap)}`}>
                    {product.price_gap > 0 ? '+' : ''}
                    {peso(product.price_gap)}
                    {product.gap_percent !== null && (
                      <span className="text-xs ml-1">
                        ({product.gap_percent > 0 ? '+' : ''}
                        {product.gap_percent}%)
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-sm text-muted max-w-[220px]">{product.suggestion}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openModal(product)}
                        aria-label="Update market price"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-primary transition-colors"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => openHistoryModal(product)}
                        aria-label="View market price history"
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Record Market Price">
        <form onSubmit={handleSubmit} noValidate>
          <FormSelect
            label="Product"
            name="product_id"
            value={form.product_id}
            onChange={handleChange}
            options={productOptions}
            placeholder="Select a product"
            required
            error={fieldErrors.product_id}
          />
          <FormField
            label="Market Price"
            name="market_price"
            type="number"
            step="0.01"
            min="0"
            value={form.market_price}
            onChange={handleChange}
            placeholder="0.00"
            required
            error={fieldErrors.market_price}
          />
          <FormField
            label="Source"
            name="source"
            value={form.source}
            onChange={handleChange}
            placeholder="e.g. Shopee, Competitor A (defaults to Manual entry)"
          />
          <FormActions onCancel={closeModal} submitLabel="Save" submitting={submitting} submitError={submitError} />
        </form>
      </Modal>

      <Modal isOpen={historyTarget !== null} onClose={closeHistoryModal} title={historyTarget ? `Market Price History — ${historyTarget.name}` : 'Market Price History'}>
        {historyLoading && <p className="text-sm text-muted py-6 text-center">Loading history...</p>}

        {!historyLoading && historyError && <p className="text-sm text-loss py-6 text-center">{historyError}</p>}

        {!historyLoading && !historyError && historyData && (
          historyData.market.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">No market price snapshots recorded yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="font-medium pb-2">Market Price</th>
                  <th className="font-medium pb-2">Source</th>
                  <th className="font-medium pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...historyData.market].reverse().map((entry, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="py-2 text-sm text-text">{peso(entry.market_price)}</td>
                    <td className="py-2 text-sm text-muted">{entry.source || '—'}</td>
                    <td className="py-2 text-sm text-muted text-right">{formatDate(entry.recorded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </Modal>
    </div>
  );
}
