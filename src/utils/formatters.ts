export function formatCurrency(amount: number, symbolOrCode: string = '$'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  
  // If symbol is 1-2 characters like $, £, €, ₹, ¥, ₱, ₦, prepend it directly
  if (symbolOrCode.length <= 2) {
    return `${symbolOrCode}${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  return `${symbolOrCode} ${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export interface ExpiryStatus {
  hasExpiry: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean; // within 30 days
  daysRemaining: number | null;
  label: string;
  badgeClass: string;
}

export function getExpiryStatus(expiryDateStr?: string): ExpiryStatus {
  if (!expiryDateStr || expiryDateStr.trim() === '') {
    return {
      hasExpiry: false,
      isExpired: false,
      isExpiringSoon: false,
      daysRemaining: null,
      label: 'No Expiry',
      badgeClass: 'text-slate-400 bg-slate-50 border-slate-200'
    };
  }

  // Parse YYYY-MM-DD
  const parts = expiryDateStr.split('-');
  let targetDate: Date;
  if (parts.length === 3) {
    targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  } else {
    targetDate = new Date(expiryDateStr);
  }

  if (isNaN(targetDate.getTime())) {
    return {
      hasExpiry: false,
      isExpired: false,
      isExpiringSoon: false,
      daysRemaining: null,
      label: 'Invalid Date',
      badgeClass: 'text-slate-400 bg-slate-50 border-slate-200'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      hasExpiry: true,
      isExpired: true,
      isExpiringSoon: true,
      daysRemaining: diffDays,
      label: absDays === 1 ? 'Expired yesterday' : `Expired ${absDays}d ago`,
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 font-semibold ring-1 ring-rose-300'
    };
  }

  if (diffDays === 0) {
    return {
      hasExpiry: true,
      isExpired: false,
      isExpiringSoon: true,
      daysRemaining: 0,
      label: 'Expires Today!',
      badgeClass: 'text-rose-700 bg-rose-100 border-rose-300 font-bold ring-1 ring-rose-400 animate-pulse'
    };
  }

  if (diffDays <= 30) {
    return {
      hasExpiry: true,
      isExpired: false,
      isExpiringSoon: true,
      daysRemaining: diffDays,
      label: `${diffDays} days left`,
      badgeClass: 'text-amber-800 bg-amber-50 border-amber-200 font-medium'
    };
  }

  return {
    hasExpiry: true,
    isExpired: false,
    isExpiringSoon: false,
    daysRemaining: diffDays,
    label: `${diffDays} days left`,
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200'
  };
}
