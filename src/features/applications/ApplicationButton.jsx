import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { checkStudentEligibility } from "../drives/driveService";

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
    if (!userProfile.usn?.trim() || !userProfile.branch?.trim() || !userProfile.cgpa) {
      setStatus("blocked");
      setMessage("Please complete your profile (USN, Branch, CGPA) before applying.");
      return;
    }
    if (!userProfile.resumeUrl) {
      setStatus("blocked");
      setMessage("Add a resume link on your profile before applying.");
      return;
    }

    const eligibility = checkStudentEligibility(userProfile, job);
    if (!eligibility.isEligible) {
      setStatus("blocked");
      setMessage(eligibility.message);
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
        companyName: job.companyName || "",
        role: job.role || "",
        studentId: currentUser.uid,
        studentName: userProfile.name || "",
        studentUsn: userProfile.usn || "",
        studentCgpa: userProfile.cgpa || 0,
        studentBranch: userProfile.branch || "",
        branch: userProfile.branch || "",
        resumeUrl: userProfile.resumeUrl || "",
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
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium shadow-xs transition-all ${
          status === "applied"
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 cursor-default"
            : status === "blocked"
            ? "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-700/50 cursor-not-allowed"
            : "bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-98 cursor-pointer"
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
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
        <p className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {message}
        </p>
      )}
      {message && status === "blocked" && (
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {message}
          </p>
          {(message.includes("profile") || message.includes("resume")) && (
            <Link
              to="/profile"
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 self-start"
            >
              Update Profile &rarr;
            </Link>
          )}
        </div>
      )}
      {message && status === "error" && (
        <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {message}
          {showRetry && " Click Apply Now to try again."}
        </p>
      )}
    </div>
  );
}
