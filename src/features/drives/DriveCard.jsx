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
    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs hover:border-blue-200 hover:shadow-md transition-all">
      <div>
        {/* Top Bar: Company, Role & Eligibility Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-lg border border-blue-100">
              {job.companyName ? job.companyName.charAt(0).toUpperCase() : "C"}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                {job.companyName || "Unknown Company"}
              </h3>
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mt-0.5">
                <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                {job.role || "Role not specified"}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <EligibilityBadge job={job} showDetails={true} />
          </div>
        </div>

        {/* Key Metrics: CTC & Min CGPA */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-lg bg-gray-50 p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-500">Package:</span>
            <span className="font-bold text-gray-900 text-sm">
              {job.ctc ? `${job.ctc} LPA` : "Not disclosed"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-gray-400 shrink-0" />
            <div>
              <span className="text-gray-500">Min CGPA: </span>
              <span className="font-bold text-gray-900">
                {job.minCgpa !== undefined ? job.minCgpa : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Eligible Branches */}
        <div className="mt-3">
          <p className="text-[11px] font-medium text-gray-500 mb-1">
            Eligible Branches:
          </p>
          <div className="flex flex-wrap gap-1">
            {Array.isArray(job.eligibleBranches) && job.eligibleBranches.length > 0 ? (
              job.eligibleBranches.map((b) => (
                <span
                  key={b}
                  className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 border border-gray-200"
                >
                  {b}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">All branches</span>
            )}
          </div>
        </div>

        {/* Deadline */}
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {isExpired ? (
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Application closed (Deadline passed)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              Deadline: <strong className="text-gray-700">{deadlineFormatted}</strong>
            </span>
          )}
        </div>

        {/* Expandable Description */}
        {job.description && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>{showDetails ? "Hide Details" : "View Details & Instructions"}</span>
              {showDetails ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {showDetails && (
              <div className="mt-2 text-xs text-gray-600 whitespace-pre-wrap rounded-lg bg-gray-50 p-2.5 border border-gray-200">
                {job.description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Section */}
      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-400 flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          Campus Drive
        </span>

        <div>
          {isExpired ? (
            <button
              type="button"
              disabled
              className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-400 cursor-not-allowed"
            >
              Deadline Closed
            </button>
          ) : (
            <ApplicationButton job={job} />
          )}
        </div>
      </div>
    </div>
  );
}
