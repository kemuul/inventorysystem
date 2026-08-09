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
import ConfirmDialog from '../components/ConfirmDialog';

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

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);

  // One modal handles both Add and Edit. Edit intentionally hides SKU and
  // Initial Stock — the backend's PUT /products/:id doesn't accept them
  // (SKU shouldn't change after creation; stock changes go through the
  // Stocks page's restock/adjust flow instead).
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

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

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setModalMode('add');
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id ? String(product.category_id) : '',
      supplier_id: product.supplier_id ? String(product.supplier_id) : '',
      cost_price: String(product.cost_price),
      selling_price: String(product.selling_price),
      initial_stock: '',
      reorder_level: String(product.reorder_level)
    });
    setFieldErrors({});
    setSubmitError(null);
    setModalMode('edit');
  };

  const closeModal = () => {
    if (submitting) return;
    setModalMode(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Product name is required';
    if (modalMode === 'add' && !form.sku.trim()) errors.sku = 'SKU is required';
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
      if (modalMode === 'edit') {
        await productApi.update(editingProduct.id, {
          name: form.name.trim(),
          category_id: form.category_id ? Number(form.category_id) : null,
          supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
          cost_price: Number(form.cost_price),
          selling_price: Number(form.selling_price),
          reorder_level: form.reorder_level ? Number(form.reorder_level) : 10
        });
      } else {
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
      }
      setModalMode(null);
      await loadProducts();
    } catch (err) {
      setSubmitError(err.message || `Failed to ${modalMode === 'edit' ? 'update' : 'create'} product`);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (product) => {
    setDeleteError(null);
    setDeleteTarget(product);
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await productApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadProducts();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const showStatusRow = loading || error || products.length === 0;

  return (
    <div>
      <PageHeader
        title="All Products"
        subtitle={`${products.length} ${products.length === 1 ? 'product' : 'products'} total`}
        addLabel="Add Product"
        onAdd={openAddModal}
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
                      onEdit={() => openEditModal(product)}
                      onDelete={() => openDeleteConfirm(product)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalMode !== null} onClose={closeModal} title={modalMode === 'edit' ? 'Edit Product' : 'Add Product'} size="lg">
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
            {modalMode === 'add' && (
              <FormField
                label="SKU"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. SKU-X001"
                required
                error={fieldErrors.sku}
              />
            )}
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
            {modalMode === 'add' && (
              <FormField
                label="Initial Stock"
                name="initial_stock"
                type="number"
                min="0"
                value={form.initial_stock}
                onChange={handleChange}
                placeholder="0"
              />
            )}
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
          {modalMode === 'edit' && (
            <p className="text-xs text-muted -mt-2 mb-4">
              Stock quantity isn't edited here — use the Stocks page to restock or adjust it.
            </p>
          )}
          <FormActions
            onCancel={closeModal}
            submitLabel={modalMode === 'edit' ? 'Save Changes' : 'Add Product'}
            submitting={submitting}
            submitError={submitError}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.name}" from active inventory? Past sales and reports that reference it are kept — it just won't show up in product lists or the Stocks page anymore.`
            : ''
        }
        submitting={deleting}
        error={deleteError}
      />
    </div>
  );
}
