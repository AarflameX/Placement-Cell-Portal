import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Profile Incomplete Banner */}
        {isProfileIncomplete && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">
                    Complete your profile to check placement eligibility
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Add your Branch and CGPA to your profile so our automated eligibility engine can highlight drives you qualify for.
                  </p>
                </div>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shrink-0"
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
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Campus Placement Drives
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse upcoming recruitment drives, check your eligibility, and submit your applications.
            </p>
          </div>

          {/* Quick Summary Pill */}
          {!loading && drives.length > 0 && userRole === "student" && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-medium text-blue-800">
                <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                {drives.length} Open {drives.length === 1 ? "Drive" : "Drives"}
              </span>
              {eligibleCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {eligibleCount} Eligible for You
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search & Filter Card (SL-7 & SL-8) */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-4">
            {/* Search Bar (SL-7) */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company name (e.g. Google) or job role (e.g. SDE)..."
                className="block w-full rounded-xl border border-gray-300 pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters Row (SL-8) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filters:</span>
                </div>

                {/* Branch Dropdown */}
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${
                        onlyEligible ? "text-emerald-600" : "text-gray-400"
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
                  className="inline-flex items-center gap-1 self-start sm:self-auto text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
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
          <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing <strong className="text-gray-900">{filteredDrives.length}</strong> of{" "}
              <strong className="text-gray-900">{drives.length}</strong> total drives
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600 font-medium">Filtered results</span>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium text-gray-500">Loading placement drives…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <h3 className="text-sm font-semibold text-red-900">Failed to load drives</h3>
            <p className="mt-1 text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State: No Drives in Database */}
        {!loading && !error && drives.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-xs">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-base font-semibold text-gray-900">
              No Placement Drives Posted Yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              Campus placement drives will appear here once the TPO team publishes them. Please check back soon!
            </p>
          </div>
        )}

        {/* Empty State: No Matching Results */}
        {!loading && !error && drives.length > 0 && filteredDrives.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-xs">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-base font-semibold text-gray-900">
              No Matching Drives Found
            </h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              We couldn&apos;t find any drives matching your search and filter criteria. Try adjusting your filters or search keywords.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
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
