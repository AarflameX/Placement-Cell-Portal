import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { COLLECTIONS } from '../../types/schema';

const googleProvider = new GoogleAuthProvider();

/**
 * Signs the user in with a Google popup. If this is their first time
 * (no users/{uid} doc yet), initializes their profile with `defaultRole`.
 * If a profile already exists, their existing role is returned untouched
 * — a returning user's role can't be changed by picking a dropdown value
 * on the login screen.
 *
 * @param {'student' | 'tpo'} defaultRole - role to assign for a brand-new profile
 * @returns {Promise<string>} the user's role, for redirect decisions
 */
export async function signInWithGoogle(defaultRole = 'student') {
  const result = await signInWithPopup(auth, googleProvider);
  const { uid, displayName, email } = result.user;

  const userDocRef = doc(db, COLLECTIONS.USERS, uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    return userSnap.data().role;
  }

  await setDoc(userDocRef, {
    uid,
    name: displayName || '',
    email: email || '',
    role: defaultRole,
    usn: '',
    branch: '',
    cgpa: 0,
    createdAt: new Date(),
  });

  return defaultRole;
}
