import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { stockApi } from '../api/stockApi';
import { stockStatusKey } from '../utils/format';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import TableStatusRow from '../components/TableStatusRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import FormActions from '../components/FormActions';

const EMPTY_FORM = { product_id: '', quantity: '', note: '' };

export default function Stocks() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await stockApi.getAll();
      setStocks(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load stock levels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
  }, []);

  // "Add Stock" restocks an existing product rather than creating a new
  // record — stock isn't its own entity, it's a quantity on a product.
  const openModal = () => {
    setForm(EMPTY_FORM);
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
    if (!form.quantity || Number(form.quantity) <= 0) errors.quantity = 'Enter a quantity greater than 0';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await stockApi.restock(form.product_id, {
        quantity: Number(form.quantity),
        note: form.note.trim() || null
      });
      setModalOpen(false);
      await loadStocks();
    } catch (err) {
      setSubmitError(err.message || 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  const productOptions = stocks.map((item) => ({ value: item.id, label: `${item.name} (${item.sku})` }));
  const showStatusRow = loading || error || stocks.length === 0;

  return (
    <div>
      <PageHeader
        title="Stock Levels"
        subtitle={`${stocks.length} ${stocks.length === 1 ? 'product' : 'products'} tracked`}
        addLabel="Add Stock"
        onAdd={openModal}
      />

      <div className="bg-card border border-border rounded-xl p-5">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-medium pb-3">Product</th>
              <th className="font-medium pb-3">Quantity</th>
              <th className="font-medium pb-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {showStatusRow ? (
              <TableStatusRow
                colSpan={3}
                loading={loading}
                error={error}
                isEmpty={!loading && !error && stocks.length === 0}
                emptyText="No stock records found"
                onRetry={loadStocks}
              />
            ) : (
              stocks.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                        <Package size={16} className="text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{item.name}</p>
                        <p className="text-xs text-muted">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-text">{item.current_stock}</td>
                  <td className="py-3 text-right">
                    <StatusBadge status={stockStatusKey(item.status)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add Stock">
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
            label="Quantity to Add"
            name="quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={handleChange}
            placeholder="e.g. 50"
            required
            error={fieldErrors.quantity}
          />
          <FormField
            label="Note"
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="Optional — e.g. supplier delivery reference"
          />
          <FormActions onCancel={closeModal} submitLabel="Add Stock" submitting={submitting} submitError={submitError} />
        </form>
      </Modal>
    </div>
  );
}
