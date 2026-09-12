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
    <div className="flex gap-1.5">
      <button
        onClick={() => setStatus("SHORTLISTED")}
        disabled={updating}
        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Shortlist
      </button>
      <button
        onClick={() => setStatus("REJECTED")}
        disabled={updating}
        className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
      <button
        onClick={() => setStatus("INTERVIEW")}
        disabled={updating}
        className="rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
      >
        Schedule Interview
      </button>
    </div>
  );
}
