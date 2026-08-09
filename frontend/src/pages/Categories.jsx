import React, { useEffect, useState } from 'react';
import { categoryApi } from '../api/categoryApi';
import PageHeader from '../components/PageHeader';
import RowActions from '../components/RowActions';
import TableStatusRow from '../components/TableStatusRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FormActions from '../components/FormActions';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_FORM = { name: '', description: '' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // One modal handles both Add and Edit — `modalMode` decides which API
  // call runs on submit and which record (if any) is being edited.
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoryApi.getAll();
      setCategories(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setModalMode('add');
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({ name: category.name, description: category.description || '' });
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
    if (!form.name.trim()) errors.name = 'Category name is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    const payload = { name: form.name.trim(), description: form.description.trim() || null };

    try {
      if (modalMode === 'edit') {
        await categoryApi.update(editingCategory.id, payload);
      } else {
        await categoryApi.create(payload);
      }
      setModalMode(null);
      await loadCategories();
    } catch (err) {
      setSubmitError(err.message || `Failed to ${modalMode === 'edit' ? 'update' : 'create'} category`);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (category) => {
    setDeleteError(null);
    setDeleteTarget(category);
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await categoryApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const showStatusRow = loading || error || categories.length === 0;

  return (
    <div>
      <PageHeader
        title="All Categories"
        subtitle={`${categories.length} ${categories.length === 1 ? 'category' : 'categories'} total`}
        addLabel="Add Category"
        onAdd={openAddModal}
      />

      <div className="bg-card border border-border rounded-xl p-5">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-medium pb-3">ID</th>
              <th className="font-medium pb-3">Name</th>
              <th className="font-medium pb-3">Products</th>
              <th className="font-medium pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showStatusRow ? (
              <TableStatusRow
                colSpan={4}
                loading={loading}
                error={error}
                isEmpty={!loading && !error && categories.length === 0}
                emptyText="No categories found"
                onRetry={loadCategories}
              />
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-t border-border">
                  <td className="py-3 text-sm text-muted">#{category.id}</td>
                  <td className="py-3 text-sm font-medium text-text">{category.name}</td>
                  <td className="py-3 text-sm text-text">{category.product_count}</td>
                  <td className="py-3">
                    <RowActions
                      onEdit={() => openEditModal(category)}
                      onDelete={() => openDeleteConfirm(category)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalMode !== null} onClose={closeModal} title={modalMode === 'edit' ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Category Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Beverages"
            required
            error={fieldErrors.name}
          />
          <FormField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional short description"
          />
          <FormActions
            onCancel={closeModal}
            submitLabel={modalMode === 'edit' ? 'Save Changes' : 'Add Category'}
            submitting={submitting}
            submitError={submitError}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? Products currently in this category won't be deleted — they'll just show as uncategorized.`
            : ''
        }
        submitting={deleting}
        error={deleteError}
      />
    </div>
  );
}
