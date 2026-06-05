import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import KitchensPage from '../pages/KitchensPage'
import UsersPage from '../pages/UsersPage'
import MenusPage from '../pages/MenusPage'
import SuppliersPage from '../pages/SuppliersPage'
import ItemCategoriesPage from '../pages/ItemCategoriesPage'
import FinancePage from '../pages/FinancePage'
import TrackingPage from '../pages/TrackingPage'
import CourierPage from '../pages/CourierPage'
import { getDefaultRouteByRole, MENU_ACCESS, normalizeRole } from '../utils/roles'

function getRole() {
  try {
    return normalizeRole(JSON.parse(localStorage.getItem('user') || '{}')?.role_name)
  } catch {
    return ''
  }
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

function RoleRoute({ path, children }) {
  const role = getRole()
  const allowed = MENU_ACCESS[path] || []
  if (!allowed.includes(role)) {
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
        <Route index element={<RoleRoute path="/"><DashboardPage /></RoleRoute>} />
        <Route path="kitchens" element={<RoleRoute path="/kitchens"><KitchensPage /></RoleRoute>} />
        <Route path="users" element={<RoleRoute path="/users"><UsersPage /></RoleRoute>} />
        <Route path="menus" element={<RoleRoute path="/menus"><MenusPage /></RoleRoute>} />
        <Route path="item-categories" element={<RoleRoute path="/item-categories"><ItemCategoriesPage /></RoleRoute>} />
        <Route path="suppliers" element={<RoleRoute path="/suppliers"><SuppliersPage /></RoleRoute>} />
        <Route path="finance" element={<RoleRoute path="/finance"><FinancePage /></RoleRoute>} />
        <Route path="tracking" element={<RoleRoute path="/tracking"><TrackingPage /></RoleRoute>} />
        <Route path="courier" element={<RoleRoute path="/courier"><CourierPage /></RoleRoute>} />
      </Route>
    </Routes>
  )
}
