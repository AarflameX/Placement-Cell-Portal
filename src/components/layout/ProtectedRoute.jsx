import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function LoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
    </div>
  )
}

// Where to send a signed-in user who hit a route their role can't access.
function landingPathForRole(role) {
  if (role === 'tpo') return '/tpo/dashboard'
  if (role === 'student') return '/drives'
  return '/login'
}

/**
 * Wrap any route element that needs auth (and optionally a specific role).
 *
 * Usage:
 *   <Route
 *     path="/drives"
 *     element={
 *       <ProtectedRoute allowedRoles={['student']}>
 *         <Drives />
 *       </ProtectedRoute>
 *     }
 *   />
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser, userRole, loading } = useAuth()

  // Wait for Firebase to resolve initial auth state before deciding
  // anything — otherwise a logged-in user briefly flashes to /login.
  if (loading) {
    return <LoadingSpinner />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={landingPathForRole(userRole)} replace />
  }

  return children
}
