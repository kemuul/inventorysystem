import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { supplierApi } from '../api/supplierApi';
import { peso } from '../utils/format';
import PageHeader from '../components/PageHeader';
import RowActions from '../components/RowActions';
import TableStatusRow from '../components/TableStatusRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import FormActions from '../components/FormActions';

const EMPTY_FORM = {
  name: '',
  sku: '',
  category_id: '',
  supplier_id: '',
  cost_price: '',
  selling_price: '',
  initial_stock: '',
  reorder_level: ''
};

// Color the stock number the same way the dashboard does, so a glance at
// this column tells you the same story as the Low Stock Alerts widget.
function stockTextClass(product) {
  if (product.current_stock === 0) return 'text-loss';
  if (product.current_stock <= product.reorder_level) return 'text-amber-400';
  return 'text-text';
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Options for the Category/Supplier selects in the Add Product form.
  // Fetched independently of the main product list — if these fail to load
  // the page itself still works, the dropdowns just come up empty.
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);

  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productApi.getAll();
      setProducts(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadFormOptions = async () => {
    try {
      const res = await categoryApi.getAll();
      setCategoryOptions(res.data.map((c) => ({ value: c.id, label: c.name })));
    } catch {
      setCategoryOptions([]);
    }
    try {
      const res = await supplierApi.getAll();
      setSupplierOptions(res.data.map((s) => ({ value: s.id, label: s.name })));
    } catch {
      setSupplierOptions([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadFormOptions();
  }, []);

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
    if (!form.name.trim()) errors.name = 'Product name is required';
    if (!form.sku.trim()) errors.sku = 'SKU is required';
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
      await productApi.create({
        name: form.name.trim(),
        sku: form.sku.trim(),
        category_id: form.category_id ? Number(form.category_id) : null,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        initial_stock: form.initial_stock ? Number(form.initial_stock) : 0,
        reorder_level: form.reorder_level ? Number(form.reorder_level) : 10
      });
      setModalOpen(false);
      await loadProducts();
    } catch (err) {
      setSubmitError(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const showStatusRow = loading || error || products.length === 0;

  return (
    <div>
      <PageHeader
        title="All Products"
        subtitle={`${products.length} ${products.length === 1 ? 'product' : 'products'} total`}
        addLabel="Add Product"
        onAdd={openModal}
      />

      <div className="bg-card border border-border rounded-xl p-5">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-medium pb-3">ID</th>
              <th className="font-medium pb-3">Name</th>
              <th className="font-medium pb-3">Category</th>
              <th className="font-medium pb-3">Price</th>
              <th className="font-medium pb-3">Stock</th>
              <th className="font-medium pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showStatusRow ? (
              <TableStatusRow
                colSpan={6}
                loading={loading}
                error={error}
                isEmpty={!loading && !error && products.length === 0}
                emptyText="No products found"
                onRetry={loadProducts}
              />
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="py-3 text-sm text-muted">#{product.id}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                        <Package size={16} className="text-muted" />
                      </div>
                      <p className="text-sm font-medium text-text">{product.name}</p>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-muted">{product.category_name || '—'}</td>
                  <td className="py-3 text-sm text-text">{peso(product.selling_price)}</td>
                  <td className={`py-3 text-sm font-medium ${stockTextClass(product)}`}>
                    {product.current_stock}
                  </td>
                  <td className="py-3">
                    <RowActions
                      onEdit={() => console.log('Edit product', product.id)}
                      onDelete={() => console.log('Delete product', product.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add Product" size="lg">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField
              label="Product Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Product X"
              required
              error={fieldErrors.name}
            />
            <FormField
              label="SKU"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="e.g. SKU-X001"
              required
              error={fieldErrors.sku}
            />
            <FormSelect
              label="Category"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              options={categoryOptions}
              placeholder="No category"
            />
            <FormSelect
              label="Supplier"
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChange}
              options={supplierOptions}
              placeholder="No supplier"
            />
            <FormField
              label="Cost Price"
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={form.cost_price}
              onChange={handleChange}
              placeholder="0.00"
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
              placeholder="0.00"
              required
              error={fieldErrors.selling_price}
            />
            <FormField
              label="Initial Stock"
              name="initial_stock"
              type="number"
              min="0"
              value={form.initial_stock}
              onChange={handleChange}
              placeholder="0"
            />
            <FormField
              label="Reorder Level"
              name="reorder_level"
              type="number"
              min="0"
              value={form.reorder_level}
              onChange={handleChange}
              placeholder="10"
            />
          </div>
          <FormActions onCancel={closeModal} submitLabel="Add Product" submitting={submitting} submitError={submitError} />
        </form>
      </Modal>
    </div>
  );
}
