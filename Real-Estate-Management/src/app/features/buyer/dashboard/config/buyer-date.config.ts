export function formatVisitDate(dateStr: string): { day: string; month: string; time: string } {
  if (!dateStr) return { day: '--', month: '---', time: '--:--' };
  const d = new Date(dateStr);
  return {
    day:   d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
    time:  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}