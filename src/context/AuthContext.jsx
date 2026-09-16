import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
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
        return profileData
      } else {
        setUserProfile(null)
        setUserRole(null)
        return null
      }
    } catch (error) {
      console.error('AuthContext: failed to fetch user profile:', error)
      setUserProfile(null)
      setUserRole(null)
      return null
    }
  }

  useEffect(() => {
    let unsubscribeDoc = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true)

      if (unsubscribeDoc) {
        unsubscribeDoc()
        unsubscribeDoc = null
      }

      if (user) {
        setCurrentUser(user)
        // Initial fetch
        await fetchUserProfile(user.uid)

        // Real-time listener for any profile updates across the app
        const userDocRef = doc(db, COLLECTIONS.USERS, user.uid)
        unsubscribeDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data()
              setUserProfile(profileData)
              setUserRole(profileData.role ?? null)
            }
          },
          (error) => {
            console.error('AuthContext user snapshot error:', error)
          }
        )
      } else {
        setCurrentUser(null)
        setUserProfile(null)
        setUserRole(null)
      }

      setLoading(false)
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeDoc) {
        unsubscribeDoc()
      }
    }
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

  async function loginWithGoogle(mode = 'login', role = 'student') {
    return signInWithGoogle(mode, role)
  }

  // Lets pages re-pull the profile after e.g. onboarding writes a role.
  async function refreshUserProfile(targetUid = null) {
    const uid = targetUid || auth.currentUser?.uid || currentUser?.uid
    if (uid) {
      return await fetchUserProfile(uid)
    }
    return null
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
