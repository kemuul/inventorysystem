import React, { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { supplierApi } from '../api/supplierApi';
import PageHeader from '../components/PageHeader';
import RowActions from '../components/RowActions';
import TableStatusRow from '../components/TableStatusRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FormActions from '../components/FormActions';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_FORM = { name: '', contact_person: '', phone: '', email: '', address: '' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supplierApi.getAll();
      setSuppliers(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setModalMode('add');
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
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
    if (!form.name.trim()) errors.name = 'Supplier name is required';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    const payload = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null
    };

    try {
      if (modalMode === 'edit') {
        await supplierApi.update(editingSupplier.id, payload);
      } else {
        await supplierApi.create(payload);
      }
      setModalMode(null);
      await loadSuppliers();
    } catch (err) {
      setSubmitError(err.message || `Failed to ${modalMode === 'edit' ? 'update' : 'create'} supplier`);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (supplier) => {
    setDeleteError(null);
    setDeleteTarget(supplier);
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await supplierApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadSuppliers();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete supplier');
    } finally {
      setDeleting(false);
    }
  };

  const showStatusRow = loading || error || suppliers.length === 0;

  return (
    <div>
      <PageHeader
        title="All Suppliers"
        subtitle={`${suppliers.length} ${suppliers.length === 1 ? 'supplier' : 'suppliers'} total`}
        addLabel="Add Supplier"
        onAdd={openAddModal}
      />

      <div className="bg-card border border-border rounded-xl p-5">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-medium pb-3">ID</th>
              <th className="font-medium pb-3">Name</th>
              <th className="font-medium pb-3">Contact</th>
              <th className="font-medium pb-3">Email</th>
              <th className="font-medium pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showStatusRow ? (
              <TableStatusRow
                colSpan={5}
                loading={loading}
                error={error}
                isEmpty={!loading && !error && suppliers.length === 0}
                emptyText="No suppliers found"
                onRetry={loadSuppliers}
              />
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-t border-border">
                  <td className="py-3 text-sm text-muted">#{supplier.id}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                        <Truck size={16} className="text-muted" />
                      </div>
                      <p className="text-sm font-medium text-text">{supplier.name}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-text">{supplier.contact_person || '—'}</p>
                    {supplier.phone && <p className="text-xs text-muted">{supplier.phone}</p>}
                  </td>
                  <td className="py-3 text-sm text-muted">{supplier.email || '—'}</td>
                  <td className="py-3">
                    <RowActions
                      onEdit={() => openEditModal(supplier)}
                      onDelete={() => openDeleteConfirm(supplier)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalMode !== null} onClose={closeModal} title={modalMode === 'edit' ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Supplier Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Cebu Trading Co."
            required
            error={fieldErrors.name}
          />
          <FormField
            label="Contact Person"
            name="contact_person"
            value={form.contact_person}
            onChange={handleChange}
            placeholder="e.g. Maria Santos"
          />
          <FormField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="e.g. 0917-000-1111"
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="e.g. sales@supplier.com"
            error={fieldErrors.email}
          />
          <FormField
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Optional"
          />
          <FormActions
            onCancel={closeModal}
            submitLabel={modalMode === 'edit' ? 'Save Changes' : 'Add Supplier'}
            submitting={submitting}
            submitError={submitError}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? Products currently linked to this supplier won't be deleted — they'll just show as unassigned.`
            : ''
        }
        submitting={deleting}
        error={deleteError}
      />
    </div>
  );
}
