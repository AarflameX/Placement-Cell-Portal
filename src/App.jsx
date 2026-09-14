import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './features/auth/Login'
import Register from './features/auth/Register'
import { CreateDriveForm, DriveList } from './features/drives'
import { MyApplications } from './features/applications'
import StudentProfile from './features/profile/StudentProfile'
import AnalyticsCards from './features/tpo/AnalyticsCards'
import ApplicantTable from './features/tpo/ApplicantTable'



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
                <DriveList />
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
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* TPO protected routes */}
          <Route
            path="/tpo/dashboard"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <AnalyticsCards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpo/create-drive"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <CreateDriveForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpo/drives/:jobId/applicants"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <ApplicantTable />
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
