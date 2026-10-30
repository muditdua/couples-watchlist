// Export and import of the whole list

const COLUMNS = [
  'media_type', 'tmdb_id', 'title', 'year', 'poster_path', 'runtime', 'seasons', 'genres', 'rating', 'director',
  'cast_names', 'watched', 'watched_at', 'added_by', 'added_by_id', 'likes', 'episodes_watched', 'season_counts',
  'planned_on', 'planned_time', 'notes', 'created_at',
];
export const BACKUP_COLUMNS = COLUMNS;

function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toLocaleDateString('en-CA');

export function downloadBackup(movies) {
  const rows = movies.map((m) => Object.fromEntries(COLUMNS.map((c) => [c, m[c] ?? null])));
  const payload = { app: 'our-movie-nights', version: 1, exported_at: new Date().toISOString(), movies: rows };
  download(`movie-nights-backup-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsv(movies) {
  const head = ['Title', 'Type', 'Year', 'Runtime (min)', 'Genres', 'Rating', 'Director', 'Watched', 'Watched on', 'Added by', 'Wanted by', 'Planned for', 'Notes'];
  const lines = movies.map((m) => [
    m.title, m.media_type === 'tv' ? 'Series' : 'Movie', m.year, m.runtime, (m.genres ?? []).join('; '), m.rating, m.director,
    m.watched ? 'Yes' : 'No', m.watched_at ? m.watched_at.slice(0, 10) : '', m.added_by,
    Object.values(m.likes ?? {}).join('; '), m.planned_on, (m.notes ?? []).map((n) => `${n.by}: ${n.text}`).join(' | '),
  ].map(csvCell).join(','));
  download(`movie-nights-${stamp()}.csv`, `\uFEFF${[head.join(','), ...lines].join('\r\n')}`, 'text/csv');
}

// Returns an array of rows, or throws a friendly error
export function parseBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("That file isn't a backup from this app."); }
  const rows = Array.isArray(data) ? data : data?.movies;
  if (!Array.isArray(rows) || !rows.length) throw new Error('No titles found in that file.');
  const ok = rows.filter((r) => r && r.title && r.tmdb_id != null);
  if (!ok.length) throw new Error("That file doesn't look like a backup from this app.");
  return ok;
}
