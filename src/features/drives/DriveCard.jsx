import { useState } from "react";
import {
  Building2,
  Briefcase,
  GraduationCap,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import EligibilityBadge from "./EligibilityBadge";
import ApplicationButton from "../applications/ApplicationButton";
import { NoiseBackground } from "../../components/ui/noise-background";

function formatDeadline(deadline, now) {
  if (!deadline) {
    return { isExpired: false, deadlineFormatted: "No deadline specified" };
  }
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return { isExpired: false, deadlineFormatted: "Invalid deadline" };
  }
  return {
    isExpired: deadlineDate.getTime() <= now,
    deadlineFormatted: deadlineDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/**
 * Renders an individual placement drive card with eligibility badge
 * and application button.
 *
 * @param {{ job: Object }} props
 */
export default function DriveCard({ job }) {
  const [showDetails, setShowDetails] = useState(false);
  const [now] = useState(() => Date.now());

  const { isExpired, deadlineFormatted } = formatDeadline(job?.deadline, now);

  return (
    <NoiseBackground
      borderWidth="p-[6px]"
      containerClassName="h-full shadow-xs hover:shadow-md transition-shadow"
      innerClassName="bg-white dark:bg-[#121215]"
      className="flex flex-col justify-between h-full p-5"
    >
      <div>
        {/* Top Bar: Company, Role & Eligibility Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold text-base border border-neutral-200 dark:border-neutral-700 shadow-2xs">
              {job.companyName ? job.companyName.charAt(0).toUpperCase() : "C"}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                {job.companyName || "Unknown Company"}
              </h3>
              <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                <Briefcase className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
                {job.role || "Role not specified"}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <EligibilityBadge job={job} showDetails={true} />
          </div>
        </div>

        {/* Key Metrics: CTC & Min CGPA */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl bg-neutral-100/60 dark:bg-neutral-800/40 p-2.5 text-xs border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-500 dark:text-neutral-400">Package:</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
              {job.ctc ? `${job.ctc} LPA` : "Not disclosed"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Min CGPA: </span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {job.minCgpa !== undefined ? job.minCgpa : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Eligible Branches */}
        <div className="mt-3">
          <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            Eligible Branches:
          </p>
          <div className="flex flex-wrap gap-1">
            {Array.isArray(job.eligibleBranches) && job.eligibleBranches.length > 0 ? (
              job.eligibleBranches.map((b) => (
                <span
                  key={b}
                  className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                >
                  {b}
                </span>
              ))
            ) : (
              <span className="text-xs text-neutral-400 dark:text-neutral-500">All branches</span>
            )}
          </div>
        </div>

        {/* Deadline */}
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {isExpired ? (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Application closed (Deadline passed)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
              <Calendar className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
              Deadline: <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">{deadlineFormatted}</strong>
            </span>
          )}
        </div>

        {/* Expandable Description */}
        {job.description && (
          <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline transition-colors"
            >
              <span>{showDetails ? "Hide Details" : "View Details & Instructions"}</span>
              {showDetails ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {showDetails && (
              <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap rounded-lg bg-neutral-50 dark:bg-neutral-800/60 p-2.5 border border-neutral-200 dark:border-neutral-700">
                {job.description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Section */}
      <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          Campus Drive
        </span>

        <div>
          {isExpired ? (
            <button
              type="button"
              disabled
              className="rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
            >
              Deadline Closed
            </button>
          ) : (
            <ApplicationButton job={job} />
          )}
        </div>
      </div>
    </NoiseBackground>
  );
}
