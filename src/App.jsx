import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './features/auth/Login'
import Register from './features/auth/Register'
import Navbar from './components/layout/Navbar'
import { CreateDriveForm, DriveList } from './features/drives'
import { MyApplications } from './features/applications'
import StudentProfile from './features/profile/StudentProfile'
import TpoDashboard from './features/tpo/TpoDashboard'
import ApplicantTable from './features/tpo/ApplicantTable'

// Sends "/" to the right place based on auth + role, once loading resolves.
function RootRedirect() {
  const { currentUser, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-50 dark:bg-[#09090b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 dark:border-neutral-700 border-t-blue-600 dark:border-t-blue-500" />
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
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-150">
            <Navbar />
            <main className="flex-1">
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
                    <TpoDashboard />
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
          </main>
        </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
