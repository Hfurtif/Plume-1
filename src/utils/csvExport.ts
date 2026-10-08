/**
 * Utility to export data to Excel-compatible CSV with UTF-8 BOM
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  // UTF-8 BOM for Microsoft Excel compatibility
  const BOM = '\uFEFF';
  
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(';'),
    ...rows.map(row => 
      row.map(cell => {
        const str = cell !== undefined && cell !== null ? String(cell) : '';
        return `"${str.replace(/"/g, '""')}"`;
      }).join(';')
    )
  ].join('\r\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
