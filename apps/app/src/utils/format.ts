/**
 * Indonesian-First Currency and Date Formatters
 * Follows id-ID conventions and approved Rupiah standards.
 */

export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'Rp0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rp0';

  const isNegative = num < 0;
  const absNum = Math.round(Math.abs(num));
  const formatted = absNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return isNegative ? `-Rp${formatted}` : `Rp${formatted}`;
}

export function parseRupiahInput(input: string): number {
  if (!input) return 0;
  const clean = input.replace(/[^\d]/g, '');
  return parseInt(clean, 10) || 0;
}

export function formatTanggal(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '-';

  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalSingkat(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '-';

  const bulan = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];

  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}
