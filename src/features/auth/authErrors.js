// Maps Firebase Auth error codes to user-friendly messages.
// Keeping this shared between Login.jsx and Register.jsx avoids duplicating
// the same switch statement in both files.

export function getAuthErrorMessage(error) {
  const code = error?.code || '';

  switch (code) {
    case 'custom/no-account-found':
      return 'No account found with this Google email. Please create an account on the sign-up page first.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/invalid-email':
      return 'That email address looks invalid. Please check and try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account found with these credentials.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in attempt is already in progress.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
