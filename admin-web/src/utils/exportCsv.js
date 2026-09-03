function exportToCsv(filename, rows, columns) {
  if (!rows || rows.length === 0) {
    alert("No data available to export.");
    return;
  }
  const headerLine = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
  const rowLines = rows.map(
    (row) => columns.map((col) => {
      let val;
      if (col.formatter) {
        val = col.formatter(row[col.key], row);
      } else {
        val = row[col.key];
      }
      if (val === null || val === void 0) val = "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );
  const csvContent = "\uFEFF" + [headerLine, ...rowLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
export {
  exportToCsv
};
