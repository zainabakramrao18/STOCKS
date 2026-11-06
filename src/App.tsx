/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  auth, 
  signInWithGoogle, 
  logOut, 
  onAuthStateChanged, 
  User 
} from './firebase';
import { 
  Product, 
  Transaction, 
  StoreSettings, 
  StockFilter, 
  InventoryStats 
} from './types/inventory';
import {
  subscribeProducts,
  subscribeTransactions,
  addProduct,
  updateProduct,
  deleteProduct,
  recordSale,
  recordRestock,
  importProductsBatch,
  getStoreSettings,
  saveStoreSettings,
  seedSampleInventory
} from './services/inventoryService';
import { getExpiryStatus } from './utils/formatters';

// Components
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { ProductList } from './components/ProductList';
import { ProductModal } from './components/ProductModal';
import { SaleModal } from './components/SaleModal';
import { RestockModal } from './components/RestockModal';
import { CsvModal } from './components/CsvModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LoginView } from './components/LoginView';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Shop Data
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    userId: '',
    shopName: 'My Corner Shop',
    currency: '$',
    lowStockThresholdDefault: 5
  });

  // UI State
  const [activeFilter, setActiveFilter] = useState<StockFilter>('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Track Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Load settings for this user
        try {
          const userSettings = await getStoreSettings(currentUser.uid);
          setSettings(userSettings);
        } catch (err) {
          console.error('Error fetching settings:', err);
        }
      } else {
        setProducts([]);
        setTransactions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time products and transactions when user is logged in
  useEffect(() => {
    if (!user) return;

    const unsubProducts = subscribeProducts(
      user.uid,
      (items) => setProducts(items),
      (err) => console.error('Products listener error:', err)
    );

    const unsubTransactions = subscribeTransactions(
      user.uid,
      (txs) => setTransactions(txs),
      (err) => console.error('Transactions listener error:', err)
    );

    return () => {
      unsubProducts();
      unsubTransactions();
    };
  }, [user]);

  // Compute Dashboard Statistics
  const stats: InventoryStats = useMemo(() => {
    let totalUnits = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    products.forEach((p) => {
      const qty = p.quantity || 0;
      totalUnits += qty;
      totalCostValue += qty * (p.costPrice || 0);
      totalRetailValue += qty * (p.sellingPrice || 0);

      // Low stock rule
      if (qty <= p.reorderLevel) {
        lowStockCount++;
      }

      // Expiry rule (within 30 days)
      const expiry = getExpiryStatus(p.expiryDate);
      if (expiry.isExpiringSoon && !expiry.isExpired) {
        expiringCount++;
      }
      if (expiry.isExpired) {
        expiredCount++;
      }
    });

    // Today's sales summary
    const todayStr = new Date().toISOString().split('T')[0];
    let totalSalesToday = 0;
    let totalProfitToday = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'sale') {
        const txDate = tx.date?.split('T')[0];
        if (txDate === todayStr) {
          totalSalesToday += tx.totalAmount;
          totalProfitToday += tx.profit || 0;
        }
      }
    });

    return {
      totalItems: products.length,
      totalUnits,
      totalCostValue,
      totalRetailValue,
      lowStockCount,
      expiringCount: expiringCount + expiredCount,
      expiredCount,
      totalSalesToday,
      totalProfitToday
    };
  }, [products, transactions]);

  // Notification helper
  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Google Sign-In
  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError('');
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setAuthError(err.message || 'Google Sign-in failed. Please ensure popups are allowed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign-Out
  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Seed sample data for testing
  const handleSeedDemo = async () => {
    if (!user) return;
    try {
      setIsSeeding(true);
      await seedSampleInventory(user.uid);
      showNotification('Loaded 8 sample products into your store!');
    } catch (err: any) {
      console.error('Failed to seed:', err);
      showNotification('Error loading sample items: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Product Add / Update
  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'userId'>) => {
    if (!user) return;
    if (editingProduct) {
      await updateProduct(user.uid, editingProduct.id, productData);
      showNotification(`Updated "${productData.name}"`);
    } else {
      await addProduct(user.uid, productData);
      showNotification(`Added "${productData.name}" to inventory`);
    }
  };

  // Product Delete
  const handleConfirmDelete = async () => {
    if (!user || !deletingProduct) return;
    await deleteProduct(user.uid, deletingProduct.id);
    showNotification(`Deleted "${deletingProduct.name}"`);
  };

  // Quick Sale
  const handleRecordSale = async (
    product: Product,
    quantity: number,
    sellingPrice: number,
    notes?: string
  ) => {
    if (!user) return;
    await recordSale(user.uid, product, quantity, sellingPrice, notes);
    showNotification(`Sale recorded: ${quantity}x ${product.name}`);
  };

  // Quick Restock
  const handleRecordRestock = async (
    product: Product,
    quantity: number,
    costPrice: number,
    notes?: string
  ) => {
    if (!user) return;
    await recordRestock(user.uid, product, quantity, costPrice, notes);
    showNotification(`Restocked: +${quantity} units of ${product.name}`);
  };

  // CSV Batch Import
  const handleImportBatch = async (items: Omit<Product, 'id'>[]) => {
    if (!user) return 0;
    const count = await importProductsBatch(user.uid, items);
    showNotification(`Successfully imported ${count} products from CSV!`);
    return count;
  };

  // Settings Save
  const handleSaveSettings = async (newSettings: StoreSettings) => {
    if (!user) return;
    await saveStoreSettings(user.uid, newSettings);
    setSettings(newSettings);
    showNotification('Store preferences updated');
  };

  // Show Loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Connecting to StockWise...</p>
        </div>
      </div>
    );
  }

  // Not Signed In -> Show Welcoming Landing Screen
  if (!user) {
    return (
      <LoginView
        onSignIn={handleSignIn}
        isSigningIn={isSigningIn}
        error={authError}
      />
    );
  }

  // Signed In -> Full StockWise App
  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 flex flex-col font-sans">
      
      {/* App Header */}
      <Header
        user={user}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTransactions={() => setIsTransactionsOpen(true)}
        onSignOut={handleSignOut}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
        productCount={products.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        
        {/* Toast Notification */}
        {statusNotification && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div className="px-5 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl flex items-center space-x-2 border border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>{statusNotification}</span>
            </div>
          </div>
        )}

        {/* Dashboard Statistics & Top Alerts */}
        <DashboardStats
          stats={stats}
          currency={settings.currency}
          activeFilter={activeFilter}
          onSelectFilter={(filter) => setActiveFilter(filter)}
          onOpenAddProduct={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          onOpenSaleModal={() => {
            setSaleProduct(null);
            setIsSaleModalOpen(true);
          }}
          onOpenRestockModal={() => {
            setRestockProduct(null);
            setIsRestockModalOpen(true);
          }}
          onOpenCsvModal={() => setIsCsvModalOpen(true)}
        />

        {/* Product List, Filtering, Searching and Actions */}
        <ProductList
          products={products}
          currency={settings.currency}
          activeFilter={activeFilter}
          onSelectFilter={(filter) => setActiveFilter(filter)}
          onOpenAddProduct={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          onEditProduct={(product) => {
            setEditingProduct(product);
            setIsProductModalOpen(true);
          }}
          onDeleteProduct={(product) => setDeletingProduct(product)}
          onQuickSale={(product) => {
            setSaleProduct(product);
            setIsSaleModalOpen(true);
          }}
          onQuickRestock={(product) => {
            setRestockProduct(product);
            setIsRestockModalOpen(true);
          }}
          onSeedDemo={handleSeedDemo}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} StockWise • Inventory & Sales for Small Retailers</p>
          <p className="text-emerald-700 font-semibold">
            Google Firestore Realtime Database Connected
          </p>
        </div>
      </footer>

      {/* Modal Dialogs */}
      
      {/* Add / Edit Product */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
        currency={settings.currency}
      />

      {/* Record Sale */}
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSaleProduct(null);
        }}
        products={products}
        selectedProduct={saleProduct}
        currency={settings.currency}
        onConfirmSale={handleRecordSale}
      />

      {/* Record Restock */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setRestockProduct(null);
        }}
        products={products}
        selectedProduct={restockProduct}
        currency={settings.currency}
        onConfirmRestock={handleRecordRestock}
      />

      {/* CSV Import / Export */}
      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        products={products}
        userId={user.uid}
        currency={settings.currency}
        onImportBatch={handleImportBatch}
      />

      {/* Transactions History Ledger */}
      <TransactionHistoryModal
        isOpen={isTransactionsOpen}
        onClose={() => setIsTransactionsOpen(false)}
        transactions={transactions}
        currency={settings.currency}
      />

      {/* Store Settings */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Confirm Deletion */}
      <DeleteConfirmModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        product={deletingProduct}
        onConfirm={handleConfirmDelete}
      />

    </div>
  );
}
