import React, { useState, useEffect } from 'react';
import { Product } from '../types/inventory';
import { formatCurrency } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Search
} from 'lucide-react';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProduct: Product | null;
  currency: string;
  onConfirmSale: (
    product: Product,
    quantity: number,
    sellingPrice: number,
    notes?: string
  ) => Promise<void>;
}

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct: initialSelectedProduct,
  currency,
  onConfirmSale
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Set selected product on open or change
  useEffect(() => {
    if (initialSelectedProduct) {
      setSelectedId(initialSelectedProduct.id);
      setUnitPrice(initialSelectedProduct.sellingPrice);
      setQuantity(1);
    } else if (products.length > 0) {
      const inStockItem = products.find((p) => p.quantity > 0) || products[0];
      setSelectedId(inStockItem.id);
      setUnitPrice(inStockItem.sellingPrice);
      setQuantity(1);
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
      setUnitPrice(prod.sellingPrice);
      setQuantity(1);
    }
    setErrorMsg('');
  };

  const totalAmount = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const costPrice = currentProduct ? currentProduct.costPrice : 0;
  const estimatedProfit = Math.max(0, (unitPrice - costPrice) * quantity);
  const remainingStock = currentProduct ? currentProduct.quantity - quantity : 0;
  const isOutOfStock = currentProduct ? currentProduct.quantity <= 0 : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) {
      setErrorMsg('Please select a product');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity sold must be at least 1');
      return;
    }
    if (quantity > currentProduct.quantity) {
      setErrorMsg(
        `Cannot sell ${quantity} units. Only ${currentProduct.quantity} units currently in stock.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onConfirmSale(currentProduct, quantity, unitPrice, notes.trim());

      // Trigger happy celebration burst
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#059669', '#34d399', '#fbbf24']
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-emerald-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Record Customer Sale</h3>
              <p className="text-xs text-emerald-100">
                Instantly deducts stock and records revenue
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
              Select Product Sold
            </label>
            <select
              value={selectedId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 text-base cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                  {p.name} — {p.quantity > 0 ? `${p.quantity} in stock` : 'OUT OF STOCK'} ({formatCurrency(p.sellingPrice, currency)})
                </option>
              ))}
            </select>
          </div>

          {currentProduct && (
            <>
              {/* Product Quick Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">
                    Current Inventory
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-xl font-black ${
                      currentProduct.quantity <= currentProduct.reorderLevel
                        ? 'text-rose-600'
                        : 'text-emerald-700'
                    }`}>
                      {currentProduct.quantity}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">units left</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">
                    Category
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {currentProduct.category}
                  </span>
                </div>
              </div>

              {/* Quantity Stepper & Presets */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Quantity Sold
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
                    max={currentProduct.quantity}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-full text-center py-3 rounded-2xl border-2 border-emerald-500 bg-white font-black text-2xl text-slate-900 focus:outline-hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(currentProduct.quantity, q + 1))
                    }
                    disabled={quantity >= currentProduct.quantity}
                    className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-black active:scale-95 transition disabled:opacity-40"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                {/* Quick Number Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={num > currentProduct.quantity}
                      onClick={() => setQuantity(num)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                        quantity === num
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Per Unit (Editable if Shopkeeper gives deal) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Sale Price Per Unit
                  </label>
                  {unitPrice !== currentProduct.sellingPrice && (
                    <button
                      type="button"
                      onClick={() => setUnitPrice(currentProduct.sellingPrice)}
                      className="text-xs text-emerald-600 font-bold hover:underline"
                    >
                      Reset to {formatCurrency(currentProduct.sellingPrice, currency)}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) =>
                      setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-base text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Live Calculation Summary Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-900">
                    Total Amount Due:
                  </span>
                  <span className="text-2xl font-black text-emerald-800">
                    {formatCurrency(totalAmount, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-emerald-700 pt-1 border-t border-emerald-200/60">
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Estimated Gross Profit:</span>
                  </span>
                  <span className="font-bold">
                    +{formatCurrency(estimatedProfit, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-emerald-200/60">
                  <span>Remaining Stock After Sale:</span>
                  <span className={`font-bold ${
                    remainingStock <= currentProduct.reorderLevel
                      ? 'text-rose-600'
                      : 'text-slate-700'
                  }`}>
                    {remainingStock} units
                  </span>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Sale Note (Customer, Payment Method, etc.)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in Cash / Customer regular discount"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isOutOfStock}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 active:scale-98 transition-all disabled:opacity-40"
            >
              {isSubmitting
                ? 'Processing Sale...'
                : `Complete Sale • ${formatCurrency(totalAmount, currency)}`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
