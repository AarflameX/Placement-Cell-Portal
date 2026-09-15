import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import {
  PlusCircle,
  Briefcase,
  Users,
  ChevronRight,
  Loader2,
  Building2,
} from "lucide-react";
import { db } from "../../services/firebase";
import AnalyticsCards from "./AnalyticsCards";

export default function TpoDashboard() {
  const [drives, setDrives] = useState([]);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to all placement drives
    const unsubJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Sort newest first
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
        const timeB = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;
        return timeB - timeA;
      });

      setDrives(items);
      setLoading(false);
    });

    // 2. Count applicants per drive
    const unsubApplications = onSnapshot(collection(db, "applications"), (snapshot) => {
      const counts = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.jobId) {
          counts[data.jobId] = (counts[data.jobId] || 0) + 1;
        }
      });
      setApplicantCounts(counts);
    });

    return () => {
      unsubJobs();
      unsubApplications();
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      {/* Header & Post Drive CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-3xl">
            TPO Placement Overview
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Monitor active recruitment drives, track candidate metrics, and review applications.
          </p>
        </div>

        <Link
          to="/tpo/create-drive"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2.5 text-sm font-medium shadow-xs hover:opacity-90 active:scale-98 transition-all shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          Post New Drive
        </Link>
      </div>

      {/* Quick Analytics Cards (SL-14) */}
      <AnalyticsCards />

      {/* Drives Management Section (SL-12 / SL-14) */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Placement Drives Manager
            </h2>
          </div>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {drives.length} Total Drives
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-neutral-500 dark:text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
            Loading drives…
          </div>
        ) : drives.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-700 mb-2" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No drives created yet</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Click &apos;Post New Drive&apos; above to publish your first drive.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
              <thead className="bg-neutral-50/80 dark:bg-neutral-900/50 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Company & Role</th>
                  <th className="px-4 py-3 text-left">Package (CTC)</th>
                  <th className="px-4 py-3 text-left">Cutoff (CGPA)</th>
                  <th className="px-4 py-3 text-left">Eligible Branches</th>
                  <th className="px-4 py-3 text-left">Applicants</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {drives.map((drive) => {
                  const count = applicantCounts[drive.id] || 0;
                  return (
                    <tr key={drive.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">{drive.companyName}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{drive.role}</div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                        {drive.ctc ? `${drive.ctc} LPA` : "N/A"}
                      </td>
                      <td className="px-4 py-3.5 text-neutral-700 dark:text-neutral-300 tabular-nums">
                        {drive.minCgpa !== undefined ? drive.minCgpa : "None"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {Array.isArray(drive.eligibleBranches) && drive.eligibleBranches.length > 0 ? (
                            drive.eligibleBranches.slice(0, 3).map((b) => (
                              <span key={b} className="rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
                                {b}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">All</span>
                          )}
                          {drive.eligibleBranches?.length > 3 && (
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">+{drive.eligibleBranches.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                          count > 0
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60"
                        }`}>
                          <Users className="h-3 w-3" />
                          {count}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/tpo/drives/${drive.id}/applicants`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          View Applicants
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
