/**
 * Indian Rupee formatting utilities for TransitOps ERP
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrDecimalFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a number as Indian Rupees (₹12,34,567)
 */
export function formatINR(value) {
  if (value == null || isNaN(value)) return '₹0';
  return inrFormatter.format(Number(value));
}

/**
 * Format a number as Indian Rupees with decimals (₹12,34,567.89)
 */
export function formatINRDecimal(value) {
  if (value == null || isNaN(value)) return '₹0.00';
  return inrDecimalFormatter.format(Number(value));
}

/**
 * Format large INR values in shortened form (₹12.5L, ₹2.4Cr)
 */
export function formatINRShort(value) {
  if (value == null || isNaN(value)) return '₹0';
  const num = Number(value);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(1)}Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(1)}L`;
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(1)}K`;
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Translate technical errors (e.g., "is not a function", unique constraints) to user-friendly messages.
 */
export function getFriendlyErrorMessage(errorMsg, defaultMsg = 'An unexpected error occurred. Please try again.') {
  if (!errorMsg || typeof errorMsg !== 'string') return defaultMsg;
  
  const lower = errorMsg.toLowerCase();
  
  if (
    lower.includes('not a function') || 
    lower.includes('is not defined') || 
    lower.includes('null') || 
    lower.includes('undefined') ||
    lower.includes('prisma') ||
    lower.includes('error handler')
  ) {
    return 'The server encountered an unexpected error. Our engineers have been notified. Please try again later.';
  }
  
  if (lower.includes('conflict') || lower.includes('already exists') || lower.includes('p2002')) {
    return 'A record with this information already exists in our system. Please check details.';
  }
  
  if (lower.includes('network error') || lower.includes('failed to fetch') || lower.includes('econnrefused')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }

  return errorMsg;
}
