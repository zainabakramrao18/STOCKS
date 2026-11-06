import React, { useState } from 'react';
import { StoreSettings } from '../types/inventory';
import { X, SlidersHorizontal, Store, DollarSign, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSave: (settings: StoreSettings) => Promise<void>;
}

const POPULAR_CURRENCIES = [
  { symbol: '$', label: '$ (USD / CAD / AUD)' },
  { symbol: '€', label: '€ (EUR - Euro)' },
  { symbol: '£', label: '£ (GBP - British Pound)' },
  { symbol: '₹', label: '₹ (INR - Indian Rupee)' },
  { symbol: '¥', label: '¥ (JPY / CNY)' },
  { symbol: '₱', label: '₱ (PHP - Philippine Peso)' },
  { symbol: '₦', label: '₦ (NGN - Nigerian Naira)' },
  { symbol: 'R', label: 'R (ZAR - South African Rand)' },
  { symbol: 'KES', label: 'KES (Kenyan Shilling)' },
  { symbol: 'PKR', label: 'PKR (Pakistani Rupee)' },
  { symbol: 'BDT', label: 'BDT (Bangladeshi Taka)' },
  { symbol: 'AED', label: 'AED (UAE Dirham)' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [currency, setCurrency] = useState(settings.currency);
  const [customCurrency, setCustomCurrency] = useState('');
  const [isCustomCurrency, setIsCustomCurrency] = useState(
    !POPULAR_CURRENCIES.some((c) => c.symbol === settings.currency)
  );
  const [defaultThreshold, setDefaultThreshold] = useState(
    settings.lowStockThresholdDefault || 5
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setErrorMsg('Store name cannot be empty');
      return;
    }

    const finalCurrency = isCustomCurrency
      ? customCurrency.trim() || '$'
      : currency;

    try {
      setIsSaving(true);
      setErrorMsg('');
      await onSave({
        ...settings,
        shopName: shopName.trim(),
        currency: finalCurrency,
        lowStockThresholdDefault: Math.max(1, Number(defaultThreshold) || 5)
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md border border-emerald-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Shop Settings</h3>
              <p className="text-xs text-emerald-100">
                Customize your store name and currency
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Shop Name
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Green Corner Grocery"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Currency Symbol
            </label>
            <select
              value={isCustomCurrency ? 'custom' : currency}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomCurrency(true);
                } else {
                  setIsCustomCurrency(false);
                  setCurrency(e.target.value);
                }
              }}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold text-slate-900 cursor-pointer"
            >
              {POPULAR_CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.label}
                </option>
              ))}
              <option value="custom">Other / Custom Symbol...</option>
            </select>

            {isCustomCurrency && (
              <input
                type="text"
                placeholder="Enter symbol (e.g. CHF, kr, or ₹)"
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value)}
                className="mt-2 w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-emerald-50/50"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Default Low-Stock Threshold
            </label>
            <input
              type="number"
              min="1"
              value={defaultThreshold}
              onChange={(e) => setDefaultThreshold(parseInt(e.target.value, 10) || 5)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              New items will trigger a red low-stock alert when at or below this count.
            </p>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
