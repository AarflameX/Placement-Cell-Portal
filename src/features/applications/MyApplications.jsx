import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, AlertCircle, Inbox, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firebase";
import { COLLECTIONS } from "../../types/schema";

/**
 * SL-11: Student "My Applications" tracking screen.
 *
 * Reads-only against the `applications` collection SL-10 writes to.
 * Does not create, update, or delete anything.
 */

const STATUS_STYLES = {
  APPLIED: "bg-blue-100 text-blue-700 border border-blue-200",
  SHORTLISTED: "bg-amber-100 text-amber-800 border border-amber-200",
  INTERVIEW: "bg-purple-100 text-purple-700 border border-purple-200",
  SELECTED: "bg-green-100 text-green-700 border border-green-200",
  REJECTED: "bg-red-100 text-red-700 border border-red-200",
};

const STATUS_LABELS = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
};

function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 border border-gray-200";
  const label = STATUS_LABELS[status] ?? status ?? "Unknown";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}

/**
 * Firestore Timestamp | Date | string | null/undefined -> Date | null.
 * SL-10 writes appliedAt with serverTimestamp(), which can briefly read as
 * null on the client before the server value round-trips, so this must not
 * throw or crash the row when that happens.
 */
function toDateSafe(appliedAt) {
  if (!appliedAt) return null;
  if (typeof appliedAt.toDate === "function") {
    try {
      return appliedAt.toDate();
    } catch {
      return null;
    }
  }
  if (appliedAt instanceof Date) return appliedAt;
  const parsed = new Date(appliedAt);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatAppliedDate(appliedAt) {
  const date = toDateSafe(appliedAt);
  if (!date) return "Pending";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MyApplications() {
  const { currentUser, loading: authLoading } = useAuth();

  // 'loading' | 'ready' | 'error'
  const [status, setStatus] = useState("loading");
  const [applications, setApplications] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    // Auth state is still resolving — wait rather than querying with an
    // undefined uid.
    if (authLoading) {
      setStatus("loading");
      return;
    }

    if (!currentUser?.uid) {
      setStatus("error");
      setErrorMessage("You need to be logged in to view your applications.");
      return;
    }

    let cancelled = false;

    async function loadApplications() {
      setStatus("loading");
      setErrorMessage(null);
      try {
        const q = query(
          collection(db, COLLECTIONS.APPLICATIONS),
          where("studentId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        if (cancelled) return;

        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Sort newest first in JS rather than via Firestore orderBy, since
        // appliedAt can be briefly null right after a serverTimestamp()
        // write — an orderBy would either exclude those rows or require an
        // extra composite index for no real benefit here.
        docs.sort((a, b) => {
          const dateA = toDateSafe(a.appliedAt);
          const dateB = toDateSafe(b.appliedAt);
          if (!dateA && !dateB) return 0;
          if (!dateA) return -1; // just-applied / pending timestamp shows first
          if (!dateB) return 1;
          return dateB.getTime() - dateA.getTime();
        });

        setApplications(docs);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("MyApplications: failed to load applications:", err);
        setStatus("error");
        setErrorMessage("Couldn't load your applications. Please try again.");
      }
    }

    loadApplications();
    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser?.uid]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">My Applications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track the status of the placement drives you've applied to.
        </p>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-12 text-sm text-gray-500 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your applications...
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {status === "ready" && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
          <Inbox className="h-6 w-6 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">No applications yet</p>
          <p className="text-xs text-gray-500">
            Apply to a placement drive to see it show up here.
          </p>
        </div>
      )}

      {status === "ready" && applications.length > 0 && (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li
              key={app.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  Drive: {app.jobId}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Applied {formatAppliedDate(app.appliedAt)}
                </p>
              </div>
              <StatusBadge status={app.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
