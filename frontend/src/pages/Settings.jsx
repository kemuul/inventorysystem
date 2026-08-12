import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { settingsApi } from '../api/settingsApi';
import FormField from '../components/FormField';

const mapToForm = (data) => ({
  store_name: data.store_name || '',
  contact_email: data.contact_email || '',
  phone: data.phone || '',
  address: data.address || '',
  currency_symbol: data.currency_symbol || '₱',
  default_reorder_level: String(data.default_reorder_level ?? 10),
  low_stock_alerts_enabled: !!data.low_stock_alerts_enabled
});

export default function Settings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await settingsApi.get();
      setForm(mapToForm(res.data));
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: null }));
    setSaveSuccess(false);
  };

  const toggleAlerts = () => {
    setForm((prev) => ({ ...prev, low_stock_alerts_enabled: !prev.low_stock_alerts_enabled }));
    setSaveSuccess(false);
  };

  const validate = () => {
    const errors = {};
    if (!form.store_name.trim()) errors.store_name = 'Store name is required';
    if (form.default_reorder_level !== '' && Number(form.default_reorder_level) < 0) {
      errors.default_reorder_level = 'Enter a valid number';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await settingsApi.update({
        store_name: form.store_name.trim(),
        contact_email: form.contact_email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        currency_symbol: form.currency_symbol.trim() || '₱',
        default_reorder_level: form.default_reorder_level === '' ? 10 : Number(form.default_reorder_level),
        low_stock_alerts_enabled: form.low_stock_alerts_enabled
      });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text">Settings</h2>
        <p className="text-sm text-muted mt-0.5">Store profile and system preferences</p>
      </div>

      {loading && (
        <div className="bg-card border border-border rounded-xl p-10 flex items-center justify-center gap-2 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading settings...
        </div>
      )}

      {!loading && error && (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <AlertCircle size={20} className="text-loss mx-auto mb-2" />
          <p className="text-sm text-loss mb-3">{error}</p>
          <button onClick={loadSettings} className="text-sm font-medium text-primary hover:underline">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && form && (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold text-text mb-1">Business Profile</h3>
            <p className="text-xs text-muted mb-4">Shown on receipts and reports</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField
                label="Store Name"
                name="store_name"
                value={form.store_name}
                onChange={handleChange}
                placeholder="e.g. InventoryPro Store"
                required
                error={fieldErrors.store_name}
              />
              <FormField
                label="Contact Email"
                name="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleChange}
                placeholder="e.g. hello@mystore.com"
              />
              <FormField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 0917-000-1111"
              />
              <FormField
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold text-text mb-1">Preferences</h3>
            <p className="text-xs text-muted mb-4">Defaults used across the app</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField
                label="Currency Symbol"
                name="currency_symbol"
                value={form.currency_symbol}
                onChange={handleChange}
                placeholder="₱"
              />
              <FormField
                label="Default Reorder Level"
                name="default_reorder_level"
                type="number"
                min="0"
                value={form.default_reorder_level}
                onChange={handleChange}
                placeholder="10"
                error={fieldErrors.default_reorder_level}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer mt-2">
              <span className="relative inline-block">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.low_stock_alerts_enabled}
                  onChange={toggleAlerts}
                />
                <span className="block w-10 h-6 bg-background border border-border rounded-full peer-checked:bg-primary transition-colors" />
                <span className="absolute left-1 top-1 w-4 h-4 bg-muted peer-checked:bg-white peer-checked:translate-x-4 rounded-full transition-transform" />
              </span>
              <span className="text-sm text-text">Enable low stock alerts</span>
            </label>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 text-sm text-loss bg-loss/10 border border-loss/30 rounded-lg px-4 py-2">
              <AlertCircle size={14} className="shrink-0" />
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 text-sm text-profit bg-profit/10 border border-profit/30 rounded-lg px-4 py-2">
              <CheckCircle2 size={14} className="shrink-0" />
              Settings saved.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
