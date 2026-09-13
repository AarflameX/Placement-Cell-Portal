import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
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

const BRANCHES = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AIML"];

/**
 * Validates the editable profile fields.
 * @param {{ usn: string, branch: string, cgpa: string }} fields
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateProfileFields({ usn, branch, cgpa }) {
  const errors = {};

  if (!usn || !usn.trim()) {
    errors.usn = "USN is required.";
  }

  if (!branch || !BRANCHES.includes(branch)) {
    errors.branch = "Please select a valid branch.";
  }

  const cgpaNum = Number(cgpa);
  if (cgpa === "" || cgpa === null || Number.isNaN(cgpaNum)) {
    errors.cgpa = "CGPA is required.";
  } else if (cgpaNum < 0 || cgpaNum > 10) {
    errors.cgpa = "CGPA must be between 0.0 and 10.0.";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export default function StudentProfile() {
  const { currentUser, userProfile, loading, refreshUserProfile } = useAuth();

  const [usn, setUsn] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Hydrate the editable fields whenever userProfile (re)loads, so a
  // refreshUserProfile() call after save reflects back into the form.
  useEffect(() => {
    if (userProfile) {
      setUsn(userProfile.usn ?? "");
      setBranch(userProfile.branch ?? "");
      setCgpa(
        userProfile.cgpa !== undefined && userProfile.cgpa !== null
          ? String(userProfile.cgpa)
          : ""
      );
    }
  }, [userProfile]);

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

    const { isValid, errors } = validateProfileFields({ usn, branch, cgpa });
    setFieldErrors(errors);
    if (!isValid) return;

    if (!currentUser?.uid) {
      setSubmitError("You need to be logged in to update your profile.");
      return;
    }

    setIsSaving(true);
    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      await updateDoc(userDocRef, {
        usn: usn.trim(),
        branch,
        cgpa: Number(cgpa),
      });

      await refreshUserProfile?.();
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSubmitError("Couldn't update your profile. Please try again.");
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
        <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Keep your academic details up to date — the placement cell uses this
          when checking eligibility for drives.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {successMessage && (
          <p className="mb-4 flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            {successMessage}
          </p>
        )}
        {submitError && (
          <p className="mb-4 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {submitError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Read-only: Full Name */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={userProfile?.name ?? ""}
                disabled
                readOnly
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-sm text-gray-600"
              />
            </div>
          </div>

          {/* Read-only: Email */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                value={userProfile?.email ?? currentUser?.email ?? ""}
                disabled
                readOnly
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-sm text-gray-600"
              />
            </div>
          </div>

          {/* Editable: USN */}
          <div className="mb-4">
            <label htmlFor="usn" className="mb-1.5 block text-sm font-medium text-gray-700">
              USN
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Hash className="h-4 w-4 text-gray-400" />
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
                className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 ${
                  fieldErrors.usn
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                }`}
              />
            </div>
            {fieldErrors.usn && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.usn}
              </p>
            )}
          </div>

          {/* Editable: Branch */}
          <div className="mb-4">
            <label htmlFor="branch" className="mb-1.5 block text-sm font-medium text-gray-700">
              Branch
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <GraduationCap className="h-4 w-4 text-gray-400" />
              </div>
              <select
                id="branch"
                value={branch}
                disabled={isSaving}
                onChange={(e) => {
                  setBranch(e.target.value);
                  clearFieldError("branch");
                }}
                className={`block w-full appearance-none rounded-lg border bg-white pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 ${
                  fieldErrors.branch
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                }`}
              >
                <option value="" disabled>
                  Select branch
                </option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            {fieldErrors.branch && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.branch}
              </p>
            )}
          </div>

          {/* Editable: CGPA */}
          <div className="mb-6">
            <label htmlFor="cgpa" className="mb-1.5 block text-sm font-medium text-gray-700">
              CGPA
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <BadgeCheck className="h-4 w-4 text-gray-400" />
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
                className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 ${
                  fieldErrors.cgpa
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                }`}
              />
            </div>
            {fieldErrors.cgpa && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.cgpa}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>

      {/* Resume section — delegates entirely to the existing ResumeUpload
          component from SL-9; it manages its own save/edit flow and only
          needs the current resumeUrl to hydrate on first mount. */}
      <ResumeUpload initialUrl={userProfile?.resumeUrl} />
    </div>
  );
}
