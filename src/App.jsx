import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { MainLayout } from './layouts/MainLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminGlobalPage } from './pages/AdminGlobalPage'
import { AdminMosqueePage } from './pages/AdminMosqueePage'
import { ClientPage } from './pages/ClientPage'
import { HomePage } from './pages/HomePage'
import { LivreurPage } from './pages/LivreurPage'
import { LoginPage } from './pages/LoginPage'
import { ReservationPage } from './pages/ReservationPage'

export function App() {
  return (
    <AuthProvider>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route
            path="/reservation"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ReservationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/espace-client"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/mosquee"
            element={
              <ProtectedRoute allowedRoles={['admin_mosquee']}>
                <AdminMosqueePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/livreur"
            element={
              <ProtectedRoute allowedRoles={['livreur']}>
                <LivreurPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/global"
            element={
              <ProtectedRoute allowedRoles={['admin_global']}>
                <AdminGlobalPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </AuthProvider>
  )
}
