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

/**
 * Subscribes in real-time to the 'jobs' collection.
 * Sorts client-side by creation timestamp (newest first).
 *
 * @param {Function} onSuccess - Callback invoked with Array of job objects
 * @param {Function} [onError] - Callback invoked with error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToDrives(onSuccess, onError) {
  const q = collection(db, COLLECTIONS.JOBS);
  return onSnapshot(
    q,
    (snapshot) => {
      const drives = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Sort client-side: newest first
      drives.sort((a, b) => {
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

      onSuccess(drives);
    },
    (err) => {
      console.error("driveService: failed to load placement drives:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Evaluates whether a logged-in student meets the criteria for a job drive.
 * SL-8: Automated Eligibility Checker.
 *
 * @param {Object|null} studentProfile - { cgpa, branch, ... }
 * @param {Object} job - { minCgpa, eligibleBranches, ... }
 * @returns {{ isEligible: boolean, status: string, message: string, details: { meetsCgpa: boolean, meetsBranch: boolean } }}
 */
export function checkStudentEligibility(studentProfile, job) {
  if (!studentProfile) {
    return {
      isEligible: false,
      status: "NO_PROFILE",
      message: "Log in as student to check eligibility",
      details: { meetsCgpa: false, meetsBranch: false },
    };
  }

  const rawCgpa = studentProfile.cgpa;
  const rawBranch = studentProfile.branch;

  const hasCgpa = typeof rawCgpa === "number" && !isNaN(rawCgpa) && rawCgpa > 0;
  const hasBranch = typeof rawBranch === "string" && rawBranch.trim().length > 0;

  if (!hasCgpa && !hasBranch) {
    return {
      isEligible: false,
      status: "PROFILE_INCOMPLETE",
      message: "Update CGPA & Branch in profile",
      details: { meetsCgpa: false, meetsBranch: false },
    };
  }

  const studentCgpa = hasCgpa ? rawCgpa : 0;
  const minCgpa =
    typeof job?.minCgpa === "number"
      ? job.minCgpa
      : parseFloat(job?.minCgpa || 0);
  const meetsCgpa = hasCgpa && studentCgpa >= minCgpa;

  const studentBranch = hasBranch ? rawBranch.toUpperCase().trim() : "";
  const eligibleBranches = Array.isArray(job?.eligibleBranches)
    ? job.eligibleBranches.map((b) => String(b).toUpperCase().trim())
    : [];
  const meetsBranch = hasBranch && eligibleBranches.includes(studentBranch);

  if (meetsCgpa && meetsBranch) {
    return {
      isEligible: true,
      status: "ELIGIBLE",
      message: "Eligible to Apply",
      details: { meetsCgpa, meetsBranch },
    };
  }

  if (!meetsCgpa && !meetsBranch) {
    return {
      isEligible: false,
      status: "BOTH_INELIGIBLE",
      message: `CGPA & Branch not met (Cutoff: ${minCgpa}, Branches: ${eligibleBranches.join(", ")})`,
      details: { meetsCgpa, meetsBranch },
    };
  }

  if (!meetsCgpa) {
    return {
      isEligible: false,
      status: "CGPA_BELOW",
      message: `CGPA below ${minCgpa} (Yours: ${hasCgpa ? studentCgpa : "N/A"})`,
      details: { meetsCgpa, meetsBranch },
    };
  }

  return {
    isEligible: false,
    status: "BRANCH_INELIGIBLE",
    message: `Branch not eligible (${hasBranch ? rawBranch : "N/A"})`,
    details: { meetsCgpa, meetsBranch },
  };
}

