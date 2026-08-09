import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Receipt, Wallet, Plus } from 'lucide-react';
import { profitLossApi } from '../api/profitLossApi';
import { peso } from '../utils/format';
import StatCard from '../components/StatCard';
import ProfitLossChart from '../components/ProfitLossChart';
import TableStatusRow from '../components/TableStatusRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FormActions from '../components/FormActions';

const todayISO = () => new Date().toISOString().slice(0, 10);
const emptyExpenseForm = () => ({ category: '', description: '', amount: '', expense_date: todayISO() });

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function ProfitLoss() {
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [range, setRange] = useState('week');
  const [trend, setTrend] = useState([]);

  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState(null);

  const [losses, setLosses] = useState([]);
  const [lossesLoading, setLossesLoading] = useState(true);
  const [lossesError, setLossesError] = useState(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyExpenseForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadSummary = async (p) => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await profitLossApi.getSummary(p);
      setSummary(res.data);
    } catch (err) {
      setSummaryError(err.message || 'Failed to load summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadTrend = async (r) => {
    try {
      const res = await profitLossApi.getTrend(r);
      if (res.data) setTrend(res.data);
    } catch {
      /* keep whatever is currently shown */
    }
  };

  const loadExpenses = async () => {
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const res = await profitLossApi.getExpenses();
      setExpenses(res.data);
    } catch (err) {
      setExpensesError(err.message || 'Failed to load expenses');
    } finally {
      setExpensesLoading(false);
    }
  };

  const loadLosses = async () => {
    setLossesLoading(true);
    setLossesError(null);
    try {
      const res = await profitLossApi.getLosses();
      setLosses(res.data);
    } catch (err) {
      setLossesError(err.message || 'Failed to load losses');
    } finally {
      setLossesLoading(false);
    }
  };

  useEffect(() => { loadSummary(period); }, [period]);
  useEffect(() => { loadTrend(range); }, [range]);
  useEffect(() => { loadExpenses(); loadLosses(); }, []);

  const openModal = () => {
    setForm(emptyExpenseForm());
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
    if (!form.category.trim()) errors.category = 'Category is required';
    if (form.amount === '' || Number(form.amount) <= 0) errors.amount = 'Enter a valid amount';
    if (!form.expense_date) errors.expense_date = 'Date is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await profitLossApi.addExpense({
        category: form.category.trim(),
        description: form.description.trim() || null,
        amount: Number(form.amount),
        expense_date: form.expense_date
      });
      setModalOpen(false);
      // Adding an expense changes the summary cards too, so refresh both.
      await Promise.all([loadExpenses(), loadSummary(period)]);
    } catch (err) {
      setSubmitError(err.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const netProfit = summary?.netProfit ?? 0;
  const netIsPositive = netProfit >= 0;

  const showExpensesStatusRow = expensesLoading || expensesError || expenses.length === 0;
  const showLossesStatusRow = lossesLoading || lossesError || losses.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Profit &amp; Loss</h2>
          <p className="text-sm text-muted mt-0.5">Revenue, expenses, and losses at a glance</p>
        </div>

        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {['today', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === p ? 'bg-primary text-white' : 'text-muted hover:text-text'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {summaryError && (
        <div className="bg-loss/10 border border-loss/30 text-loss text-sm rounded-lg px-4 py-2">{summaryError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={DollarSign}
          iconBg="#312E81"
          iconColor="#A78BFA"
          label="Revenue"
          value={summaryLoading ? '—' : peso(summary?.revenue)}
          footerText="Total sales value"
        />
        <StatCard
          icon={TrendingUp}
          iconBg="#14532D"
          iconColor="#4ADE80"
          label="Gross Profit"
          value={summaryLoading ? '—' : peso(summary?.grossProfit)}
          valueClassName="text-profit"
          footerText="Revenue minus cost of goods"
        />
        <StatCard
          icon={Receipt}
          iconBg="#78350F"
          iconColor="#FBBF24"
          label="Expenses"
          value={summaryLoading ? '—' : peso(summary?.expenses)}
          valueClassName="text-loss"
          footerText="Operating costs"
        />
        <StatCard
          icon={TrendingDown}
          iconBg="#7F1D1D"
          iconColor="#F87171"
          label="Losses"
          value={summaryLoading ? '—' : peso(summary?.losses)}
          valueClassName="text-loss"
          footerText="Damaged / expired / theft"
        />
        <StatCard
          icon={Wallet}
          iconBg={netIsPositive ? '#14532D' : '#7F1D1D'}
          iconColor={netIsPositive ? '#4ADE80' : '#F87171'}
          label="Net Profit"
          value={summaryLoading ? '—' : peso(netProfit)}
          valueClassName={netIsPositive ? 'text-profit' : 'text-loss'}
          footerText="Gross profit − expenses − losses"
        />
      </div>

      <ProfitLossChart data={trend} range={range} onRangeChange={setRange} />

      {/* Expenses */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-text">Expenses</h3>
            <p className="text-xs text-muted mt-0.5">Operating costs — rent, utilities, wages, etc.</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-medium pb-3">Category</th>
              <th className="font-medium pb-3">Description</th>
              <th className="font-medium pb-3">Amount</th>
              <th className="font-medium pb-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {showExpensesStatusRow ? (
              <TableStatusRow
                colSpan={4}
                loading={expensesLoading}
                error={expensesError}
                isEmpty={!expensesLoading && !expensesError && expenses.length === 0}
                emptyText="No expenses recorded yet"
                onRetry={loadExpenses}
              />
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="border-t border-border">
                  <td className="py-3 text-sm font-medium text-text">{exp.category}</td>
                  <td className="py-3 text-sm text-muted">{exp.description || '—'}</td>
                  <td className="py-3 text-sm font-medium text-loss">{peso(exp.amount)}</td>
                  <td className="py-3 text-sm text-muted text-right">{formatDate(exp.expense_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Losses */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-lg font-bold text-text mb-1">Losses</h3>
        <p className="text-xs text-muted mb-4">
          Damaged, expired, or stolen inventory — logged automatically when stock is adjusted on the Stocks page.
        </p>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-medium pb-3">Product</th>
              <th className="font-medium pb-3">Reason</th>
              <th className="font-medium pb-3">Quantity</th>
              <th className="font-medium pb-3">Cost Impact</th>
              <th className="font-medium pb-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {showLossesStatusRow ? (
              <TableStatusRow
                colSpan={5}
                loading={lossesLoading}
                error={lossesError}
                isEmpty={!lossesLoading && !lossesError && losses.length === 0}
                emptyText="No losses recorded yet"
                onRetry={loadLosses}
              />
            ) : (
              losses.map((loss) => (
                <tr key={loss.id} className="border-t border-border">
                  <td className="py-3 text-sm font-medium text-text">{loss.product_name}</td>
                  <td className="py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-loss/15 text-loss capitalize">
                      {loss.reason}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-text">{loss.quantity}</td>
                  <td className="py-3 text-sm font-medium text-loss">{peso(loss.cost_impact)}</td>
                  <td className="py-3 text-sm text-muted text-right">{formatDate(loss.loss_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add Expense">
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Rent, Utilities, Wages"
            required
            error={fieldErrors.category}
          />
          <FormField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional"
          />
          <FormField
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
            error={fieldErrors.amount}
          />
          <FormField
            label="Date"
            name="expense_date"
            type="date"
            value={form.expense_date}
            onChange={handleChange}
            required
            error={fieldErrors.expense_date}
          />
          <FormActions onCancel={closeModal} submitLabel="Add Expense" submitting={submitting} submitError={submitError} />
        </form>
      </Modal>
    </div>
  );
}
