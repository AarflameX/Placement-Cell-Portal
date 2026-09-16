import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Loader2, Inbox } from "lucide-react";
import { db } from "../../services/firebase";
import StatusActions from "./StatusActions";
import ExportCsv from "./ExportCsv";

/**
 * Route: /tpo/drives/:jobId/applicants
 * SL-12: TPO Drive Applicant Table with resume view links.
 * Live-listens to applications where jobId == :jobId.
 */
export default function ApplicantTable() {
  const { jobId } = useParams();
  const [drive, setDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    // Fetch drive details for header context
    getDoc(doc(db, "jobs", jobId))
      .then((snap) => {
        if (snap.exists()) {
          setDrive({ id: snap.id, ...snap.data() });
        }
      })
      .catch((err) => console.error("Failed to load drive details:", err));

    const q = query(collection(db, "applications"), where("jobId", "==", jobId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setApplications(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load applicants:", err);
        setError("Could not load applicants. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [jobId]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/tpo/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-2xl">
            {drive ? `${drive.companyName} — ${drive.role}` : "Drive Applicants"}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {drive
              ? `Package: ${drive.ctc} LPA | Min CGPA: ${drive.minCgpa} | Eligible: ${
                  Array.isArray(drive.eligibleBranches) ? drive.eligibleBranches.join(", ") : "All"
                }`
              : "Review submitted student resumes and update their shortlisting status."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 px-3 py-1 text-xs font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
            {applications.length} {applications.length === 1 ? "Applicant" : "Applicants"}
          </span>
          {applications.length > 0 && (
            <ExportCsv
              applications={applications}
              filename={`${
                drive?.companyName
                  ? drive.companyName.toLowerCase().replace(/\s+/g, "_")
                  : "drive"
              }_shortlisted.csv`}
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-sm text-neutral-500 dark:text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400 mb-2" />
          Loading applicants…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-6 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#121215] p-12 text-center shadow-xs">
          <Inbox className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-700 mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">No Applicants Yet</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            No students have applied to this placement drive yet. Applications will appear here as soon as students submit.
          </p>
          <Link
            to="/tpo/dashboard"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] shadow-xs">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
            <thead className="bg-neutral-50/80 dark:bg-neutral-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">USN</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">CGPA</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Branch</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Resume</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-800 dark:text-neutral-200">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{app.studentName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">{app.studentUsn}</td>
                  <td className="px-4 py-3 tabular-nums">{app.studentCgpa}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50 px-1.5 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      {app.studentBranch || app.branch || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {app.resumeUrl ? (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        View PDF &rarr;
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">No resume</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusActions applicationId={app.id} currentStatus={app.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    APPLIED: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700",
    SHORTLISTED: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
    REJECTED: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50",
    INTERVIEW: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50",
    SELECTED: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
  };
  const cls = styles[status] || "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${cls}`}>
      {status || "APPLIED"}
    </span>
  );
}
