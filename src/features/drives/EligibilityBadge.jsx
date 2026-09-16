import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { checkStudentEligibility } from "./driveService";

/**
 * SL-8: Automated Eligibility Badge.
 * Compares student's CGPA & Branch with drive criteria and displays live badge.
 *
 * @param {{ job: Object, showDetails?: boolean }} props
 */
export default function EligibilityBadge({ job, showDetails = false }) {
  const { userProfile, userRole } = useAuth();

  if (userRole === "tpo") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
        <ShieldCheck className="h-3.5 w-3.5" />
        TPO View
      </span>
    );
  }

  const result = checkStudentEligibility(userProfile, job);

  if (result.status === "ELIGIBLE") {
    return (
      <div className="inline-flex flex-col items-start">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Eligible to Apply
        </span>
      </div>
    );
  }

  if (result.status === "PROFILE_INCOMPLETE" || result.status === "NO_PROFILE") {
    return (
      <div className="inline-flex flex-col items-start">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 shadow-xs"
          title="Update your branch and CGPA in your profile to check eligibility"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
          Profile Incomplete
        </span>
        {showDetails && (
          <span className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
            Set Branch & CGPA in profile
          </span>
        )}
      </div>
    );
  }

  // Ineligible states (CGPA_BELOW, BRANCH_INELIGIBLE, BOTH_INELIGIBLE)
  return (
    <div className="inline-flex flex-col items-start">
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 shadow-xs"
        title={result.message}
      >
        <XCircle className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
        {result.status === "CGPA_BELOW" && `CGPA < ${job.minCgpa}`}
        {result.status === "BRANCH_INELIGIBLE" && "Branch Ineligible"}
        {result.status === "BOTH_INELIGIBLE" && "Criteria Not Met"}
      </span>
      {showDetails && (
        <span className="mt-0.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
          {result.message}
        </span>
      )}
    </div>
  );
}
