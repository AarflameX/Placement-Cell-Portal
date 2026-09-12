import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Check,
  Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { createJobDrive, validateDriveData } from "./driveService";

const AVAILABLE_BRANCHES = [
  { id: "CSE", name: "Computer Science & Engineering" },
  { id: "ISE", name: "Information Science & Engineering" },
  { id: "AIML", name: "AI & Machine Learning" },
  { id: "AIDS", name: "AI & Data Science" },
  { id: "ECE", name: "Electronics & Communication" },
  { id: "EEE", name: "Electrical & Electronics" },
  { id: "MECH", name: "Mechanical Engineering" },
  { id: "CIVIL", name: "Civil Engineering" },
];

export default function CreateDriveForm() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    companyName: "",
    role: "",
    ctc: "",
    minCgpa: "",
    eligibleBranches: ["CSE", "ISE"],
    deadline: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Validate on change if field has been touched
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (touched[name]) {
      const validation = validateDriveData(updated);
      setErrors((prev) => ({
        ...prev,
        [name]: validation.errors[name] || null,
      }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const validation = validateDriveData(formData);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: validation.errors[fieldName] || null,
    }));
  };

  const toggleBranch = (branchId) => {
    const current = formData.eligibleBranches;
    const exists = current.includes(branchId);
    const updatedBranches = exists
      ? current.filter((b) => b !== branchId)
      : [...current, branchId];

    const updated = { ...formData, eligibleBranches: updatedBranches };
    setFormData(updated);
    setTouched((prev) => ({ ...prev, eligibleBranches: true }));

    const validation = validateDriveData(updated);
    setErrors((prev) => ({
      ...prev,
      eligibleBranches: validation.errors.eligibleBranches || null,
    }));
  };

  const selectAllBranches = () => {
    const all = AVAILABLE_BRANCHES.map((b) => b.id);
    setFormData((prev) => ({ ...prev, eligibleBranches: all }));
    setErrors((prev) => ({ ...prev, eligibleBranches: null }));
  };

  const clearAllBranches = () => {
    setFormData((prev) => ({ ...prev, eligibleBranches: [] }));
    setTouched((prev) => ({ ...prev, eligibleBranches: true }));
    setErrors((prev) => ({
      ...prev,
      eligibleBranches: "Select at least one eligible branch.",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const validation = validateDriveData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      // Scroll to the first error
      const firstErrorKey = Object.keys(validation.errors)[0];
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const createdDrive = await createJobDrive(formData, currentUser);
      setSuccessInfo({
        id: createdDrive.id,
        companyName: formData.companyName,
        role: formData.role,
      });

      // Reset form fields
      setFormData({
        companyName: "",
        role: "",
        ctc: "",
        minCgpa: "",
        eligibleBranches: ["CSE", "ISE"],
        deadline: "",
        description: "",
      });
      setTouched({});
      setErrors({});
    } catch (err) {
      console.error("Failed to post placement drive:", err);
      if (err.validationErrors) {
        setErrors(err.validationErrors);
      } else {
        setSubmitError(err.message || "Failed to create drive. Please verify your connection and permissions.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate min deadline (tomorrow) for the input date picker
  const now = new Date();
  const minDeadlineStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Navigation / Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/tpo/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            TPO Portal
          </span>
        </div>

        {/* Success Banner */}
        {successInfo && (
          <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-green-900">
                  Placement Drive Posted Successfully!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  The recruitment drive for{" "}
                  <span className="font-semibold">{successInfo.companyName}</span> ({successInfo.role})
                  has been published to the students&apos; feed.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSuccessInfo(null)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Post Another Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/tpo/dashboard")}
                    className="inline-flex items-center rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100 transition-colors"
                  >
                    View All Drives
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-white px-6 py-5 sm:px-8">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Post Placement Drive
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill out the details below to announce a new campus recruitment drive. Eligible students will be notified.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Could not create placement drive</p>
                  <p className="mt-0.5 text-xs text-red-600">{submitError}</p>
                </div>
              </div>
            )}

            {/* Row 1: Company Name & Role */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Company Name */}
              <div id="field-companyName">
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    onBlur={() => handleBlur("companyName")}
                    placeholder="e.g. Google, Microsoft, Infosys"
                    className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      touched.companyName && errors.companyName
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-600"
                    }`}
                  />
                </div>
                {touched.companyName && errors.companyName && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.companyName}
                  </p>
                )}
              </div>

              {/* Job Role */}
              <div id="field-role">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Job Role / Designation <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    onBlur={() => handleBlur("role")}
                    placeholder="e.g. Software Development Engineer"
                    className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      touched.role && errors.role
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-600"
                    }`}
                  />
                </div>
                {touched.role && errors.role && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.role}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: CTC & Minimum CGPA */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* CTC (LPA) */}
              <div id="field-ctc">
                <label
                  htmlFor="ctc"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Package / CTC (in LPA) <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="number"
                    id="ctc"
                    name="ctc"
                    step="0.1"
                    min="0.1"
                    max="200"
                    value={formData.ctc}
                    onChange={handleChange}
                    onBlur={() => handleBlur("ctc")}
                    placeholder="e.g. 18.5"
                    className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      touched.ctc && errors.ctc
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-600"
                    }`}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs font-semibold text-gray-500">LPA</span>
                  </div>
                </div>
                {touched.ctc && errors.ctc && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.ctc}
                  </p>
                )}
              </div>

              {/* Minimum CGPA */}
              <div id="field-minCgpa">
                <label
                  htmlFor="minCgpa"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Minimum CGPA Cutoff <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="minCgpa"
                    name="minCgpa"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.minCgpa}
                    onChange={handleChange}
                    onBlur={() => handleBlur("minCgpa")}
                    placeholder="e.g. 7.50"
                    className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      touched.minCgpa && errors.minCgpa
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-600"
                    }`}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs font-semibold text-gray-400">/ 10.0</span>
                  </div>
                </div>
                {touched.minCgpa && errors.minCgpa && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.minCgpa}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Eligible Branches Multi-Select */}
            <div id="field-eligibleBranches" className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Eligible Branches <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllBranches}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllBranches}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AVAILABLE_BRANCHES.map((b) => {
                  const isSelected = formData.eligibleBranches.includes(b.id);
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => toggleBranch(b.id)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-xs"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      title={b.name}
                    >
                      <span>{b.id}</span>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-blue-600" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-gray-300" />
                      )}
                    </button>
                  );
                })}
              </div>

              {touched.eligibleBranches && errors.eligibleBranches && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.eligibleBranches}
                </p>
              )}
            </div>

            {/* Row 4: Application Deadline */}
            <div id="field-deadline" className="pt-2">
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Application Deadline <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm sm:max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  min={minDeadlineStr}
                  value={formData.deadline}
                  onChange={handleChange}
                  onBlur={() => handleBlur("deadline")}
                  className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    touched.deadline && errors.deadline
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-600"
                  }`}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Students will not be able to submit applications after this time.
              </p>
              {touched.deadline && errors.deadline && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.deadline}
                </p>
              )}
            </div>

            {/* Row 5: Job Description & Eligibility Notes (Optional) */}
            <div id="field-description" className="pt-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Job Description & Requirements{" "}
                <span className="text-xs font-normal text-gray-500">(Optional)</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter job roles, selection rounds (Online Test, Tech Interview, HR), bond details, or work locations..."
                  className="block w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/tpo/dashboard")}
                disabled={submitting}
                className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting Drive to Firestore…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Post Placement Drive
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
