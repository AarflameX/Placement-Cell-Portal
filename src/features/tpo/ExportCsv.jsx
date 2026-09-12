/**
 * SL-15: Export shortlisted candidates to an Excel-friendly .csv file.
 * Filters internally for status === "SHORTLISTED" so the exported
 * file always matches the ticket's requirement, regardless of what
 * the caller passes in.
 */
export default function ExportCsv({ applications, filename = "shortlisted_candidates.csv" }) {
  const handleExport = () => {
    const shortlisted = (applications || []).filter(
      (app) => app.status === "SHORTLISTED"
    );

    if (shortlisted.length === 0) {
      alert("No shortlisted candidates to export.");
      return;
    }

    const headers = ["Name", "USN", "CGPA", "Branch", "Status", "Resume URL"];
    const rows = shortlisted.map((app) => [
      app.studentName ?? "",
      app.studentUsn ?? "",
      app.studentCgpa ?? "",
      app.branch ?? "",
      app.status ?? "",
      app.resumeUrl ?? "",
    ]);

    const escapeCell = (cell) => {
      const str = String(cell);
      // Wrap in quotes and escape internal quotes if the value contains
      // a comma, quote, or newline — standard CSV escaping.
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
    >
      Export to CSV
    </button>
  );
}
