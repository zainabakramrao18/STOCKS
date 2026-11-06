import React, { useState, useEffect } from 'react';
import { Product } from '../types/inventory';
import { formatCurrency } from '../utils/formatters';
import { 
  X, 
  Package, 
  Plus, 
  Minus, 
  Calendar, 
  Tag, 
  AlertTriangle, 
  DollarSign, 
  Sparkles,
  Info
} from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'userId'>) => Promise<void>;
  initialProduct?: Product | null;
  currency: string;
}

const COMMON_CATEGORIES = [
  'Groceries',
  'Dairy & Eggs',
  'Beverages',
  'Bakery',
  'Snacks & Candy',
  'Produce & Fruits',
  'Frozen Foods',
  'Household & Cleaning',
  'Personal Care',
  'Medicine & Health',
  'Tobacco & Accessories',
  'General Merchandise'
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  currency
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [costPrice, setCostPrice] = useState<number>(1.00);
  const [sellingPrice, setSellingPrice] = useState<number>(1.99);
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prefill when editing
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      if (COMMON_CATEGORIES.includes(initialProduct.category)) {
        setCategory(initialProduct.category);
        setIsCustomCategory(false);
      } else {
        setCategory('Other');
        setCustomCategory(initialProduct.category);
        setIsCustomCategory(true);
      }
      setSku(initialProduct.sku || '');
      setQuantity(initialProduct.quantity);
      setCostPrice(initialProduct.costPrice);
      setSellingPrice(initialProduct.sellingPrice);
      setReorderLevel(initialProduct.reorderLevel);
      setExpiryDate(initialProduct.expiryDate || '');
      setNotes(initialProduct.notes || '');
    } else {
      // Defaults for new product
      setName('');
      setCategory('Groceries');
      setCustomCategory('');
      setIsCustomCategory(false);
      setSku('');
      setQuantity(12);
      setCostPrice(2.00);
      setSellingPrice(3.50);
      setReorderLevel(5);
      setExpiryDate('');
      setNotes('');
    }
    setErrorMsg('');
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  // Real-time profit calculations
  const profitPerUnit = Math.max(0, sellingPrice - costPrice);
  const marginPercent = sellingPrice > 0 ? Math.round((profitPerUnit / sellingPrice) * 100) : 0;

  // Expiry preset helper
  const addMonthsToToday = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setExpiryDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a product name');
      return;
    }

    const finalCategory = isCustomCategory ? (customCategory.trim() || 'General') : category;

    try {
      setIsSaving(true);
      setErrorMsg('');
      await onSave({
        name: name.trim(),
        category: finalCategory,
        sku: sku.trim() || undefined,
        quantity: Math.max(0, Number(quantity) || 0),
        costPrice: Math.max(0, Number(costPrice) || 0),
        sellingPrice: Math.max(0, Number(sellingPrice) || 0),
        reorderLevel: Math.max(0, Number(reorderLevel) || 0),
        expiryDate: expiryDate ? expiryDate : undefined,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-emerald-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">
                {initialProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-emerald-100">
                Track stock count, prices, and expiry dates
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Details */}
          <div className="space-y-4">
            
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Organic Whole Milk 1L, Coca-Cola Can 330ml..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={isCustomCategory ? 'Other' : category}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 text-sm cursor-pointer"
                >
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Other">+ Custom Category...</option>
                </select>

                {isCustomCategory && (
                  <input
                    type="text"
                    placeholder="Enter custom category name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="mt-2 w-full px-3 py-2 text-sm rounded-xl border border-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-emerald-50/40"
                  />
                )}
              </div>

              {/* SKU / Barcode */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Barcode / SKU <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 890123456789 or BEV-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-sm text-slate-800"
                />
              </div>
            </div>

          </div>

          {/* Section 2: Stock & Reorder Alert */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Stock Quantity & Alerts
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Quantity with Large Touch Steppers */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Units on Hand <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                    className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-black active:scale-95 transition"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-center py-2.5 rounded-xl border border-slate-200 bg-white font-black text-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-black active:scale-95 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Reorder Level (Threshold for Low Stock in Red) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reorder Level <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white font-bold text-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="shrink-0 text-xs text-slate-500 font-medium max-w-[120px] leading-tight">
                    Flagged in <strong className="text-rose-600">Red</strong> when ≤ this
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Cost & Selling Prices with Live Margin */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Pricing & Profit Margin
              </h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Profit: +{formatCurrency(profitPerUnit, currency)} ({marginPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cost Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cost Price (You pay) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-base text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selling Price (Customer pays) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-base text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Expiry Date Tracker (Required 30-day feature) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-800">
                Batch Expiry Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              {expiryDate && (
                <button
                  type="button"
                  onClick={() => setExpiryDate('')}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Clear Expiry
                </button>
              )}
            </div>

            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 text-sm"
            />

            {/* Quick Expiry Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-400 mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => addMonthsToToday(1)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                +1 Month
              </button>
              <button
                type="button"
                onClick={() => addMonthsToToday(3)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                +3 Months
              </button>
              <button
                type="button"
                onClick={() => addMonthsToToday(6)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                +6 Months
              </button>
              <button
                type="button"
                onClick={() => addMonthsToToday(12)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                +1 Year
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes <span className="text-slate-400 font-normal">(Supplier, shelf location, etc.)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Supplier: Fresh Farms Inc. | Shelf: Aisle 3 Rack 2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-800"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 font-bold text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-base shadow-lg shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving Product...' : initialProduct ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
