import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import {
  User,
  Mail,
  Hash,
  GraduationCap,
  BadgeCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firebase";
import { COLLECTIONS } from "../../types/schema";
import ResumeUpload from "../applications/ResumeUpload";

const BRANCHES = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AIML", "AIDS"];

/**
 * Validates the profile fields.
 * Allows partial saving so students can update fields progressively,
 * but validates format and ranges when values are supplied.
 * @param {{ branch: string, cgpa: string }} fields
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
function validateProfileFields({ branch, cgpa }) {
  const errors = {};

  if (branch && !BRANCHES.includes(branch)) {
    errors.branch = "Please select a valid branch.";
  }

  if (cgpa !== "" && cgpa !== null && cgpa !== undefined) {
    const normalized = String(cgpa).trim().replace(",", ".");
    const cgpaNum = Number(normalized);
    if (Number.isNaN(cgpaNum)) {
      errors.cgpa = "Please enter a valid numeric CGPA.";
    } else if (cgpaNum < 0 || cgpaNum > 10) {
      errors.cgpa = "CGPA must be between 0.0 and 10.0.";
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export default function StudentProfile() {
  const { currentUser, userProfile, loading, refreshUserProfile } = useAuth();

  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Hydrate editable fields once auth + profile loading completes without overwriting user input
  useEffect(() => {
    if (!loading && (userProfile || currentUser) && !hasHydrated) {
      setName(userProfile?.name ?? currentUser?.displayName ?? "");
      setUsn(userProfile?.usn ?? "");
      setBranch(userProfile?.branch ?? "");
      setCgpa(
        userProfile?.cgpa !== undefined && userProfile?.cgpa !== null && userProfile?.cgpa !== 0
          ? String(userProfile.cgpa)
          : ""
      );
      setHasHydrated(true);
    }
  }, [loading, userProfile, currentUser, hasHydrated]);

  function clearFieldError(field) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMessage(null);
    setSubmitError(null);

    const { isValid, errors } = validateProfileFields({ branch, cgpa });
    setFieldErrors(errors);
    if (!isValid) {
      setSubmitError("Please correct the highlighted errors before saving.");
      return;
    }

    if (!currentUser?.uid) {
      setSubmitError("You need to be logged in to update your profile.");
      return;
    }

    setIsSaving(true);
    try {
      let parsedCgpa = 0;
      if (cgpa !== "" && cgpa !== null && cgpa !== undefined) {
        const normalized = String(cgpa).trim().replace(",", ".");
        const num = Number(normalized);
        parsedCgpa = Number.isNaN(num) ? 0 : Math.round(num * 100) / 100;
      }

      const userDocRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      const updatedData = {
        uid: currentUser.uid,
        name: (name || "").trim() || userProfile?.name || currentUser.displayName || "",
        email: currentUser.email || userProfile?.email || "",
        role: userProfile?.role || "student",
        usn: (usn || "").trim().toUpperCase(),
        branch: branch || "",
        cgpa: parsedCgpa,
        updatedAt: new Date(),
      };

      // setDoc with merge: true handles both initial creation and update safely
      await setDoc(userDocRef, updatedData, { merge: true });

      // Refresh AuthContext profile
      await refreshUserProfile?.(currentUser.uid);

      const isIncomplete = !updatedData.usn || !updatedData.branch || !updatedData.cgpa;
      if (isIncomplete) {
        setSuccessMessage(
          "Profile saved. Note: USN, Branch, and CGPA are required before applying to campus recruitment drives."
        );
      } else {
        setSuccessMessage("Profile updated successfully.");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSubmitError(err?.message || "Couldn't update your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // While AuthContext is still resolving the initial auth + profile fetch.
  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Save your academic details anytime. Your USN, Branch, and CGPA are used to check eligibility and submit drive applications.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] p-6 sm:p-7 shadow-xs">
        {successMessage && (
          <p className="mb-4 flex items-center gap-1.5 rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 px-3.5 py-2 text-xs text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
            {successMessage}
          </p>
        )}
        {submitError && (
          <p className="mb-4 flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3.5 py-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
            {submitError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Editable: Full Name */}
          <div className="mb-4">
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Full Name
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              </div>
              <input
                id="fullName"
                type="text"
                value={name}
                disabled={isSaving}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                }}
                placeholder="Jane Doe"
                className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 disabled:bg-neutral-100/60 dark:disabled:bg-neutral-800/40 disabled:text-neutral-500 ${
                  fieldErrors.name
                    ? "border-red-300 dark:border-red-800 focus:ring-red-500"
                    : "border-neutral-300 dark:border-neutral-700 focus:border-blue-600 focus:ring-blue-600"
                }`}
              />
            </div>
            {fieldErrors.name && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.name}
              </p>
            )}
          </div>


          {/* Read-only: Email */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              </div>
              <input
                type="email"
                value={userProfile?.email ?? currentUser?.email ?? ""}
                disabled
                readOnly
                className="block w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-800/40 pl-10 pr-3 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Editable: USN */}
          <div className="mb-4">
            <label htmlFor="usn" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              USN
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Hash className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              </div>
              <input
                id="usn"
                type="text"
                value={usn}
                disabled={isSaving}
                onChange={(e) => {
                  setUsn(e.target.value);
                  clearFieldError("usn");
                }}
                placeholder="1XX21CSXXX"
                className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 disabled:bg-neutral-100/60 dark:disabled:bg-neutral-800/40 disabled:text-neutral-500 ${
                  fieldErrors.usn
                    ? "border-red-300 dark:border-red-800 focus:ring-red-500"
                    : "border-neutral-300 dark:border-neutral-700 focus:border-blue-600 focus:ring-blue-600"
                }`}
              />
            </div>
            {fieldErrors.usn && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.usn}
              </p>
            )}
          </div>

          {/* Editable: Branch */}
          <div className="mb-4">
            <label htmlFor="branch" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Branch
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <GraduationCap className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              </div>
              <select
                id="branch"
                value={branch}
                disabled={isSaving}
                onChange={(e) => {
                  setBranch(e.target.value);
                  clearFieldError("branch");
                }}
                className={`block w-full appearance-none rounded-lg border bg-white dark:bg-neutral-900 pl-10 pr-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 disabled:bg-neutral-100/60 dark:disabled:bg-neutral-800/40 disabled:text-neutral-500 ${
                  fieldErrors.branch
                    ? "border-red-300 dark:border-red-800 focus:ring-red-500"
                    : "border-neutral-300 dark:border-neutral-700 focus:border-blue-600 focus:ring-blue-600"
                }`}
              >
                <option value="" className="bg-white dark:bg-neutral-900 text-neutral-500">
                  Select branch
                </option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                    {b}
                  </option>
                ))}
              </select>
            </div>
            {fieldErrors.branch && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.branch}
              </p>
            )}
          </div>

          {/* Editable: CGPA */}
          <div className="mb-6">
            <label htmlFor="cgpa" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              CGPA
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <BadgeCheck className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              </div>
              <input
                id="cgpa"
                type="number"
                inputMode="decimal"
                min="0"
                max="10"
                step="0.01"
                value={cgpa}
                disabled={isSaving}
                onChange={(e) => {
                  setCgpa(e.target.value);
                  clearFieldError("cgpa");
                }}
                placeholder="e.g. 8.42"
                className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 disabled:bg-neutral-100/60 dark:disabled:bg-neutral-800/40 disabled:text-neutral-500 ${
                  fieldErrors.cgpa
                    ? "border-red-300 dark:border-red-800 focus:ring-red-500"
                    : "border-neutral-300 dark:border-neutral-700 focus:border-blue-600 focus:ring-blue-600"
                }`}
              />
            </div>
            {fieldErrors.cgpa && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.cgpa}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-5 py-2.5 text-sm font-medium shadow-xs hover:opacity-90 active:scale-98 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>

      {/* Resume section */}
      <ResumeUpload initialUrl={userProfile?.resumeUrl} />
    </div>
  );
}
