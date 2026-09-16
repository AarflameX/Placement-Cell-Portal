import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
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
  APPLIED: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700",
  SHORTLISTED: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
  INTERVIEW: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50",
  SELECTED: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50",
  REJECTED: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50",
};

const STATUS_LABELS = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
};

function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] ?? "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700";
  const label = STATUS_LABELS[status] ?? status ?? "Unknown";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${styles}`}
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
    if (authLoading) return;

    if (!currentUser?.uid) {
      setStatus("error");
      setErrorMessage("You need to be logged in to view your applications.");
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.APPLICATIONS),
      where("studentId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        docs.sort((a, b) => {
          const dateA = toDateSafe(a.appliedAt);
          const dateB = toDateSafe(b.appliedAt);
          if (!dateA && !dateB) return 0;
          if (!dateA) return -1;
          if (!dateB) return 1;
          return dateB.getTime() - dateA.getTime();
        });

        setApplications(docs);
        setStatus("ready");
      },
      (err) => {
        console.error("MyApplications: failed to load applications:", err);
        setStatus("error");
        setErrorMessage("Couldn't load your applications. Please try again.");
      }
    );

    return () => unsubscribe();
  }, [authLoading, currentUser?.uid]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          My Applications
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Track the status of the placement drives you&apos;ve applied to.
        </p>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] py-12 text-sm text-neutral-500 dark:text-neutral-400 shadow-xs">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          Loading your applications...
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        </div>
      )}

      {status === "ready" && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#121215] py-12 text-center p-6 shadow-xs">
          <Inbox className="h-8 w-8 text-neutral-400 dark:text-neutral-600 mb-1" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No applications yet</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
            Apply to open placement drives to track your progress and interview calls here.
          </p>
          <Link
            to="/drives"
            className="mt-4 inline-flex items-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-medium shadow-xs hover:opacity-90 active:scale-98 transition-all"
          >
            Browse Open Drives &rarr;
          </Link>
        </div>
      )}

      {status === "ready" && applications.length > 0 && (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li
              key={app.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] p-5 shadow-xs transition-colors hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {app.companyName || "Placement Drive"}
                  </p>
                  {app.role && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
                      • {app.role}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
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
