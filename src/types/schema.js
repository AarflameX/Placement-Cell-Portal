export const COLLECTIONS = {
  USERS: 'users',
  JOBS: 'jobs',
  APPLICATIONS: 'applications'
};

/**
 * FIRESTORE DATA SCHEMA REFERENCE
 *
 * 1. Collection: "users" (Dev 1 writes on Auth/Profile, Dev 3 updates resumeUrl)
 *    - uid: string (Firebase Auth UID)
 *    - name: string
 *    - email: string
 *    - role: 'student' | 'tpo'
 *    - usn: string
 *    - branch: string
 *    - cgpa: number
 *    - resumeUrl: string (Google Drive link)
 *
 * 2. Collection: "jobs" (Dev 2 writes on Post Drive, Dev 2 & 4 read)
 *    - id: string
 *    - companyName: string
 *    - role: string
 *    - ctc: number (LPA)
 *    - minCgpa: number
 *    - eligibleBranches: array (e.g. ['CSE', 'ISE'])
 *    - deadline: string / timestamp
 *
 * 3. Collection: "applications" (Dev 3 writes on Apply, Dev 4 updates status)
 *    - id: string
 *    - jobId: string
 *    - studentId: string
 *    - studentName: string
 *    - studentUsn: string
 *    - studentCgpa: number
 *    - resumeUrl: string (copied from student profile)
 *    - status: 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'INTERVIEW' | 'SELECTED'
 *    - appliedAt: timestamp
 */