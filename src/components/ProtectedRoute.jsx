import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// roles opcional: ['administrador'] -> solo esos roles entran a la ruta
export default function ProtectedRoute({ roles }) {
  const { isAuth, user } = useAuth()
  const loc = useLocation()
  if (!isAuth) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/semilleros" replace />
  return <Outlet />
}
