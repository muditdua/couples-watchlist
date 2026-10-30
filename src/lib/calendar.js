const pad = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const escapeText = (s) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

// Downloads a .ics file; opening it adds the movie night to the phone's calendar
export function downloadCalendarEvent(movie) {
  let when;
  if (movie.planned_time) {
    const start = new Date(`${movie.planned_on}T${movie.planned_time}:00`);
    const length = movie.media_type === 'tv' ? 120 : (movie.runtime || 105) + 15;
    when = `DTSTART:${local(start)}\r\nDTEND:${local(new Date(start.getTime() + length * 60000))}`;
  } else {
    const day = new Date(`${movie.planned_on}T12:00:00`);
    const next = new Date(day); next.setDate(next.getDate() + 1);
    const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    when = `DTSTART;VALUE=DATE:${ymd(day)}\r\nDTEND;VALUE=DATE:${ymd(next)}`;
  }
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Our Movie Nights//EN', 'BEGIN:VEVENT',
    `UID:${movie.id}@our-movie-nights`, `DTSTAMP:${stamp}`, when,
    `SUMMARY:${escapeText(`Movie night: ${movie.title}`)}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'movie-night.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
