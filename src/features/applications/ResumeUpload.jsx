import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Pencil,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firebase";
import { COLLECTIONS } from "../../types/schema";

/**
 * Central resume-links Google Doc. Maintained manually by the team — this
 * app only opens it in a new tab and never reads, writes, or modifies it.
 */
const CENTRAL_RESUME_DOC_URL =
  "https://docs.google.com/document/d/1SuNqbFvL2Xn2mCYTKWEtxiGwOJQKlT_vKR_amN0k7V0/edit?usp=sharing";

/**
 * Validates a resume URL.
 * @param {string} url
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateResumeUrl(url) {
  const trimmed = (url ?? "").trim();
  if (!trimmed) {
    return { isValid: false, error: "Please paste a link to your resume." };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { isValid: false, error: "The link must start with http:// or https://." };
  }

  return { isValid: true, error: null };
}

/**
 * @param {Object} props
 * @param {string} [props.initialUrl] - Existing resumeUrl from the student's
 *   Firestore profile, if any. Pre-populates the input AND the saved/confirmed
 *   view on first mount only — later edits are never overwritten by this prop.
 */
export default function ResumeUpload({ initialUrl = "" }) {
  const { currentUser, refreshUserProfile } = useAuth();

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [validationError, setValidationError] = useState(null);
  // A previously-saved link (from Firestore, via initialUrl) counts as
  // already saved, so returning students land straight on the confirmed view.
  const [savedUrl, setSavedUrl] = useState(initialUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  async function handleSave() {
    const { isValid, error } = validateResumeUrl(urlInput);
    if (!isValid) {
      setValidationError(error);
      setSavedUrl(null);
      return;
    }
    setValidationError(null);
    setSubmitError(null);

    if (!currentUser?.uid) {
      setSubmitError("You need to be logged in to save your resume link.");
      return;
    }

    setIsSaving(true);
    try {
      const trimmedUrl = urlInput.trim();
      const userDocRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      // updateDoc only touches the field(s) passed in — name, email, role,
      // usn, branch, cgpa, and everything else on the profile are untouched.
      await updateDoc(userDocRef, { resumeUrl: trimmedUrl });

      // Let AuthContext's userProfile reflect the new link immediately.
      await refreshUserProfile?.();

      setSavedUrl(trimmedUrl);
    } catch (err) {
      console.error("Failed to save resume link:", err);
      setSubmitError("Couldn't save your resume link. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit() {
    setUrlInput(savedUrl ?? "");
    setSavedUrl(null);
    setValidationError(null);
    setSubmitError(null);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Resume</h2>
          <p className="mt-1 text-sm text-gray-500">
            Paste a link to your resume (e.g. a Google Drive share link). You're
            providing a link to a resume that's already hosted somewhere — this
            app does not upload, store, or host your resume file.
          </p>
        </div>

        <div className="mb-5 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <FileSpreadsheet className="h-4 w-4 shrink-0 text-gray-500 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600">
              The team also keeps a central document of everyone's resume links,
              updated manually. This app doesn't read from or write to it.
            </p>
            <a
              href={CENTRAL_RESUME_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Open Central Resume Links Document
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {submitError && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {submitError}
          </p>
        )}

        {!savedUrl ? (
          <>
            <label htmlFor="resume-url" className="block text-sm font-medium text-gray-700 mb-1.5">
              Resume link
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Link2 className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="resume-url"
                type="url"
                inputMode="url"
                value={urlInput}
                disabled={isSaving}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (validationError) setValidationError(null);
                  if (submitError) setSubmitError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                placeholder="https://drive.google.com/file/d/..."
                className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-500 ${
                  validationError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-600"
                }`}
              />
            </div>

            {validationError && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {validationError}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Resume Link"
              )}
            </button>
          </>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-900">Resume link saved</p>
                <p className="mt-1 break-all text-xs text-green-700">{savedUrl}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={savedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Open Resume
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
