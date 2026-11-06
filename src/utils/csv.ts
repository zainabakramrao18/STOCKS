import { Product } from '../types/inventory';

export interface CsvParseResult {
  validProducts: Omit<Product, 'id'>[];
  errors: { row: number; reason: string }[];
  totalRows: number;
}

/**
 * Escapes and quotes a CSV cell
 */
function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generate a downloadable CSV string of products
 */
export function exportProductsToCsv(products: Product[]): string {
  const headers = [
    'Name',
    'Category',
    'SKU',
    'Quantity',
    'Cost Price',
    'Selling Price',
    'Reorder Level',
    'Expiry Date (YYYY-MM-DD)',
    'Total Cost Value',
    'Total Retail Value',
    'Notes'
  ];

  const rows = products.map(p => {
    const totalCost = (p.quantity || 0) * (p.costPrice || 0);
    const totalRetail = (p.quantity || 0) * (p.sellingPrice || 0);

    return [
      escapeCsvCell(p.name),
      escapeCsvCell(p.category),
      escapeCsvCell(p.sku || ''),
      p.quantity,
      p.costPrice.toFixed(2),
      p.sellingPrice.toFixed(2),
      p.reorderLevel,
      escapeCsvCell(p.expiryDate || ''),
      totalCost.toFixed(2),
      totalRetail.toFixed(2),
      escapeCsvCell(p.notes || '')
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates sample CSV template content with instructions
 */
export function getSampleCsvTemplate(): string {
  const headers = 'Name,Category,SKU,Quantity,Cost Price,Selling Price,Reorder Level,Expiry Date,Notes';
  const sample1 = '"Whole Milk 1L","Dairy","MILK-001",24,1.20,1.99,6,"2026-11-20","Refrigerated bottom shelf"';
  const sample2 = '"Artisan Sourdough","Bakery","BREAD-002",12,2.00,4.50,4,"2026-11-09","Freshly baked"';
  const sample3 = '"Mineral Water 500ml","Beverages","BEV-003",48,0.35,1.00,12,"2027-05-15","Aisle 2"';
  const sample4 = '"Potato Chips 150g","Snacks","SNK-004",5,0.80,1.85,10,"2026-11-18","Near checkout"';
  return [headers, sample1, sample2, sample3, sample4].join('\r\n');
}

/**
 * Robust CSV parser that handles quotes and multiple lines
 */
function parseCsvRows(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Closing quote
          insideQuote = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Ignore or handle CRLF
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Parses user CSV text into Product records with validation
 */
export function parseCsvToProducts(csvText: string, userId: string): CsvParseResult {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return {
      validProducts: [],
      errors: [{ row: 1, reason: 'CSV is empty or missing a header row' }],
      totalRows: 0
    };
  }

  const headerRow = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Column index map
  const findCol = (aliases: string[]): number => {
    return headerRow.findIndex(h => aliases.some(alias => h.includes(alias)));
  };

  const nameIdx = findCol(['name', 'title', 'item', 'product']);
  const categoryIdx = findCol(['category', 'type', 'dept', 'department']);
  const skuIdx = findCol(['sku', 'code', 'barcode', 'upc']);
  const qtyIdx = findCol(['quantity', 'qty', 'stock', 'count', 'units']);
  const costIdx = findCol(['cost', 'costprice', 'purchaseprice', 'buyprice']);
  const priceIdx = findCol(['price', 'sellingprice', 'retailprice', 'sale']);
  const reorderIdx = findCol(['reorder', 'reorderlevel', 'lowstock', 'threshold', 'min']);
  const expiryIdx = findCol(['expiry', 'expirydate', 'exp', 'expiration', 'expires']);
  const notesIdx = findCol(['note', 'notes', 'desc', 'description']);

  if (nameIdx === -1) {
    return {
      validProducts: [],
      errors: [{ row: 1, reason: 'Header row must include a "Name" or "Product Name" column' }],
      totalRows: rows.length - 1
    };
  }

  const validProducts: Omit<Product, 'id'>[] = [];
  const errors: { row: number; reason: string }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const rowNum = i + 1;
    const row = rows[i];

    const name = (nameIdx !== -1 && row[nameIdx]) ? row[nameIdx].trim() : '';
    if (!name) {
      errors.push({ row: rowNum, reason: 'Product name cannot be empty' });
      continue;
    }

    const category = (categoryIdx !== -1 && row[categoryIdx]) ? row[categoryIdx].trim() : 'General';
    const sku = (skuIdx !== -1 && row[skuIdx]) ? row[skuIdx].trim().substring(0, 50) : undefined;
    
    // Quantity
    const qtyRaw = qtyIdx !== -1 && row[qtyIdx] ? row[qtyIdx].replace(/[^0-9.-]/g, '') : '0';
    const quantity = Math.max(0, parseInt(qtyRaw, 10) || 0);

    // Cost Price
    const costRaw = costIdx !== -1 && row[costIdx] ? row[costIdx].replace(/[^0-9.-]/g, '') : '0';
    const costPrice = Math.max(0, parseFloat(costRaw) || 0);

    // Selling Price
    const priceRaw = priceIdx !== -1 && row[priceIdx] ? row[priceIdx].replace(/[^0-9.-]/g, '') : '0';
    const sellingPrice = Math.max(0, parseFloat(priceRaw) || 0);

    // Reorder Level
    const reorderRaw = reorderIdx !== -1 && row[reorderIdx] ? row[reorderIdx].replace(/[^0-9.-]/g, '') : '5';
    const reorderLevel = Math.max(0, parseInt(reorderRaw, 10) || 5);

    // Expiry Date (YYYY-MM-DD cleanup)
    let expiryDate: string | undefined = undefined;
    if (expiryIdx !== -1 && row[expiryIdx]) {
      const expRaw = row[expiryIdx].trim();
      if (expRaw) {
        // Attempt to parse standard dates
        const parsed = new Date(expRaw);
        if (!isNaN(parsed.getTime())) {
          expiryDate = parsed.toISOString().split('T')[0];
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(expRaw)) {
          expiryDate = expRaw;
        }
      }
    }

    const notes = (notesIdx !== -1 && row[notesIdx]) ? row[notesIdx].trim().substring(0, 500) : undefined;

    validProducts.push({
      userId,
      name: name.substring(0, 150),
      category: category.substring(0, 60),
      sku,
      quantity,
      costPrice,
      sellingPrice,
      reorderLevel,
      expiryDate,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return {
    validProducts,
    errors,
    totalRows: rows.length - 1
  };
}

/**
 * Helper to trigger browser CSV file download
 */
export function downloadCsvFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
