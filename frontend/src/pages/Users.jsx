import React, { useEffect, useState } from 'react';
import { UserCircle2 } from 'lucide-react';
import { userApi } from '../api/userApi';
import PageHeader from '../components/PageHeader';
import RowActions from '../components/RowActions';
import TableStatusRow from '../components/TableStatusRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import FormActions from '../components/FormActions';
import ConfirmDialog from '../components/ConfirmDialog';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' }
];

const emptyForm = () => ({ name: '', email: '', role: 'staff', password: '' });

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getAll();
      setUsers(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setForm(emptyForm());
    setFieldErrors({});
    setSubmitError(null);
    setModalMode('add');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, password: '' });
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
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (modalMode === 'add' && !form.password) {
      errors.password = 'Password is required';
    }
    if (form.password && form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
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
        const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role };
        if (form.password) payload.password = form.password;
        await userApi.update(editingUser.id, payload);
      } else {
        await userApi.create({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          password: form.password
        });
      }
      setModalMode(null);
      await loadUsers();
    } catch (err) {
      setSubmitError(err.message || `Failed to ${modalMode === 'edit' ? 'update' : 'create'} user`);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (user) => {
    setDeleteError(null);
    setDeleteTarget(user);
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await userApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const showStatusRow = loading || error || users.length === 0;

  return (
    <div>
      <PageHeader
        title="All Users"
        subtitle={`${users.length} ${users.length === 1 ? 'user' : 'users'} with access`}
        addLabel="Add User"
        onAdd={openAddModal}
      />

      <div className="bg-card border border-border rounded-xl p-5">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-medium pb-3">Name</th>
              <th className="font-medium pb-3">Email</th>
              <th className="font-medium pb-3">Role</th>
              <th className="font-medium pb-3">Joined</th>
              <th className="font-medium pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showStatusRow ? (
              <TableStatusRow
                colSpan={5}
                loading={loading}
                error={error}
                isEmpty={!loading && !error && users.length === 0}
                emptyText="No users found"
                onRetry={loadUsers}
              />
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center shrink-0">
                        <UserCircle2 size={18} className="text-muted" />
                      </div>
                      <p className="text-sm font-medium text-text">{user.name}</p>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-muted">{user.email}</td>
                  <td className="py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        user.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-white/5 text-muted'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-muted">{formatDate(user.created_at)}</td>
                  <td className="py-3">
                    <RowActions
                      onEdit={() => openEditModal(user)}
                      onDelete={() => openDeleteConfirm(user)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalMode !== null} onClose={closeModal} title={modalMode === 'edit' ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Maria Santos"
            required
            error={fieldErrors.name}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="e.g. maria@inventorypro.com"
            required
            error={fieldErrors.email}
          />
          <FormSelect
            label="Role"
            name="role"
            value={form.role}
            onChange={handleChange}
            options={ROLE_OPTIONS}
            placeholder="Select a role"
            required
          />
          <FormField
            label={modalMode === 'edit' ? 'New Password' : 'Password'}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder={modalMode === 'edit' ? 'Leave blank to keep current password' : 'At least 6 characters'}
            required={modalMode === 'add'}
            error={fieldErrors.password}
          />
          <FormActions
            onCancel={closeModal}
            submitLabel={modalMode === 'edit' ? 'Save Changes' : 'Add User'}
            submitting={submitting}
            submitError={submitError}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete User"
        message={deleteTarget ? `Remove "${deleteTarget.name}" (${deleteTarget.email})? They'll immediately lose access.` : ''}
        submitting={deleting}
        error={deleteError}
      />
    </div>
  );
}
