import React from 'react';
import { InventoryStats, StockFilter } from '../types/inventory';
import { formatCurrency } from '../utils/formatters';
import { 
  BadgeAlert, 
  ClockAlert, 
  CircleDollarSign, 
  PackagePlus, 
  ShoppingCart, 
  ArrowUpRight,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Boxes
} from 'lucide-react';

interface DashboardStatsProps {
  stats: InventoryStats;
  currency: string;
  activeFilter: StockFilter;
  onSelectFilter: (filter: StockFilter) => void;
  onOpenAddProduct: () => void;
  onOpenSaleModal: () => void;
  onOpenRestockModal: () => void;
  onOpenCsvModal: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  currency,
  activeFilter,
  onSelectFilter,
  onOpenAddProduct,
  onOpenSaleModal,
  onOpenRestockModal,
  onOpenCsvModal
}) => {
  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert if items are expired or critically low */}
      {(stats.lowStockCount > 0 || stats.expiringCount > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border-l-4 border-rose-500 rounded-2xl p-4 sm:p-5 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Inventory Alerts Require Attention
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {stats.lowStockCount > 0 && (
                    <span className="font-semibold text-rose-700 mr-2">
                      • {stats.lowStockCount} {stats.lowStockCount === 1 ? 'item is' : 'items are'} low or out of stock
                    </span>
                  )}
                  {stats.expiringCount > 0 && (
                    <span className="font-semibold text-amber-700">
                      • {stats.expiringCount} {stats.expiringCount === 1 ? 'item expires' : 'items expire'} within 30 days
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              {stats.lowStockCount > 0 && (
                <button
                  onClick={() => onSelectFilter('low_stock')}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition shadow-xs"
                >
                  View Low Stock
                </button>
              )}
              {stats.expiringCount > 0 && (
                <button
                  onClick={() => onSelectFilter('expiring_soon')}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs"
                >
                  View Expiring
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Stock Value Card */}
        <div 
          onClick={() => onSelectFilter('all')}
          className="cursor-pointer group relative bg-white rounded-3xl p-6 border border-emerald-100/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Stock Value
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats.totalRetailValue, currency)}
            </div>
            <div className="flex items-center text-xs text-slate-500 font-medium space-x-1.5">
              <span>Wholesale Cost:</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(stats.totalCostValue, currency)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{stats.totalItems} distinct items</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {stats.totalUnits.toLocaleString()} units
            </span>
          </div>
        </div>

        {/* Low-Stock Alert Card (REQUIRED IN RED) */}
        <div 
          onClick={() => onSelectFilter('low_stock')}
          className={`cursor-pointer group relative rounded-3xl p-6 border transition-all ${
            stats.lowStockCount > 0
              ? 'bg-rose-50/80 border-rose-300 shadow-sm hover:shadow-md hover:border-rose-400 ring-2 ring-rose-200/50'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              stats.lowStockCount > 0 ? 'text-rose-700' : 'text-slate-400'
            }`}>
              Low Stock Alert
            </span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              stats.lowStockCount > 0 ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              <BadgeAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              stats.lowStockCount > 0 ? 'text-rose-700' : 'text-slate-700'
            }`}>
              {stats.lowStockCount} {stats.lowStockCount === 1 ? 'Item' : 'Items'}
            </div>
            <p className="text-xs text-slate-500">
              {stats.lowStockCount > 0 
                ? 'Quantity ≤ reorder threshold' 
                : 'All items comfortably stocked'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center justify-between text-xs">
            <span className={stats.lowStockCount > 0 ? 'font-bold text-rose-700' : 'text-slate-400'}>
              {stats.lowStockCount > 0 ? 'Click to inspect & reorder' : 'Healthy inventory'}
            </span>
            <ArrowUpRight className={`w-4 h-4 ${stats.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-300'}`} />
          </div>
        </div>

        {/* Expiring Within 30 Days Card */}
        <div 
          onClick={() => onSelectFilter('expiring_soon')}
          className={`cursor-pointer group relative rounded-3xl p-6 border transition-all ${
            stats.expiringCount > 0
              ? 'bg-amber-50/80 border-amber-300 shadow-sm hover:shadow-md hover:border-amber-400 ring-2 ring-amber-200/50'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              stats.expiringCount > 0 ? 'text-amber-800' : 'text-slate-400'
            }`}>
              Expiring in 30 Days
            </span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              stats.expiringCount > 0 ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              <ClockAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              stats.expiringCount > 0 ? 'text-amber-800' : 'text-slate-700'
            }`}>
              {stats.expiringCount} {stats.expiringCount === 1 ? 'Item' : 'Items'}
            </div>
            <p className="text-xs text-slate-500">
              {stats.expiredCount > 0 ? (
                <span className="font-semibold text-rose-600">Includes {stats.expiredCount} expired!</span>
              ) : (
                'Review before spoilage occurs'
              )}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs">
            <span className={stats.expiringCount > 0 ? 'font-bold text-amber-800' : 'text-slate-400'}>
              {stats.expiringCount > 0 ? 'Click to inspect batches' : 'No near-term expirations'}
            </span>
            <ArrowUpRight className={`w-4 h-4 ${stats.expiringCount > 0 ? 'text-amber-600' : 'text-slate-300'}`} />
          </div>
        </div>

        {/* Sales & Gross Profit Summary Card */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sales Recorded
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
              {formatCurrency(stats.totalSalesToday, currency)}
            </div>
            <div className="flex items-center text-xs text-slate-500 font-medium space-x-1.5">
              <span>Gross Profit:</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(stats.totalProfitToday, currency)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Audit Ledger</span>
            <span className="font-semibold text-emerald-600">Synced to Cloud</span>
          </div>
        </div>

      </div>

      {/* Prominent Large Quick Actions (White & Green Theme, Large Buttons) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto text-left">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Shopkeeper Quick Operations</span>
            </h3>
            <p className="text-xs text-slate-500">Fast 1-tap buttons for counter operations</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full sm:w-auto">
            
            {/* Record Sale - Primary Large Green Button */}
            <button
              onClick={onOpenSaleModal}
              className="flex items-center justify-center space-x-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Record Sale</span>
            </button>

            {/* Record Restock Button */}
            <button
              onClick={onOpenRestockModal}
              className="flex items-center justify-center space-x-2.5 px-5 py-3.5 rounded-2xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold text-sm sm:text-base active:scale-98 transition-all"
            >
              <Boxes className="w-5 h-5 text-emerald-600" />
              <span>Restock Item</span>
            </button>

            {/* Add Product Button */}
            <button
              onClick={onOpenAddProduct}
              className="flex items-center justify-center space-x-2.5 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-xs active:scale-98 transition-all"
            >
              <PackagePlus className="w-5 h-5 text-emerald-400" />
              <span>Add Product</span>
            </button>

            {/* CSV Import/Export Button */}
            <button
              onClick={onOpenCsvModal}
              className="flex items-center justify-center space-x-2.5 px-5 py-3.5 rounded-2xl bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 border-2 border-emerald-200 font-bold text-sm sm:text-base active:scale-98 transition-all"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>CSV Sheet</span>
            </button>

          </div>
        </div>
      </div>

    </div>
  );
};
