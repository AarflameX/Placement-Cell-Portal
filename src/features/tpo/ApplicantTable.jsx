import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import StatusActions from "./StatusActions";

/**
 * Route: /tpo/drives/:jobId/applicants
 * SL-12: TPO Drive Applicant Table with resume view links.
 * Live-listens to applications where jobId == :jobId.
 */
export default function ApplicantTable() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

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

  if (loading) return <p className="p-4 text-gray-500">Loading applicants…</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (applications.length === 0) {
    return <p className="p-4 text-gray-500">No applications yet for this drive.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">USN</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">CGPA</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Branch</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Resume</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{app.studentName}</td>
              <td className="px-4 py-2">{app.studentUsn}</td>
              <td className="px-4 py-2">{app.studentCgpa}</td>
              <td className="px-4 py-2">{app.branch}</td>
              <td className="px-4 py-2">
                {app.resumeUrl ? (

                    href={app.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    View PDF
                  </a>
                ) : (
                  <span className="text-gray-400">No resume</span>
                )}
              </td>
              <td className="px-4 py-2">
                <StatusBadge status={app.status} />
              </td>
              <td className="px-4 py-2">
                <StatusActions applicationId={app.id} currentStatus={app.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    APPLIED: "bg-gray-100 text-gray-700",
    SHORTLISTED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    INTERVIEW: "bg-yellow-100 text-yellow-700",
    SELECTED: "bg-blue-100 text-blue-700",
  };
  const cls = styles[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>
      {status || "APPLIED"}
    </span>
  );
}
