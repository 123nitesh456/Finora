import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Spinner from './Spinner';
import api, { getErrorMessage } from '../services/api';
import { ICON_NAMES, getIcon } from '../utils/icons';

// Create (category = null) or edit (category = object) a category.
// defaultType decides whether a NEW category is an expense or income category.
export default function CategoryModal({ open, onClose, onSaved, category, defaultType = 'expense' }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [type, setType] = useState(defaultType);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(category);

  useEffect(() => {
    if (!open) return;
    setError('');
    setName(category?.name || '');
    setIcon(category?.icon || 'Tag');
    setType(category?.type || defaultType);
  }, [open, category, defaultType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) await api.put(`/categories/${category._id}`, { name: name.trim(), icon });
      else await api.post('/categories', { name: name.trim(), icon, type });
      toast.success(editing ? 'Category updated' : 'Category created');
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={saving ? () => {} : onClose} title={editing ? 'Edit category' : 'New category'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!editing && (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-soft p-1">
            {['expense', 'income'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-lg py-2 text-sm font-semibold capitalize transition-all ${
                  type === t ? 'bg-primary text-white shadow' : 'text-muted hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div>
          <label className="label" htmlFor="cat-name">Name</label>
          <input id="cat-name" className="input" placeholder="e.g. Gym" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoFocus />
          {error && <p className="field-error">{error}</p>}
        </div>

        <div>
          <p className="label">Icon</p>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {ICON_NAMES.map((iconName) => {
              const Icon = getIcon(iconName);
              const selected = icon === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  onClick={() => setIcon(iconName)}
                  className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                    selected ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted hover:bg-soft hover:text-ink'
                  }`}
                  aria-pressed={selected}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <Spinner size={16} />} {editing ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
