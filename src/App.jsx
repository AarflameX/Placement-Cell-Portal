import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './features/auth/Login'
import Register from './features/auth/Register'

// --- Placeholder stub pages ----------------------------------------------
// These exist purely so routing + guards can be exercised end-to-end
// before the real feature components land. Swap each import out for the
// real component as its ticket ships — the route wiring below won't need
// to change.

// TODO(drives/applications tickets): src/features/drives/Drives.jsx, etc.
function Drives() {
  return <div className="p-6">Drives (student) — placeholder</div>
}
function MyApplications() {
  return <div className="p-6">My Applications — placeholder</div>
}

// TODO(SL-x, Dev1/Profile): src/features/profile/Profile.jsx
function Profile() {
  return <div className="p-6">Profile — placeholder</div>
}

// TODO(tpo tickets): src/features/tpo/*.jsx
function TpoDashboard() {
  return <div className="p-6">TPO Dashboard — placeholder</div>
}
function TpoCreateDrive() {
  return <div className="p-6">TPO Create Drive — placeholder</div>
}
function TpoDriveApplicants() {
  return <div className="p-6">TPO Drive Applicants — placeholder</div>
}
// --------------------------------------------------------------------------

// Sends "/" to the right place based on auth + role, once loading resolves.
function RootRedirect() {
  const { currentUser, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    )
  }

  if (!currentUser) return <Navigate to="/login" replace />
  if (userRole === 'tpo') return <Navigate to="/tpo/dashboard" replace />
  if (userRole === 'student') return <Navigate to="/drives" replace />

  // Signed in but role hasn't resolved (e.g. missing Firestore profile) —
  // send back to login rather than looping on an unroutable state.
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student protected routes */}
          <Route
            path="/drives"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Drives />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-applications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* TPO protected routes */}
          <Route
            path="/tpo/dashboard"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <TpoDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpo/create-drive"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <TpoCreateDrive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpo/drives/:jobId/applicants"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <TpoDriveApplicants />
              </ProtectedRoute>
            }
          />

          {/* Unknown paths fall back through RootRedirect's role logic */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
