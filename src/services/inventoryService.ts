import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Transaction, StoreSettings } from '../types/inventory';

const getProductsPath = (userId: string) => `users/${userId}/products`;
const getTransactionsPath = (userId: string) => `users/${userId}/transactions`;
const getSettingsPath = (userId: string) => `users/${userId}/settings/general`;

/**
 * Subscribe to real-time products updates for a specific user
 */
export function subscribeProducts(
  userId: string,
  onData: (products: Product[]) => void,
  onError?: (err: unknown) => void
) {
  const path = getProductsPath(userId);
  const q = query(collection(db, path));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          name: data.name || '',
          category: data.category || 'General',
          sku: data.sku || '',
          quantity: Number(data.quantity) || 0,
          costPrice: Number(data.costPrice) || 0,
          sellingPrice: Number(data.sellingPrice) || 0,
          reorderLevel: Number(data.reorderLevel) || 5,
          expiryDate: data.expiryDate || '',
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      // Sort alphabetically by name
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Add a new product to Firestore
 */
export async function addProduct(
  userId: string,
  productData: Omit<Product, 'id' | 'userId'>
): Promise<string> {
  const path = getProductsPath(userId);
  try {
    const newDocRef = doc(collection(db, path));
    const now = new Date().toISOString();
    const payload = {
      ...productData,
      id: newDocRef.id,
      userId,
      quantity: Number(productData.quantity) || 0,
      costPrice: Number(productData.costPrice) || 0,
      sellingPrice: Number(productData.sellingPrice) || 0,
      reorderLevel: Number(productData.reorderLevel) || 0,
      expiryDate: productData.expiryDate || '',
      sku: productData.sku || '',
      notes: productData.notes || '',
      createdAt: now,
      updatedAt: now
    };

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  userId: string,
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'userId'>>
): Promise<void> {
  const path = `${getProductsPath(userId)}/${productId}`;
  try {
    const docRef = doc(db, getProductsPath(userId), productId);
    const cleanUpdates: Record<string, unknown> = {
      ...updates,
      userId,
      updatedAt: new Date().toISOString()
    };

    if (updates.quantity !== undefined) cleanUpdates.quantity = Number(updates.quantity);
    if (updates.costPrice !== undefined) cleanUpdates.costPrice = Number(updates.costPrice);
    if (updates.sellingPrice !== undefined) cleanUpdates.sellingPrice = Number(updates.sellingPrice);
    if (updates.reorderLevel !== undefined) cleanUpdates.reorderLevel = Number(updates.reorderLevel);

    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(userId: string, productId: string): Promise<void> {
  const path = `${getProductsPath(userId)}/${productId}`;
  try {
    const docRef = doc(db, getProductsPath(userId), productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Record a sale: decrements product stock and records immutable transaction
 */
export async function recordSale(
  userId: string,
  product: Product,
  quantitySold: number,
  sellingPrice: number,
  notes?: string
): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  const productRef = doc(db, getProductsPath(userId), product.id);
  const prevStock = product.quantity;
  const newStock = Math.max(0, prevStock - quantitySold);

  // Update product stock
  batch.update(productRef, {
    quantity: newStock,
    updatedAt: now
  });

  // Record Transaction
  const txRef = doc(collection(db, getTransactionsPath(userId)));
  const totalAmount = quantitySold * sellingPrice;
  const unitCost = product.costPrice || 0;
  const profit = quantitySold * (sellingPrice - unitCost);

  const txData = {
    id: txRef.id,
    userId,
    type: 'sale',
    productId: product.id,
    productName: product.name,
    quantity: quantitySold,
    unitPrice: sellingPrice,
    totalAmount,
    profit,
    previousStock: prevStock,
    newStock,
    notes: notes || '',
    date: now,
    createdAt: now
  };

  batch.set(txRef, txData);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, getTransactionsPath(userId));
  }
}

/**
 * Record restock: increments product stock and creates transaction record
 */
export async function recordRestock(
  userId: string,
  product: Product,
  quantityAdded: number,
  costPrice: number,
  notes?: string
): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  const productRef = doc(db, getProductsPath(userId), product.id);
  const prevStock = product.quantity;
  const newStock = prevStock + quantityAdded;

  // Update product stock and optionally updated cost price
  batch.update(productRef, {
    quantity: newStock,
    costPrice: costPrice > 0 ? costPrice : product.costPrice,
    updatedAt: now
  });

  // Record Transaction
  const txRef = doc(collection(db, getTransactionsPath(userId)));
  const totalAmount = quantityAdded * costPrice;

  const txData = {
    id: txRef.id,
    userId,
    type: 'restock',
    productId: product.id,
    productName: product.name,
    quantity: quantityAdded,
    unitPrice: costPrice,
    totalAmount,
    profit: 0,
    previousStock: prevStock,
    newStock,
    notes: notes || '',
    date: now,
    createdAt: now
  };

  batch.set(txRef, txData);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, getTransactionsPath(userId));
  }
}

/**
 * Batch import products (from CSV)
 */
export async function importProductsBatch(
  userId: string,
  products: Omit<Product, 'id'>[]
): Promise<number> {
  if (products.length === 0) return 0;
  
  // Firestore batches have a 500 operations limit
  const chunkSize = 400;
  let importedCount = 0;

  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const item of chunk) {
      const docRef = doc(collection(db, getProductsPath(userId)));
      batch.set(docRef, {
        ...item,
        id: docRef.id,
        userId,
        createdAt: now,
        updatedAt: now
      });
      importedCount++;
    }

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, getProductsPath(userId));
    }
  }

  return importedCount;
}

/**
 * Subscribe to recent transactions ledger
 */
export function subscribeTransactions(
  userId: string,
  onData: (txs: Transaction[]) => void,
  onError?: (err: unknown) => void
) {
  const path = getTransactionsPath(userId);
  const q = query(collection(db, path), orderBy('date', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: d.userId,
          type: d.type,
          productId: d.productId,
          productName: d.productName,
          quantity: Number(d.quantity) || 0,
          unitPrice: Number(d.unitPrice) || 0,
          totalAmount: Number(d.totalAmount) || 0,
          profit: d.profit !== undefined ? Number(d.profit) : 0,
          previousStock: Number(d.previousStock) || 0,
          newStock: Number(d.newStock) || 0,
          notes: d.notes || '',
          date: d.date || '',
          createdAt: d.createdAt
        });
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Load user settings or create default
 */
export async function getStoreSettings(userId: string): Promise<StoreSettings> {
  const path = getSettingsPath(userId);
  try {
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      const d = snap.data();
      return {
        userId,
        shopName: d.shopName || 'My Corner Shop',
        currency: d.currency || '$',
        lowStockThresholdDefault: d.lowStockThresholdDefault || 5,
        updatedAt: d.updatedAt
      };
    }
    // Return default settings
    return {
      userId,
      shopName: 'My Corner Shop',
      currency: '$',
      lowStockThresholdDefault: 5
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save store settings
 */
export async function saveStoreSettings(userId: string, settings: StoreSettings): Promise<void> {
  const path = getSettingsPath(userId);
  try {
    await setDoc(doc(db, path), {
      ...settings,
      userId,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Pre-populate initial sample inventory for quick testing
 */
export async function seedSampleInventory(userId: string): Promise<void> {
  const today = new Date();
  
  const inDays = (days: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const samples: Omit<Product, 'id'>[] = [
    {
      userId,
      name: 'Fresh Whole Milk 1L',
      category: 'Dairy',
      sku: 'DRY-001',
      quantity: 4, // LOW STOCK (<= 8)
      costPrice: 1.20,
      sellingPrice: 1.95,
      reorderLevel: 8,
      expiryDate: inDays(6), // EXPIRING SOON (<30 days)
      notes: 'Fridge rack 1',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    },
    {
      userId,
      name: 'Farm Fresh Brown Eggs (12pk)',
      category: 'Dairy',
      sku: 'DRY-002',
      quantity: 14,
      costPrice: 2.10,
      sellingPrice: 3.49,
      reorderLevel: 6,
      expiryDate: inDays(14), // EXPIRING SOON
      notes: 'Store in cool area',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    },
    {
      userId,
      name: 'Artisan Bakery Sourdough',
      category: 'Bakery',
      sku: 'BKR-101',
      quantity: 2, // LOW STOCK (<= 5)
      costPrice: 1.80,
      sellingPrice: 4.25,
      reorderLevel: 5,
      expiryDate: inDays(2), // EXPIRING IN 2 DAYS
      notes: 'Daily delivery from bakery',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    },
    {
      userId,
      name: 'Sparkling Mineral Water 500ml',
      category: 'Beverages',
      sku: 'BEV-201',
      quantity: 48, // HEALTHY STOCK
      costPrice: 0.40,
      sellingPrice: 1.25,
      reorderLevel: 12,
      expiryDate: inDays(180),
      notes: 'Front beverage cooler',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    },
    {
      userId,
      name: 'Crunchy Corn Nacho Chips 200g',
      category: 'Snacks',
      sku: 'SNK-301',
      quantity: 3, // LOW STOCK (<= 10)
      costPrice: 0.90,
      sellingPrice: 2.10,
      reorderLevel: 10,
      expiryDate: inDays(22), // EXPIRING SOON
      notes: 'Snack aisle shelf B',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    },
    {
      userId,
      name: 'Premium Jasmine Rice 5kg',
      category: 'Groceries',
      sku: 'GRO-401',
      quantity: 18,
      costPrice: 6.50,
      sellingPrice: 10.99,
      reorderLevel: 6,
      expiryDate: inDays(400),
      notes: 'Grain pallet',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    },
    {
      userId,
      name: 'Classic Cola Cans 330ml (Pack of 6)',
      category: 'Beverages',
      sku: 'BEV-202',
      quantity: 0, // OUT OF STOCK (CRITICAL)
      costPrice: 2.40,
      sellingPrice: 4.99,
      reorderLevel: 10,
      expiryDate: inDays(90),
      notes: 'Needs immediate supplier reorder',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    },
    {
      userId,
      name: 'Natural Honey Yoghurt 500g',
      category: 'Dairy',
      sku: 'DRY-003',
      quantity: 5,
      costPrice: 1.50,
      sellingPrice: 2.80,
      reorderLevel: 6,
      expiryDate: inDays(-2), // EXPIRED! Demonstrates the expired filter
      notes: 'Check batch expiry upon receipt',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    }
  ];

  await importProductsBatch(userId, samples);
}
