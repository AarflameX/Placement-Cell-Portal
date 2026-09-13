import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firebase";
import { COLLECTIONS } from "../../types/schema";

/**
 * SL-10: Apply Now.
 *
 * Reusable, presentation-agnostic — pass the job being applied to via
 * `job` (needs at least job.id, job.companyName, job.role). Does not
 * assume a page layout, a Drives feed, or any particular parent.
 *
 * Reads the student's identity/profile from the existing AuthContext
 * (currentUser, userProfile) and writes to the existing `applications`
 * collection. Does not touch SL-9's ResumeUpload, AuthContext, firebase.js,
 * or schema.js — it only reads userProfile.resumeUrl, which SL-9 already
 * saves onto users/{uid}.
 */

async function findExistingApplication(uid, jobId) {
  const q = query(
    collection(db, COLLECTIONS.APPLICATIONS),
    where("studentId", "==", uid),
    where("jobId", "==", jobId)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : snapshot.docs[0];
}

export default function ApplicationButton({ job }) {
  const { currentUser, userProfile } = useAuth();

  // 'checking' | 'idle' | 'applying' | 'applied' | 'blocked' | 'error'
  // 'blocked' = a known, non-Firestore reason we can't apply (no resume, no auth, no job id)
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState(null);

  const isBusy = status === "checking" || status === "applying";

  // On mount (and whenever the job or user changes), find out whether this
  // student has already applied, so the button reflects reality immediately
  // rather than only after a click.
  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (!job?.id) {
        setStatus("blocked");
        setMessage("This job is missing an id, so applications can't be checked.");
        return;
      }
      if (!currentUser?.uid) {
        setStatus("blocked");
        setMessage("Log in as a student to apply.");
        return;
      }

      setStatus("checking");
      try {
        const existing = await findExistingApplication(currentUser.uid, job.id);
        if (cancelled) return;
        if (existing) {
          setStatus("applied");
          setMessage("You have already applied for this drive.");
        } else {
          setStatus("idle");
          setMessage(null);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("ApplicationButton: failed to check existing application:", err);
        setStatus("error");
        setMessage("Couldn't check your application status. Please try again.");
      }
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [job?.id, currentUser?.uid]);

  async function handleApply() {
    if (isBusy || status === "applied") return;

    if (!job?.id) {
      setStatus("blocked");
      setMessage("This job is missing an id, so you can't apply.");
      return;
    }
    if (!currentUser?.uid) {
      setStatus("blocked");
      setMessage("You need to be logged in to apply.");
      return;
    }
    if (!userProfile) {
      setStatus("blocked");
      setMessage("Your profile hasn't finished loading. Please try again in a moment.");
      return;
    }
    if (!userProfile.resumeUrl) {
      setStatus("blocked");
      setMessage("Add a resume link on your profile before applying.");
      return;
    }

    setStatus("applying");
    setMessage(null);

    try {
      // Re-check right before writing, to guard against a duplicate
      // submission from a double click or a second open tab.
      const existing = await findExistingApplication(currentUser.uid, job.id);
      if (existing) {
        setStatus("applied");
        setMessage("You have already applied for this drive.");
        return;
      }

      await addDoc(collection(db, COLLECTIONS.APPLICATIONS), {
        jobId: job.id,
        studentId: currentUser.uid,
        studentName: userProfile.name,
        studentUsn: userProfile.usn,
        studentCgpa: userProfile.cgpa,
        resumeUrl: userProfile.resumeUrl,
        status: "APPLIED",
        appliedAt: serverTimestamp(),
      });

      setStatus("applied");
      setMessage("Application submitted.");
    } catch (err) {
      console.error("ApplicationButton: failed to submit application:", err);
      setStatus("error");
      setMessage("Couldn't submit your application. Please try again.");
    }
  }

  const showRetry = status === "error";

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={handleApply}
        disabled={isBusy || status === "applied" || status === "blocked"}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          status === "applied"
            ? "bg-green-100 text-green-700 cursor-default"
            : status === "blocked"
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400"
        }`}
      >
        {status === "checking" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking...
          </>
        )}
        {status === "applying" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Applying...
          </>
        )}
        {status === "applied" && (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Applied
          </>
        )}
        {(status === "idle" || status === "error" || status === "blocked") && (
          <>
            <Send className="h-4 w-4" />
            Apply Now
          </>
        )}
      </button>

      {message && status === "applied" && (
        <p className="flex items-center gap-1 text-xs text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {message}
        </p>
      )}
      {message && status === "blocked" && (
        <p className="flex items-center gap-1 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {message}
        </p>
      )}
      {message && status === "error" && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {message}
          {showRetry && " Click Apply Now to try again."}
        </p>
      )}
    </div>
  );
}
