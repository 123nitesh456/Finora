import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Spinner from './Spinner';
import api, { getErrorMessage } from '../services/api';
import { todayInput, toInputDate } from '../utils/format';

const emptyForm = () => ({ type: 'expense', title: '', amount: '', category: '', date: todayInput(), notes: '' });

// Add (transaction = null) or edit (transaction = object) a transaction.
export default function TransactionModal({ open, onClose, onSaved, transaction, categories }) {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const editing = Boolean(transaction);

  const options = categories.filter((c) => c.type === form.type);

  // Reset the form every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (transaction) {
      setForm({
        type: transaction.type,
        title: transaction.title,
        amount: String(transaction.amount),
        category: transaction.category?._id || '',
        date: toInputDate(transaction.date),
        notes: transaction.notes || '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, transaction]);

  // Pick a sensible default category for the chosen type if none is selected.
  useEffect(() => {
    if (!open) return;
    // Use the latest form state (functional update) so editing keeps its own category.
    setForm((f) => {
      const list = categories.filter((c) => c.type === f.type);
      return list.some((c) => c._id === f.category) ? f : { ...f, category: list[0]?._id || '' };
    });
  }, [open, form.type, categories]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!(Number(form.amount) > 0)) next.amount = 'Enter an amount greater than 0';
    if (!form.category) next.category = 'Choose a category';
    if (!form.date) next.date = 'Pick a date';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (editing) await api.put(`/transactions/${transaction._id}`, payload);
      else await api.post('/transactions', payload);
      toast.success(editing ? 'Transaction updated' : 'Transaction added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={saving ? () => {} : onClose} title={editing ? 'Edit transaction' : 'Add transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Income / Expense toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-soft p-1">
          {['expense', 'income'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type }))}
              className={`rounded-lg py-2 text-sm font-semibold capitalize transition-all ${
                form.type === type
                  ? type === 'income'
                    ? 'bg-accent text-white shadow'
                    : 'bg-danger text-white shadow'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div>
          <label className="label" htmlFor="tx-title">Title</label>
          <input id="tx-title" className="input" placeholder="e.g. Groceries" value={form.title} onChange={set('title')} maxLength={100} />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tx-amount">Amount</label>
            <input id="tx-amount" type="number" inputMode="decimal" min="0" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={set('amount')} />
            {errors.amount && <p className="field-error">{errors.amount}</p>}
          </div>
          <div>
            <label className="label" htmlFor="tx-date">Date</label>
            <input id="tx-date" type="date" className="input" value={form.date} onChange={set('date')} />
            {errors.date && <p className="field-error">{errors.date}</p>}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="tx-category">Category</label>
          <select id="tx-category" className="input" value={form.category} onChange={set('category')}>
            {options.length === 0 && <option value="">No {form.type} categories — add one first</option>}
            {options.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          {errors.category && <p className="field-error">{errors.category}</p>}
        </div>

        <div>
          <label className="label" htmlFor="tx-notes">Notes <span className="font-normal text-muted">(optional)</span></label>
          <textarea id="tx-notes" rows={3} className="input resize-none" placeholder="Anything worth remembering…" value={form.notes} onChange={set('notes')} maxLength={500} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <Spinner size={16} />} {editing ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
