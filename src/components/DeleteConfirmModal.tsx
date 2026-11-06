import React from 'react';
import { Product } from '../types/inventory';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !product) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-sm border border-rose-100 shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Trash2 className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900">Delete Product?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Are you sure you want to remove <strong className="text-slate-800 font-bold">"{product.name}"</strong>? This will permanently delete its stock record. Past sales transactions will be preserved in your activity log.
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
