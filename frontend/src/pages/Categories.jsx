import React, { useEffect, useState } from 'react';
import { categoryApi } from '../api/categoryApi';
import PageHeader from '../components/PageHeader';
import RowActions from '../components/RowActions';
import TableStatusRow from '../components/TableStatusRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FormActions from '../components/FormActions';

const EMPTY_FORM = { name: '', description: '' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return; // don't let the modal close mid-save
    setModalOpen(false);
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
    try {
      await categoryApi.create({ name: form.name.trim(), description: form.description.trim() || null });
      setModalOpen(false);
      await loadCategories();
    } catch (err) {
      setSubmitError(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const showStatusRow = loading || error || categories.length === 0;

  return (
    <div>
      <PageHeader
        title="All Categories"
        subtitle={`${categories.length} ${categories.length === 1 ? 'category' : 'categories'} total`}
        addLabel="Add Category"
        onAdd={openModal}
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
                      onEdit={() => console.log('Edit category', category.id)}
                      onDelete={() => console.log('Delete category', category.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add Category">
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
          <FormActions onCancel={closeModal} submitLabel="Add Category" submitting={submitting} submitError={submitError} />
        </form>
      </Modal>
    </div>
  );
}
