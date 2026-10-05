import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '../context/AuthContext'

function rolePath(role) {
  return role ? `/${role.toLowerCase()}` : '/login'
}

function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="p-8 text-slate-600">Loading...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={rolePath(user.role)} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
