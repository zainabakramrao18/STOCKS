import React, { useState, useEffect } from 'react';
import { Product } from '../types/inventory';
import { formatCurrency } from '../utils/formatters';
import {
  X,
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  ArrowRight,
  Truck
} from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProduct: Product | null;
  currency: string;
  onConfirmRestock: (
    product: Product,
    quantity: number,
    costPrice: number,
    notes?: string
  ) => Promise<void>;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct: initialSelectedProduct,
  currency,
  onConfirmRestock
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(12);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialSelectedProduct) {
      setSelectedId(initialSelectedProduct.id);
      setCostPrice(initialSelectedProduct.costPrice);
      // If item is low stock, default restock qty to at least 12 or 2x reorder level
      setQuantity(Math.max(6, initialSelectedProduct.reorderLevel * 2));
    } else if (products.length > 0) {
      // Find low stock item first if available
      const lowItem = products.find((p) => p.quantity <= p.reorderLevel) || products[0];
      setSelectedId(lowItem.id);
      setCostPrice(lowItem.costPrice);
      setQuantity(12);
    }
    setNotes('');
    setErrorMsg('');
  }, [initialSelectedProduct, products, isOpen]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedId);

  const handleProductChange = (id: string) => {
    setSelectedId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setCostPrice(prod.costPrice);
    }
    setErrorMsg('');
  };

  const newStock = currentProduct ? currentProduct.quantity + quantity : quantity;
  const totalCost = (Number(quantity) || 0) * (Number(costPrice) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) {
      setErrorMsg('Please select a product to restock');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity added must be at least 1 unit');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onConfirmRestock(currentProduct, quantity, costPrice, notes.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record restock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-emerald-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Restock Inventory</h3>
              <p className="text-xs text-emerald-100">
                Add incoming goods and update stock count
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Picker */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              Select Product to Restock
            </label>
            <select
              value={selectedId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 text-base cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.quantity} units {p.quantity <= p.reorderLevel ? '⚠️ LOW' : ''})
                </option>
              ))}
            </select>
          </div>

          {currentProduct && (
            <>
              {/* Restock Projection Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800">
                      Current Stock
                    </span>
                    <div className="text-xl font-black text-slate-700">
                      {currentProduct.quantity} units
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-emerald-600 mx-2" />

                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-800">
                      New Stock Level
                    </span>
                    <div className="text-xl font-black text-emerald-800">
                      {newStock} units
                    </div>
                  </div>
                </div>
              </div>

              {/* Units to Add Stepper */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Units Added From Supplier
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-black active:scale-95 transition"
                  >
                    <Minus className="w-6 h-6" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-full text-center py-3 rounded-2xl border-2 border-emerald-500 bg-white font-black text-2xl text-slate-900 focus:outline-hidden"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-black active:scale-95 transition"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                {/* Quick Presets for Bulk Cases */}
                <div className="flex items-center gap-2 pt-1">
                  {[6, 12, 24, 48, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                        quantity === num
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supplier Cost Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Purchase Cost Per Unit (Wholesale)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) =>
                      setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-base text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Total restock cost: <strong className="text-slate-700">{formatCurrency(totalCost, currency)}</strong>
                </p>
              </div>

              {/* Optional Supplier / Invoice Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier / Delivery Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #2049 from Metro Cash & Carry"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-900 hover:to-teal-800 text-white font-extrabold text-base shadow-lg shadow-teal-700/25 active:scale-98 transition-all disabled:opacity-40"
            >
              {isSubmitting
                ? 'Updating Stock...'
                : `Confirm Restock (+${quantity} units)`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
