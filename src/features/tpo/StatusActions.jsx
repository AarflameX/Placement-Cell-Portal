import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

/**
 * SL-13: Shortlist / Reject / Schedule Interview buttons for one applicant row.
 * Writes directly to applications/{applicationId}.status
 */
export default function StatusActions({ applicationId, currentStatus }) {
  const [updating, setUpdating] = useState(false);

  const setStatus = async (newStatus) => {
    if (updating || currentStatus === newStatus) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "applications", applicationId), {
        status: newStatus,
        statusUpdatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Could not update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      <button
        onClick={() => setStatus("SHORTLISTED")}
        disabled={updating}
        className="rounded-md border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 text-[11px] font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50 transition-colors"
      >
        Shortlist
      </button>
      <button
        onClick={() => setStatus("INTERVIEW")}
        disabled={updating}
        className="rounded-md border border-purple-300 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 text-[11px] font-medium text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 disabled:opacity-50 transition-colors"
      >
        Interview
      </button>
      <button
        onClick={() => setStatus("SELECTED")}
        disabled={updating}
        className="rounded-md border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50 transition-colors"
      >
        Select
      </button>
      <button
        onClick={() => setStatus("REJECTED")}
        disabled={updating}
        className="rounded-md border border-red-200 dark:border-red-900/80 bg-red-50 dark:bg-red-950/40 px-2 py-1 text-[11px] font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
      >
        Reject
      </button>
    </div>
  );
}
