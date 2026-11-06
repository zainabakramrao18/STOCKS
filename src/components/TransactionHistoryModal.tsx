import React, { useState, useMemo } from 'react';
import { Transaction } from '../types/inventory';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  X,
  History,
  ShoppingCart,
  Boxes,
  TrendingUp,
  Search,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currency: string;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  currency
}) => {
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'restock'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filtered transactions
  const filteredTxs = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        tx.productName.toLowerCase().includes(q) ||
        (tx.notes ? tx.notes.toLowerCase().includes(q) : false)
      );
    }
    return true;
  });

  // Calculate totals
  const totals = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'sale') {
        acc.salesRevenue += tx.totalAmount;
        acc.salesCount++;
        acc.profit += tx.profit || 0;
      } else {
        acc.restockCost += tx.totalAmount;
        acc.restockCount++;
      }
      return acc;
    },
    { salesRevenue: 0, salesCount: 0, profit: 0, restockCost: 0, restockCount: 0 }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl border border-emerald-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Store Activity Ledger</h3>
              <p className="text-xs text-emerald-200">
                Audit trail of sales and inventory restocks
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

        {/* Totals Summary Banner */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-b border-slate-200 text-center shrink-0">
          <div className="p-3 bg-white rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Total Sales Revenue
            </span>
            <span className="text-lg font-black text-emerald-700">
              {formatCurrency(totals.salesRevenue, currency)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {totals.salesCount} sales recorded
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Estimated Gross Profit
            </span>
            <span className="text-lg font-black text-emerald-800">
              +{formatCurrency(totals.profit, currency)}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
              Net on sales
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Restock Purchases
            </span>
            <span className="text-lg font-black text-slate-700">
              {formatCurrency(totals.restockCost, currency)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {totals.restockCount} shipments
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Events ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                filterType === 'sale'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Sales ({totals.salesCount})</span>
            </button>
            <button
              onClick={() => setFilterType('restock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                filterType === 'restock'
                  ? 'bg-teal-700 text-white'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Restocks ({totals.restockCount})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Ledger List */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
          {filteredTxs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No transactions found.
            </div>
          ) : (
            filteredTxs.map((tx) => {
              const isSale = tx.type === 'sale';

              return (
                <div
                  key={tx.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSale
                      ? 'bg-white border-emerald-100 hover:border-emerald-300'
                      : 'bg-teal-50/30 border-teal-100 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSale
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      {isSale ? (
                        <ShoppingCart className="w-5 h-5" />
                      ) : (
                        <Boxes className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase ${
                            isSale
                              ? 'bg-emerald-600 text-white'
                              : 'bg-teal-700 text-white'
                          }`}
                        >
                          {isSale ? 'Sale' : 'Restock'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {tx.productName}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        {isSale
                          ? `Sold ${tx.quantity} units @ ${formatCurrency(tx.unitPrice, currency)} each`
                          : `Added ${tx.quantity} units @ ${formatCurrency(tx.unitPrice, currency)} unit cost`}
                        {' • '}
                        <span className="text-slate-400">
                          Stock: {tx.previousStock} → {tx.newStock}
                        </span>
                      </p>

                      {tx.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          Note: "{tx.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 self-end sm:self-center">
                    <div className="text-base font-black text-slate-900">
                      {isSale ? '+' : '-'}{formatCurrency(tx.totalAmount, currency)}
                    </div>
                    {isSale && tx.profit !== undefined && (
                      <span className="text-xs font-bold text-emerald-600 block">
                        Profit: +{formatCurrency(tx.profit, currency)}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {formatDateTime(tx.date)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
