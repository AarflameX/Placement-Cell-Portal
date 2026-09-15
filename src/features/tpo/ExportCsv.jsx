import { Download } from "lucide-react";

/**
 * SL-15: Export shortlisted candidates to an Excel-friendly .csv file.
 * Filters internally for status === "SHORTLISTED" or "SELECTED" so the exported
 * file always matches the ticket's requirement, regardless of what
 * the caller passes in.
 */
export default function ExportCsv({ applications, filename = "shortlisted_candidates.csv" }) {
  const handleExport = () => {
    const shortlisted = (applications || []).filter(
      (app) => app.status === "SHORTLISTED" || app.status === "SELECTED"
    );

    if (shortlisted.length === 0) {
      alert("No shortlisted or selected candidates to export.");
      return;
    }

    const headers = ["Name", "USN", "CGPA", "Branch", "Status", "Resume URL"];
    const rows = shortlisted.map((app) => [
      app.studentName ?? "",
      app.studentUsn ?? "",
      app.studentCgpa ?? "",
      app.studentBranch || app.branch || "",
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
      className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black px-3.5 py-1.5 text-xs font-medium shadow-xs hover:opacity-90 active:scale-98 transition-all cursor-pointer"
      title="Download shortlisted and selected candidates as CSV"
    >
      <Download className="h-3.5 w-3.5" />
      Export to CSV
    </button>
  );
}
