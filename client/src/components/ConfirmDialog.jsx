import Modal from './Modal';
import Spinner from './Spinner';

export default function ConfirmDialog({ open, title, message, confirmText = 'Delete', loading, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading && <Spinner size={16} />} {confirmText}
        </button>
      </div>
    </Modal>
  );
}
