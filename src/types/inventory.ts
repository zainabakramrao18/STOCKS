export interface Product {
  id: string;
  userId: string;
  name: string;
  category: string;
  sku?: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  expiryDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TransactionType = 'sale' | 'restock';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  profit?: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  date: string; // ISO string
  createdAt?: string;
}

export interface StoreSettings {
  userId: string;
  shopName: string;
  currency: string;
  lowStockThresholdDefault?: number;
  updatedAt?: string;
}

export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';

export interface InventoryStats {
  totalItems: number;
  totalUnits: number;
  totalCostValue: number;
  totalRetailValue: number;
  lowStockCount: number;
  expiringCount: number;
  expiredCount: number;
  totalSalesToday: number;
  totalProfitToday: number;
}
