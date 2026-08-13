import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { productApi } from '../api/productApi';
import { salesApi } from '../api/salesApi';
import { peso } from '../utils/format';
import Modal from './Modal';
import FormField from './FormField';
import FormSelect from './FormSelect';
import FormActions from './FormActions';

const emptyItem = () => ({ product_id: '', quantity: '' });

// onSuccess is called after the sale is recorded so the caller (Dashboard)
// can refresh its numbers — this modal doesn't know or care what depends on it.
export default function RecordSaleModal({ isOpen, onClose, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);

  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [itemErrors, setItemErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Reset and load the product list fresh every time the modal opens, so
  // stock levels shown here are never stale.
  useEffect(() => {
    if (!isOpen) return;
    setCustomerName('');
    setItems([emptyItem()]);
    setItemErrors({});
    setSubmitError(null);
    setProductsLoading(true);
    setProductsError(null);
    productApi
      .getAll()
      .then((res) => setProducts(res.data))
      .catch((err) => setProductsError(err.message || 'Failed to load products'))
      .finally(() => setProductsLoading(false));
  }, [isOpen]);

  const productOptions = products
    .filter((p) => p.current_stock > 0)
    .map((p) => ({ value: p.id, label: `${p.name} — ${p.current_stock} in stock` }));

  const productById = (id) => products.find((p) => String(p.id) === String(id));

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    const key = `${index}-${field}`;
    if (itemErrors[key]) setItemErrors((prev) => ({ ...prev, [key]: null }));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const validate = () => {
    const errors = {};
    items.forEach((item, i) => {
      if (!item.product_id) {
        errors[`${i}-product_id`] = 'Select a product';
        return;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        errors[`${i}-quantity`] = 'Enter a quantity greater than 0';
        return;
      }
      const product = productById(item.product_id);
      if (product && Number(item.quantity) > product.current_stock) {
        errors[`${i}-quantity`] = `Only ${product.current_stock} in stock`;
      }
    });
    setItemErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const grandTotal = items.reduce((sum, item) => {
    const product = productById(item.product_id);
    if (!product || !item.quantity) return sum;
    return sum + product.selling_price * Number(item.quantity);
  }, 0);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await salesApi.create({
        customer_name: customerName.trim() || undefined,
        items: items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity)
        }))
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Sale" size="lg">
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Customer Name"
          name="customer_name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Optional — defaults to Walk-in Customer"
        />

        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text">Items Sold</label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus size={12} />
              Add another product
            </button>
          </div>

          {productsLoading && <p className="text-sm text-muted py-2">Loading products...</p>}
          {!productsLoading && productsError && <p className="text-sm text-loss py-2">{productsError}</p>}
          {!productsLoading && !productsError && productOptions.length === 0 && (
            <p className="text-sm text-muted py-2">No products currently in stock.</p>
          )}

          {!productsLoading &&
            !productsError &&
            productOptions.length > 0 &&
            items.map((item, index) => (
              <div key={index} className="flex items-start gap-2 mb-3">
                <div className="flex-1">
                  <FormSelect
                    label={index === 0 ? 'Product' : ''}
                    name={`product_${index}`}
                    value={item.product_id}
                    onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                    options={productOptions}
                    placeholder="Select a product"
                    error={itemErrors[`${index}-product_id`]}
                  />
                </div>
                <div className="w-28">
                  <FormField
                    label={index === 0 ? 'Qty' : ''}
                    name={`quantity_${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    placeholder="0"
                    error={itemErrors[`${index}-quantity`]}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="mt-7 w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-loss transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 mb-2">
          <span className="text-sm text-muted">Estimated Total</span>
          <span className="text-lg font-bold text-text">{peso(grandTotal)}</span>
        </div>

        <FormActions onCancel={handleClose} submitLabel="Record Sale" submitting={submitting} submitError={submitError} />
      </form>
    </Modal>
  );
}
