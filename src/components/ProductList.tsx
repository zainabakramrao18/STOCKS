import React, { useState, useMemo } from 'react';
import { Product, StockFilter } from '../types/inventory';
import { formatCurrency, getExpiryStatus } from '../utils/formatters';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  ShoppingCart,
  Boxes,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  Package,
  Calendar,
  Tag
} from 'lucide-react';

interface ProductListProps {
  products: Product[];
  currency: string;
  activeFilter: StockFilter;
  onSelectFilter: (filter: StockFilter) => void;
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onQuickSale: (product: Product) => void;
  onQuickRestock: (product: Product) => void;
  onSeedDemo: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  currency,
  activeFilter,
  onSelectFilter,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickSale,
  onQuickRestock,
  onSeedDemo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity_asc' | 'quantity_desc' | 'value' | 'expiry'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Compute counts for tabs
  const counts = useMemo(() => {
    let lowStock = 0;
    let outOfStock = 0;
    let expiring = 0;
    let expired = 0;
    let healthy = 0;

    products.forEach((p) => {
      const isLow = p.quantity <= p.reorderLevel;
      const isOut = p.quantity === 0;
      const exp = getExpiryStatus(p.expiryDate);

      if (isOut) outOfStock++;
      if (isLow) lowStock++;
      if (exp.isExpiringSoon && !exp.isExpired) expiring++;
      if (exp.isExpired) expired++;
      if (!isLow) healthy++;
    });

    return {
      all: products.length,
      lowStock,
      outOfStock,
      expiringSoon: expiring + expired,
      expired,
      healthy
    };
  }, [products]);

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Tab filters
        if (activeFilter === 'low_stock') {
          if (p.quantity > p.reorderLevel) return false;
        } else if (activeFilter === 'out_of_stock') {
          if (p.quantity > 0) return false;
        } else if (activeFilter === 'expiring_soon') {
          const exp = getExpiryStatus(p.expiryDate);
          if (!exp.isExpiringSoon) return false;
        } else if (activeFilter === 'expired') {
          const exp = getExpiryStatus(p.expiryDate);
          if (!exp.isExpired) return false;
        } else if (activeFilter === 'in_stock') {
          if (p.quantity === 0) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        // Search text
        if (searchTerm.trim() !== '') {
          const query = searchTerm.toLowerCase();
          const matchName = p.name.toLowerCase().includes(query);
          const matchCategory = p.category.toLowerCase().includes(query);
          const matchSku = p.sku ? p.sku.toLowerCase().includes(query) : false;
          const matchNotes = p.notes ? p.notes.toLowerCase().includes(query) : false;
          if (!matchName && !matchCategory && !matchSku && !matchNotes) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'quantity_asc') return a.quantity - b.quantity;
        if (sortBy === 'quantity_desc') return b.quantity - a.quantity;
        if (sortBy === 'value') return (b.quantity * b.sellingPrice) - (a.quantity * a.sellingPrice);
        if (sortBy === 'expiry') {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return a.expiryDate.localeCompare(b.expiryDate);
        }
        return 0;
      });
  }, [products, activeFilter, selectedCategory, searchTerm, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
        
        {/* Navigation Tabs (All, Low Stock in Red, Expiring Soon in Amber) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          
          <button
            onClick={() => onSelectFilter('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Inventory ({counts.all})
          </button>

          {/* LOW STOCK TAB - PROMINENT RED */}
          <button
            onClick={() => onSelectFilter('low_stock')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
              activeFilter === 'low_stock'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                : counts.lowStock > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock ({counts.lowStock})</span>
          </button>

          {/* EXPIRING SOON TAB - PROMINENT AMBER */}
          <button
            onClick={() => onSelectFilter('expiring_soon')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
              activeFilter === 'expiring_soon'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400'
                : counts.expiringSoon > 0
                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Expiring in 30 Days ({counts.expiringSoon})</span>
          </button>

          <button
            onClick={() => onSelectFilter('out_of_stock')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeFilter === 'out_of_stock'
                ? 'bg-rose-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Out of Stock ({counts.outOfStock})
          </button>

          <button
            onClick={() => onSelectFilter('in_stock')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeFilter === 'in_stock'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Healthy Stock ({counts.healthy})
          </button>

        </div>

        {/* Search, Category, Sorting and Layout controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, category, or barcode/SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-full"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="name">Sort: Name (A to Z)</option>
              <option value="quantity_asc">Sort: Lowest Quantity First</option>
              <option value="quantity_desc">Sort: Highest Quantity First</option>
              <option value="value">Sort: Total Value</option>
              <option value="expiry">Sort: Expiry Date (Nearest First)</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="md:col-span-1 flex items-center justify-end space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-2xl border transition-colors ${
                viewMode === 'grid'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-3 rounded-2xl border transition-colors ${
                viewMode === 'table'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
              title="Data Table View"
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>

      {/* Product Content / Empty States */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {products.length === 0
                ? 'Your inventory is currently empty'
                : 'No products match your active filter'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {products.length === 0
                ? 'Start tracking your stock, sales, and expirations by adding your first product or loading sample store items.'
                : 'Try clearing your search term, picking "All Inventory", or choosing a different category.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {products.length === 0 ? (
              <>
                <button
                  onClick={onOpenAddProduct}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
                >
                  <Plus className="w-4 h-4 inline-block mr-1.5" />
                  Add New Product
                </button>
                <button
                  onClick={onSeedDemo}
                  className="px-5 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm border border-emerald-200 transition"
                >
                  <Sparkles className="w-4 h-4 inline-block mr-1.5 text-emerald-600" />
                  Load Sample Shop Items
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  onSelectFilter('all');
                }}
                className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-sm"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.quantity === 0;
            const isLowStock = product.quantity <= product.reorderLevel;
            const expiry = getExpiryStatus(product.expiryDate);
            const totalStockCost = product.quantity * product.costPrice;
            const totalStockRetail = product.quantity * product.sellingPrice;
            const profitPerUnit = product.sellingPrice - product.costPrice;
            const marginPercent = product.sellingPrice > 0 
              ? Math.round((profitPerUnit / product.sellingPrice) * 100) 
              : 0;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                  isOutOfStock
                    ? 'border-rose-400 bg-rose-50/20'
                    : isLowStock
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : expiry.isExpired
                    ? 'border-rose-300'
                    : expiry.isExpiringSoon
                    ? 'border-amber-300'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                
                {/* Product Card Top: Category, SKU, and Expiry Badges */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {product.category}
                    </span>

                    {/* Expiry Badge */}
                    {expiry.hasExpiry && (
                      <span className={`px-2.5 py-1 rounded-lg text-xs border flex items-center space-x-1 ${expiry.badgeClass}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{expiry.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Title and SKU */}
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {product.name}
                  </h4>
                  {product.sku && (
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      Barcode / SKU: <span className="font-mono text-slate-600">{product.sku}</span>
                    </p>
                  )}

                  {/* Stock Quantity Highlight (IN RED IF LOW) */}
                  <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">
                          Current Stock
                        </span>
                        <div className="flex items-baseline space-x-2">
                          <span className={`text-2xl font-black ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}>
                            {product.quantity}
                          </span>
                          <span className="text-xs font-bold text-slate-500">units</span>
                        </div>
                      </div>

                      {/* Low Stock Indicator Tag in RED */}
                      <div>
                        {isOutOfStock ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                            OUT OF STOCK
                          </span>
                        ) : isLowStock ? (
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
                              ⚠️ LOW (≤ {product.reorderLevel})
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            In Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Margins */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-1">
                    <div>
                      <span className="text-slate-400 font-medium">Selling Price:</span>
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(product.sellingPrice, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Cost Price:</span>
                      <p className="text-sm font-bold text-slate-600">
                        {formatCurrency(product.costPrice, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Margin:</span>
                      <p className="text-xs font-bold text-emerald-700">
                        +{formatCurrency(profitPerUnit, currency)} ({marginPercent}%)
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Total Value:</span>
                      <p className="text-xs font-bold text-slate-800">
                        {formatCurrency(totalStockRetail, currency)}
                      </p>
                    </div>
                  </div>

                  {product.notes && (
                    <p className="text-xs text-slate-500 italic mt-2 line-clamp-1">
                      "{product.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Action Controls */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                  
                  {/* Primary Large Buttons: Record Sale & Restock */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onQuickSale(product)}
                      disabled={isOutOfStock}
                      className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-98'
                      }`}
                      title={isOutOfStock ? 'No units to sell' : 'Record sale for this item'}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Sell Unit</span>
                    </button>

                    <button
                      onClick={() => onQuickRestock(product)}
                      className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all active:scale-98"
                      title="Add restocked inventory"
                    >
                      <Boxes className="w-4 h-4 text-emerald-600" />
                      <span>Restock</span>
                    </button>
                  </div>

                  {/* Secondary Edit & Delete */}
                  <div className="flex items-center justify-end space-x-1 pt-1">
                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        
        /* DATA TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Product & Category</th>
                  <th className="py-4 px-4 text-center">Stock Level</th>
                  <th className="py-4 px-4">Selling Price</th>
                  <th className="py-4 px-4">Cost Price</th>
                  <th className="py-4 px-4">Expiry Date</th>
                  <th className="py-4 px-4">Stock Value</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.quantity === 0;
                  const isLowStock = product.quantity <= product.reorderLevel;
                  const expiry = getExpiryStatus(product.expiryDate);
                  const totalStockRetail = product.quantity * product.sellingPrice;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLowStock ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-slate-900">{product.name}</div>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">
                            {product.category}
                          </span>
                          {product.sku && <span>SKU: {product.sku}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          isOutOfStock
                            ? 'bg-rose-600 text-white'
                            : isLowStock
                            ? 'bg-rose-100 text-rose-700 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {product.quantity} units {isLowStock && !isOutOfStock && `(Reorder: ${product.reorderLevel})`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(product.sellingPrice, currency)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {formatCurrency(product.costPrice, currency)}
                      </td>

                      <td className="py-3.5 px-4">
                        {expiry.hasExpiry ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs border ${expiry.badgeClass}`}>
                            {product.expiryDate} ({expiry.label})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No Expiry</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {formatCurrency(totalStockRetail, currency)}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => onQuickSale(product)}
                          disabled={isOutOfStock}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-40"
                        >
                          Sale
                        </button>
                        <button
                          onClick={() => onQuickRestock(product)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
