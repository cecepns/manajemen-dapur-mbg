import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import KitchensPage from '../pages/KitchensPage'
import UsersPage from '../pages/UsersPage'
import MenusPage from '../pages/MenusPage'
import SuppliersPage from '../pages/SuppliersPage'
import FinancePage from '../pages/FinancePage'
import TrackingPage from '../pages/TrackingPage'
import CourierPage from '../pages/CourierPage'

function getRole() {
  try {
    return String(JSON.parse(localStorage.getItem('user') || '{}')?.role_name || '').toLowerCase()
  } catch {
    return ''
  }
}

function getDefaultRouteByRole(role) {
  if (role === 'kurir') return '/courier'
  return '/'
}

function isTokenValid() {
  const token = localStorage.getItem('token')
  if (!token || token === 'undefined' || token === 'null') return false

  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    if (!payload?.exp) return false
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

function ProtectedRoute({ children }) {
  return isTokenValid() ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const role = getRole()
  return isTokenValid() ? <Navigate to={getDefaultRouteByRole(role)} replace /> : children
}

function RoleRoute({ allowedRoles, children }) {
  const role = getRole()
  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteByRole(role)} replace />
  }
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={(
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        )}
      />
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        <Route
          index
          element={(
            <RoleRoute allowedRoles={['admin', 'manager', 'staff']}>
              <DashboardPage />
            </RoleRoute>
          )}
        />
        <Route path="kitchens" element={<RoleRoute allowedRoles={['admin']}><KitchensPage /></RoleRoute>} />
        <Route path="users" element={<RoleRoute allowedRoles={['admin']}><UsersPage /></RoleRoute>} />
        <Route path="menus" element={<RoleRoute allowedRoles={['admin', 'manager', 'staff']}><MenusPage /></RoleRoute>} />
        <Route path="suppliers" element={<RoleRoute allowedRoles={['admin', 'manager', 'staff']}><SuppliersPage /></RoleRoute>} />
        <Route path="finance" element={<RoleRoute allowedRoles={['admin', 'manager']}><FinancePage /></RoleRoute>} />
        <Route path="tracking" element={<RoleRoute allowedRoles={['admin', 'manager', 'kurir']}><TrackingPage /></RoleRoute>} />
        <Route path="courier" element={<RoleRoute allowedRoles={['admin', 'manager', 'kurir']}><CourierPage /></RoleRoute>} />
      </Route>
    </Routes>
  )
}
