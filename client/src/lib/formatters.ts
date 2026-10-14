/**
 * Formats a number into Indian Rupee notation (e.g. ₹12,50,000.00)
 */
export function formatINR(val: number | null | undefined, includeSymbol: boolean = true): string {
  if (val === null || val === undefined || isNaN(val)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const fixed = absVal.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  let result = '';
  if (integerPart.length <= 3) {
    result = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = withCommas + ',' + lastThree;
  }

  const sign = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';
  return `${sign}${symbol}${result}.${decimalPart}`;
}

/**
 * Formats ISO date string to readable business format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats full timestamp with time
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Truncates a 64-character SHA-256 hash
 */
export function truncateHash(hash: string, start: number = 8, end: number = 8): string {
  if (!hash) return '—';
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

/**
 * Returns color classes for risk badge
 */
export function getRiskBadgeClasses(level: string): { bg: string; text: string; border: string } {
  switch (level?.toLowerCase()) {
    case 'critical':
      return { bg: 'bg-[#FCEEEE]', text: 'text-[#A94442]', border: 'border-[#E8B6B6]' };
    case 'high':
      return { bg: 'bg-[#F9ECE7]', text: 'text-[#C77758]', border: 'border-[#EDC7BA]' };
    case 'moderate':
      return { bg: 'bg-[#FDF6E9]', text: 'text-[#B47D28]', border: 'border-[#F0DCBA]' };
    case 'low':
    default:
      return { bg: 'bg-[#EDF6EE]', text: 'text-[#2E6F40]', border: 'border-[#BCE0C3]' };
  }
}

/**
 * Returns color classes for verification status badge
 */
export function getVerificationBadgeClasses(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'locally_verified':
      return { bg: 'bg-[#EDF6EE] text-[#2E6F40] border-[#BCE0C3]', text: 'text-[#2E6F40]', label: 'Locally Verified (SHA-256)' };
    case 'onchain_verified':
      return { bg: 'bg-[#EBF3FB] text-[#245D8C] border-[#B9D5F0]', text: 'text-[#245D8C]', label: 'On-chain Verified (Ethereum)' };
    case 'requires_re-analysis':
      return { bg: 'bg-[#FDF6E9] text-[#B47D28] border-[#F0DCBA]', text: 'text-[#B47D28]', label: 'Requires Re-analysis' };
    case 'tampered':
      return { bg: 'bg-[#FCEEEE] text-[#A94442] border-[#E8B6B6]', text: 'text-[#A94442]', label: 'Integrity Failed (Tampered)' };
    default:
      return { bg: 'bg-gray-100 text-gray-700 border-gray-200', text: 'text-gray-700', label: 'Unverified' };
  }
}
