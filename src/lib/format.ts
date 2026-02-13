/**
 * Format a number as Dominican Peso (RD$)
 */
export function formatCurrency(amount: number): string {
  return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a date for Dominican locale
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
