import React, { useState, useRef } from 'react';
import { Product } from '../types/inventory';
import { 
  exportProductsToCsv, 
  parseCsvToProducts, 
  getSampleCsvTemplate, 
  downloadCsvFile,
  CsvParseResult 
} from '../utils/csv';
import { formatCurrency } from '../utils/formatters';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  FileCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
  Table,
  HelpCircle
} from 'lucide-react';

interface CsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  userId: string;
  currency: string;
  onImportBatch: (products: Omit<Product, 'id'>[]) => Promise<number>;
}

export const CsvModal: React.FC<CsvModalProps> = ({
  isOpen,
  onClose,
  products,
  userId,
  currency,
  onImportBatch
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFilter, setExportFilter] = useState<'all' | 'low_stock' | 'expiring'>('all');
  
  // Import states
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Export
  const handleExport = () => {
    let itemsToExport = products;
    let fileSuffix = 'all';

    if (exportFilter === 'low_stock') {
      itemsToExport = products.filter((p) => p.quantity <= p.reorderLevel);
      fileSuffix = 'low_stock';
    } else if (exportFilter === 'expiring') {
      const today = new Date();
      itemsToExport = products.filter((p) => {
        if (!p.expiryDate) return false;
        const exp = new Date(p.expiryDate);
        const diffDays = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      });
      fileSuffix = 'expiring_soon';
    }

    const csvData = exportProductsToCsv(itemsToExport);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsvFile(csvData, `StockWise_Inventory_${fileSuffix}_${dateStr}.csv`);
  };

  // Download Sample Template
  const handleDownloadSample = () => {
    const template = getSampleCsvTemplate();
    downloadCsvFile(template, 'StockWise_Sample_Template.csv');
  };

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSuccessCount(null);
    setImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      try {
        const result = parseCsvToProducts(text, userId);
        setParseResult(result);
      } catch (err: any) {
        setImportError('Failed to parse file: ' + err.message);
      }
    };
    reader.onerror = () => {
      setImportError('Could not read file.');
    };
    reader.readAsText(file);
  };

  // Perform Import
  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.validProducts.length === 0) return;

    try {
      setIsImporting(true);
      setImportError('');
      const imported = await onImportBatch(parseResult.validProducts);
      setImportSuccessCount(imported);
      setParseResult(null);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportError(err.message || 'Import failed. Please check your data.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-emerald-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">CSV Import & Export</h3>
              <p className="text-xs text-emerald-100">
                Backup, migrate, or bulk update your shop inventory
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV ({products.length} items)</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import Products from CSV</span>
          </button>
        </div>

        <div className="p-6">
          
          {/* TAB 1: EXPORT CSV */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <h4 className="text-sm font-bold text-emerald-950 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Spreadsheet Compatible</span>
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Exported CSV files can be opened seamlessly in Microsoft Excel, Google Sheets, LibreOffice, or Apple Numbers. Includes prices, stock levels, wholesale and retail value, and batch expiry dates.
                </p>
              </div>

              {/* Filter What to Export */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Items to Include in Export:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFilter('all')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      exportFilter === 'all'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold text-sm text-slate-800">
                      All Items
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {products.length} products
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFilter('low_stock')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      exportFilter === 'low_stock'
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold text-sm text-rose-700">
                      Low Stock Only
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {products.filter((p) => p.quantity <= p.reorderLevel).length} products
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFilter('expiring')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      exportFilter === 'expiring'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold text-sm text-amber-800">
                      Expiring Soon
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Within 30 days
                    </span>
                  </button>
                </div>
              </div>

              {/* Large Export Button */}
              <div className="pt-2">
                <button
                  onClick={handleExport}
                  disabled={products.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  <Download className="w-5 h-5" />
                  <span>Download CSV Spreadsheet</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: IMPORT CSV */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              
              {/* Instructions and Download Template */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    Need the right CSV columns?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Download our ready-to-use template with sample products.
                  </p>
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 transition shadow-2xs self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* Success Notification */}
              {importSuccessCount !== null && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm">Import Completed Successfully!</h5>
                    <p className="text-xs text-emerald-700">
                      Added {importSuccessCount} products directly into your store inventory.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Notification */}
              {importError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm">Import Error</h5>
                    <p className="text-xs text-rose-700">{importError}</p>
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-3xl p-8 text-center transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>

                <h4 className="text-base font-bold text-slate-800">
                  {fileName ? fileName : 'Click to select CSV file'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports comma-separated values (.csv) with header row
                </p>
              </div>

              {/* Parsed Preview Table */}
              {parseResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Import Preview
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {parseResult.validProducts.length} Valid Products Ready
                      </span>
                      {parseResult.errors.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          {parseResult.errors.length} Skipped Rows
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview of first 3 rows */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs bg-slate-50">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Qty</th>
                          <th className="p-2.5">Cost</th>
                          <th className="p-2.5">Price</th>
                          <th className="p-2.5">Expiry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60">
                        {parseResult.validProducts.slice(0, 4).map((p, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="p-2.5 font-bold text-slate-800">{p.name}</td>
                            <td className="p-2.5 text-slate-600">{p.category}</td>
                            <td className="p-2.5 font-semibold text-emerald-700">{p.quantity}</td>
                            <td className="p-2.5 text-slate-600">{formatCurrency(p.costPrice, currency)}</td>
                            <td className="p-2.5 font-bold text-slate-900">{formatCurrency(p.sellingPrice, currency)}</td>
                            <td className="p-2.5 text-slate-600">{p.expiryDate || 'None'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parseResult.validProducts.length > 4 && (
                      <div className="p-2 text-center text-[11px] text-slate-400 font-medium bg-slate-50 border-t border-slate-200">
                        + {parseResult.validProducts.length - 4} more products ready to import
                      </div>
                    )}
                  </div>

                  {/* Confirm Import Button */}
                  <button
                    onClick={handleConfirmImport}
                    disabled={isImporting || parseResult.validProducts.length === 0}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-40"
                  >
                    {isImporting
                      ? 'Importing into Database...'
                      : `Import ${parseResult.validProducts.length} Products Into Store`}
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
