// "Plan a night" helpers. Dates are plain yyyy-mm-dd strings in local time.
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export const todayYmd = () => new Date().toLocaleDateString('en-CA');

export function daysUntil(ymd) {
  return Math.round((new Date(`${ymd}T00:00:00`) - startOfToday()) / 86400000);
}

export const fmtPlanDate = (ymd) =>
  new Date(`${ymd}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export const fmtTime = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

// "Tonight", "Tomorrow", "Sat, 1 Nov"; null once the date has passed
export function planLabel(ymd) {
  if (!ymd) return null;
  const n = daysUntil(ymd);
  if (n < 0) return null;
  if (n === 0) return 'Tonight';
  if (n === 1) return 'Tomorrow';
  return fmtPlanDate(ymd);
}

export function countdown(ymd) {
  const n = daysUntil(ymd);
  if (n < 0) return 'This date has passed';
  if (n === 0) return 'Tonight';
  if (n === 1) return 'Tomorrow';
  return `In ${n} days`;
}
