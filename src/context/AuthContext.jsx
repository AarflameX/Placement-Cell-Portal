import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { COLLECTIONS } from '../types/schema'
import { signInWithGoogle } from '../features/auth/googleAuth'

const AuthContext = createContext(null)

/**
 * Hook for consuming auth state anywhere in the tree.
 * Throws if used outside <AuthProvider> so misuse fails loudly in dev.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  // Pull the Firestore users/{uid} doc and sync profile + role state.
  async function fetchUserProfile(uid) {
    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const profileData = userDocSnap.data()
        setUserProfile(profileData)
        setUserRole(profileData.role ?? null)
      } else {
        // Auth account exists but no Firestore profile yet — e.g. the
        // Firestore write from Register.jsx hasn't landed, or the user
        // signed up with Google and profile creation is still pending.
        setUserProfile(null)
        setUserRole(null)
      }
    } catch (error) {
      console.error('AuthContext: failed to fetch user profile:', error)
      setUserProfile(null)
      setUserRole(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true)

      if (user) {
        setCurrentUser(user)
        await fetchUserProfile(user.uid)
      } else {
        setCurrentUser(null)
        setUserProfile(null)
        setUserRole(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    return signOut(auth)
  }

  // Delegates to features/auth/googleAuth.js, which handles the popup AND
  // creates the users/{uid} profile doc on a brand-new Google sign-in.
  // onAuthStateChanged above will pick up the resulting auth + profile
  // state automatically; the returned role is handed back too in case a
  // caller wants to redirect immediately without waiting on that listener.
  async function loginWithGoogle(defaultRole = 'student') {
    return signInWithGoogle(defaultRole)
  }

  // Lets pages re-pull the profile after e.g. onboarding writes a role.
  async function refreshUserProfile() {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid)
    }
  }

  const value = {
    currentUser,
    userProfile,
    userRole,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
    refreshUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
