/**
 * SL-15: Export applicant table data to an Excel-friendly .csv file.
 * Pure client-side — no extra dependency needed.
 */
export default function ExportCsv({ applications, filename = "applicants.csv" }) {
  const handleExport = () => {
    if (!applications || applications.length === 0) {
      alert("No applicant data to export.");
      return;
    }

    const headers = ["Name", "USN", "CGPA", "Branch", "Status", "Resume URL"];
    const rows = applications.map((app) => [
      app.studentName ?? "",
      app.studentUsn ?? "",
      app.studentCgpa ?? "",
      app.branch ?? "",
      app.status ?? "",
      app.resumeUrl ?? "",
    ]);

    const escapeCell = (cell) => {
      const str = String(cell);
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
