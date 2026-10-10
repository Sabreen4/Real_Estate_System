export function getApptStatusClass(s: string): string {
  const v = (s || 'PENDING').toUpperCase();
  if (v === 'APPROVED') return 'ts-approved';
  if (v === 'REJECTED') return 'ts-rejected';
  return 'ts-pending';
}

export function getOfferStatusClass(s: string): string {
  const v = (s || 'PENDING').toUpperCase();
  if (v === 'APPROVED') return 'ts-approved';
  if (v === 'REJECTED') return 'ts-rejected';
  return 'ts-pending';
}

export function getPaymentStatusClass(s: string): string {
  const v = (s || '').toUpperCase();
  if (v === 'COMPLETED') return 'ts-approved';
  if (v === 'FAILED')    return 'ts-rejected';
  return 'ts-pending';
}