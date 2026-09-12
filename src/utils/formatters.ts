// Utility helpers for LocaManager

export function formatFCFA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount) + ' FCFA';
}

export function formatShortAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace('.0', '') + ' M FCFA';
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + ' k FCFA';
  }
  return formatFCFA(amount);
}

export function formatDateFR(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(monthStr: string): string {
  // input: '2026-03'
  if (!monthStr) return '';
  const [y, m] = monthStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function getDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  const now = new Date();
  // reset hours
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function computeLeaseExpiry(startDateStr: string, durationMonths: number, advanceMonths: number = 0): {
  theoriqueDate: string;
  reelleDate: string;
} {
  const start = new Date(startDateStr);
  
  // Date théorique = start + durationMonths
  const theorique = new Date(start);
  theorique.setMonth(theorique.getMonth() + durationMonths);

  // Date réelle = start + durationMonths + advanceMonths
  const reelle = new Date(start);
  reelle.setMonth(reelle.getMonth() + durationMonths + advanceMonths);

  return {
    theoriqueDate: theorique.toISOString().split('T')[0],
    reelleDate: reelle.toISOString().split('T')[0]
  };
}

export function generateQuittanceNumber(locataireName: string, monthStr: string): string {
  const cleanName = locataireName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  const cleanMonth = monthStr.replace('-', '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `QUIT-${cleanMonth}-${cleanName}-${randomSuffix}`;
}
