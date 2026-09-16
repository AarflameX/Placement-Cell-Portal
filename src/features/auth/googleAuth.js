import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { COLLECTIONS } from '../../types/schema';

const googleProvider = new GoogleAuthProvider();

/**
 * Signs the user in with a Google popup.
 *
 * - When mode is 'login': If the user has not signed up yet (no users/{uid} document),
 *   it immediately signs them out and throws an error so they don't get trapped in
 *   a half-authenticated state without a role.
 * - When mode is 'register': If the user does not have a profile, it creates one
 *   with the chosen `role`. If they already have an account, it preserves their existing role.
 *
 * @param {'login' | 'register'} mode - 'login' to authenticate existing users, 'register' to onboard new ones
 * @param {'student' | 'tpo'} role - Chosen role if onboarding a new profile
 * @returns {Promise<{ uid: string, role: string, isNew: boolean }>}
 */
export async function signInWithGoogle(mode = 'login', role = 'student') {
  const result = await signInWithPopup(auth, googleProvider);
  const { uid, displayName, email } = result.user;

  const userDocRef = doc(db, COLLECTIONS.USERS, uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    const existingData = userSnap.data();
    return { uid, role: existingData.role || 'student', isNew: false };
  }

  // Account does not exist in Firestore
  if (mode === 'login') {
    // Disallow auto-creating unassigned accounts on login page.
    // Sign out to clean up the ephemeral Auth session.
    await signOut(auth);
    const err = new Error('NO_ACCOUNT_FOUND');
    err.code = 'custom/no-account-found';
    throw err;
  }

  // Mode is 'register': create the profile with the selected role
  await setDoc(userDocRef, {
    uid,
    name: displayName || '',
    email: email || '',
    role: role || 'student',
    usn: '',
    branch: '',
    cgpa: 0,
    createdAt: new Date(),
  });

  return { uid, role: role || 'student', isNew: true };
}
