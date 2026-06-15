/**
 * Format a number as LKR (Sri Lankan Rupee) with 2 decimal places.
 *
 * Examples:
 *   formatLKR(1199)         => "Rs. 1,199.00"
 *   formatLKR(1234567.89)   => "Rs. 1,234,567.89"
 *   formatLKR(0)            => "Rs. 0.00"
 */
export function formatLKR(amount: number | string | null | undefined): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 'Rs. 0.00';
  return 'Rs. ' + value.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format LKR with no decimals (e.g. for compact displays) */
export function formatLKRCompact(amount: number | string | null | undefined): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 'Rs. 0';
  return 'Rs. ' + value.toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
