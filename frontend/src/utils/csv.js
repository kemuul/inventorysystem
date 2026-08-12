// utils/csv.js
// Turns an array of flat objects into a downloadable CSV — no backend
// endpoint needed since the data's already in the browser once a report
// has loaded.

function escapeCsvValue(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// rows: array of objects. columns: [{ key, label }] controls order + headers.
export function downloadCSV(filename, rows, columns) {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(','))
    .join('\n');
  const csv = `${header}\n${body}`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
