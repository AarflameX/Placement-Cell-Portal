import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RotateCcw,
  Briefcase,
  AlertCircle,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { subscribeToDrives, checkStudentEligibility } from "./driveService";
import DriveCard from "./DriveCard";
import { SmoothCaretInput } from "../../components/ui/smooth-caret-input";

const BRANCH_OPTIONS = [
  { value: "ALL", label: "All Branches" },
  { value: "CSE", label: "CSE (Computer Science)" },
  { value: "ISE", label: "ISE (Information Science)" },
  { value: "AIML", label: "AIML (AI & ML)" },
  { value: "AIDS", label: "AIDS (AI & Data Science)" },
  { value: "ECE", label: "ECE (Electronics & Comm)" },
  { value: "EEE", label: "EEE (Electrical & Electronics)" },
  { value: "MECH", label: "MECH (Mechanical)" },
  { value: "CIVIL", label: "CIVIL (Civil)" },
];

const CTC_OPTIONS = [
  { value: "0", label: "All Packages (Any CTC)" },
  { value: "5", label: "5+ LPA" },
  { value: "8", label: "8+ LPA" },
  { value: "10", label: "10+ LPA" },
  { value: "15", label: "15+ LPA" },
  { value: "20", label: "20+ LPA" },
];

export default function DriveList() {
  const { userProfile, userRole } = useAuth();

  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States (SL-7 & SL-8)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [minCtcFilter, setMinCtcFilter] = useState("0");
  const [onlyEligible, setOnlyEligible] = useState(false);

  // Subscribe to real-time drives from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToDrives(
      (items) => {
        setDrives(items);
        setLoading(false);
        setError(null);
      },
      (_err) => {
        setError("Could not load placement drives. Please check your connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtered drives based on search query, branch, CTC, and student eligibility
  const filteredDrives = useMemo(() => {
    return drives.filter((job) => {
      // 1. Search filter: company name or role
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const companyMatch = job.companyName?.toLowerCase().includes(q);
        const roleMatch = job.role?.toLowerCase().includes(q);
        if (!companyMatch && !roleMatch) return false;
      }

      // 2. Branch filter
      if (selectedBranch !== "ALL") {
        const branches = Array.isArray(job.eligibleBranches)
          ? job.eligibleBranches.map((b) => String(b).toUpperCase())
          : [];
        if (!branches.includes(selectedBranch.toUpperCase())) return false;
      }

      // 3. Minimum CTC filter
      const targetCtc = parseFloat(minCtcFilter);
      if (targetCtc > 0) {
        const jobCtc = typeof job.ctc === "number" ? job.ctc : parseFloat(job.ctc || 0);
        if (jobCtc < targetCtc) return false;
      }

      // 4. Eligibility filter (SL-8)
      if (onlyEligible) {
        const eligibility = checkStudentEligibility(userProfile, job);
        if (!eligibility.isEligible) return false;
      }

      return true;
    });
  }, [drives, searchQuery, selectedBranch, minCtcFilter, onlyEligible, userProfile]);

  // Statistics for student summary
  const eligibleCount = useMemo(() => {
    if (!userProfile) return 0;
    return drives.filter((j) => checkStudentEligibility(userProfile, j).isEligible).length;
  }, [drives, userProfile]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedBranch !== "ALL" ||
    minCtcFilter !== "0" ||
    onlyEligible;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedBranch("ALL");
    setMinCtcFilter("0");
    setOnlyEligible(false);
  };

  const isProfileIncomplete =
    userRole === "student" &&
    (!userProfile?.branch || !userProfile?.cgpa || userProfile.cgpa === 0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-150">
      <div className="mx-auto max-w-7xl">
        {/* Profile Incomplete Banner */}
        {isProfileIncomplete && (
          <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Complete your profile to check placement eligibility
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Add your Branch and CGPA to your profile so our automated eligibility engine can highlight drives you qualify for.
                  </p>
                </div>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-amber-600 dark:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors shrink-0 shadow-xs"
              >
                Go to Profile
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Campus Placement Drives
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Browse upcoming recruitment drives, check your eligibility, and submit your applications.
            </p>
          </div>

          {/* Quick Summary Pill */}
          {!loading && drives.length > 0 && userRole === "student" && (
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <Briefcase className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                {drives.length} Open {drives.length === 1 ? "Drive" : "Drives"}
              </span>
              {eligibleCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {eligibleCount} Eligible for You
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search & Filter Card (SL-7 & SL-8) */}
        <div className="mb-8 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-4">
            {/* Search Bar with SmoothCaretInput (SL-7) */}
            <div>
              <SmoothCaretInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company name (e.g. Google) or job role (e.g. SDE)..."
                icon={<Search className="h-4 w-4" />}
                clearable
                onClear={() => setSearchQuery("")}
              />
            </div>

            {/* Filters Row (SL-8) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filters:</span>
                </div>

                {/* Branch Dropdown */}
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 shadow-xs focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none"
                >
                  {BRANCH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* CTC Dropdown */}
                <select
                  value={minCtcFilter}
                  onChange={(e) => setMinCtcFilter(e.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 shadow-xs focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none"
                >
                  {CTC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Only Eligible Toggle (SL-8) */}
                {userRole === "student" && (
                  <button
                    type="button"
                    onClick={() => setOnlyEligible(!onlyEligible)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      onlyEligible
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${
                        onlyEligible
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    />
                    Eligible Only
                  </button>
                )}
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 self-start sm:self-auto text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        {!loading && drives.length > 0 && (
          <div className="mb-4 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              Showing <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{filteredDrives.length}</strong> of{" "}
              <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{drives.length}</strong> total drives
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">Filtered results</span>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-400 mb-3" />
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Loading placement drives…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 dark:text-red-400 mb-2" />
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">Failed to load drives</h3>
            <p className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Empty State: No Drives in Database */}
        {!loading && !error && drives.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-12 text-center shadow-xs">
            <Briefcase className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600 mb-3" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              No Placement Drives Posted Yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Campus placement drives will appear here once the TPO team publishes them. Please check back soon!
            </p>
          </div>
        )}

        {/* Empty State: No Matching Results */}
        {!loading && !error && drives.length > 0 && filteredDrives.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-12 text-center shadow-xs">
            <Search className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600 mb-3" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              No Matching Drives Found
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              We couldn&apos;t find any drives matching your search and filter criteria. Try adjusting your filters or search keywords.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear All Filters
            </button>
          </div>
        )}

        {/* Drives Grid */}
        {!loading && !error && filteredDrives.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrives.map((job) => (
              <DriveCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
