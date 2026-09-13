import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase.js";
import { COLLECTIONS } from "../../types/schema.js";

/**
 * Validates drive data before submission.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateDriveData(data) {
  const errors = {};

  // Company Name
  if (!data.companyName || !data.companyName.trim()) {
    errors.companyName = "Company name is required.";
  } else if (data.companyName.trim().length < 2) {
    errors.companyName = "Company name must be at least 2 characters.";
  }

  // Role
  if (!data.role || !data.role.trim()) {
    errors.role = "Job role/title is required.";
  } else if (data.role.trim().length < 2) {
    errors.role = "Job role must be at least 2 characters.";
  }

  // CTC (LPA)
  const ctcNum = parseFloat(data.ctc);
  if (data.ctc === undefined || data.ctc === null || data.ctc === "" || isNaN(ctcNum)) {
    errors.ctc = "Valid CTC in LPA is required.";
  } else if (ctcNum <= 0) {
    errors.ctc = "CTC must be greater than 0 LPA.";
  } else if (ctcNum > 200) {
    errors.ctc = "CTC cannot exceed 200 LPA.";
  }

  // Minimum CGPA
  const cgpaNum = parseFloat(data.minCgpa);
  if (data.minCgpa === undefined || data.minCgpa === null || data.minCgpa === "" || isNaN(cgpaNum)) {
    errors.minCgpa = "Minimum CGPA is required.";
  } else if (cgpaNum < 0 || cgpaNum > 10) {
    errors.minCgpa = "CGPA must be between 0.0 and 10.0.";
  }

  // Eligible Branches
  if (!Array.isArray(data.eligibleBranches) || data.eligibleBranches.length === 0) {
    errors.eligibleBranches = "Select at least one eligible branch.";
  }

  // Deadline
  if (!data.deadline) {
    errors.deadline = "Application deadline is required.";
  } else {
    const deadlineDate = new Date(data.deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.deadline = "Please provide a valid deadline date.";
    } else if (deadlineDate.getTime() <= Date.now()) {
      errors.deadline = "Deadline must be a future date and time.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Creates a new placement drive record in Firestore 'jobs' collection.
 * SL-6: Connect drive form submit to Firestore `jobs` collection.
 *
 * @param {Object} driveData
 * @param {Object} [currentUser]
 * @returns {Promise<{ id: string }>}
 */
export async function createJobDrive(driveData, currentUser = null) {
  const validation = validateDriveData(driveData);
  if (!validation.isValid) {
    const error = new Error("Validation failed");
    error.validationErrors = validation.errors;
    throw error;
  }

  const payload = {
    companyName: driveData.companyName.trim(),
    role: driveData.role.trim(),
    ctc: Number(parseFloat(driveData.ctc).toFixed(2)),
    minCgpa: Number(parseFloat(driveData.minCgpa).toFixed(2)),
    eligibleBranches: driveData.eligibleBranches,
    deadline: driveData.deadline,
    description: driveData.description ? driveData.description.trim() : "",
    status: "OPEN",
    createdAt: serverTimestamp(),
    createdBy: currentUser?.uid || null,
    createdByEmail: currentUser?.email || null,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.JOBS), payload);
  return { id: docRef.id, ...payload };
}
