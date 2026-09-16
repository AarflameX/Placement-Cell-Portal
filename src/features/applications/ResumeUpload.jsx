import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
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
import { validateResumeUrl } from "./resumeValidation";

/**
 * Central resume-links Google Doc. Maintained manually by the team — this
 * app only opens it in a new tab and never reads, writes, or modifies it.
 */
const CENTRAL_RESUME_DOC_URL =
  "https://docs.google.com/document/d/1SuNqbFvL2Xn2mCYTKWEtxiGwOJQKlT_vKR_amN0k7V0/edit?usp=sharing";

/**
 * @param {Object} props
 * @param {string} [props.initialUrl] - Existing resumeUrl from the student's
 *   Firestore profile, if any.
 */
export default function ResumeUpload({ initialUrl = "" }) {
  const { currentUser, refreshUserProfile } = useAuth();

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [validationError, setValidationError] = useState(null);
  const [savedUrl, setSavedUrl] = useState(initialUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (initialUrl) {
      setUrlInput(initialUrl);
      setSavedUrl(initialUrl);
    }
  }, [initialUrl]);

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
      await setDoc(userDocRef, { resumeUrl: trimmedUrl }, { merge: true });

      // Let AuthContext's userProfile reflect the new link immediately.
      await refreshUserProfile?.(currentUser.uid);

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
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] p-6 sm:p-7 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Resume</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Paste a link to your resume (e.g. a Google Drive share link). You're
            providing a link to a resume that's already hosted somewhere — this
            app does not upload, store, or host your resume file.
          </p>
        </div>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-3.5">
          <FileSpreadsheet className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              The team also keeps a central document of everyone's resume links,
              updated manually. This app doesn't read from or write to it.
            </p>
            <a
              href={CENTRAL_RESUME_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Open Central Resume Links Document
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {submitError && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3.5 py-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
            {submitError}
          </p>
        )}

        {!savedUrl ? (
          <>
            <label htmlFor="resume-url" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Resume link
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Link2 className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
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
                className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-neutral-100/60 dark:disabled:bg-neutral-800/40 disabled:text-neutral-500 ${
                  validationError
                    ? "border-red-300 dark:border-red-800 focus:ring-red-500"
                    : "border-neutral-300 dark:border-neutral-700 focus:border-blue-600"
                }`}
              />
            </div>

            {validationError && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {validationError}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-5 py-2.5 text-sm font-medium shadow-xs hover:opacity-90 active:scale-98 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 transition-all cursor-pointer"
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
          <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/80 dark:bg-green-950/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Resume link saved</p>
                <p className="mt-1 break-all text-xs text-green-700 dark:text-green-300">{savedUrl}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={savedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Open Resume
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
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
