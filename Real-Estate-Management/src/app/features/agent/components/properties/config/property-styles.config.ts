export function getStatusClass(s: string): string {
  const v = s?.toUpperCase();
  if (v === 'ACTIVE')  return 'pill-active';
  if (v === 'SOLD')    return 'pill-sold';
  if (v === 'PENDING') return 'pill-pending';
  return 'pill-inactive';
}

export function getListingClass(t: string): string {
  const v = t?.toUpperCase();
  if (v?.includes('SALE')) return 'badge-sale';
  if (v?.includes('RENT')) return 'badge-rent';
  return 'badge-lease';
}