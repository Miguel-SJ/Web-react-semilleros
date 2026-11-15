import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { nombreCompleto } from '../api/client'

export const Sprout = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 29V15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M16 16C16 10 11 6 4 6c0 6 4 10 12 10Z" fill="currentColor" />
    <path d="M16 13c0-5 4-8 11-8 0 5-3 8-11 8Z" fill="currentColor" opacity=".7" />
  </svg>
)

export default function Layout() {
  const { user, logout, isAdmin, isDocente } = useAuth()
  const links = [
    ['/semilleros', 'Semilleros'],
    ['/proyectos', 'Proyectos'],
    ['/eventos', 'Eventos'],
    ...(isDocente ? [['/reportes', 'Reportes']] : []),
    ...(isAdmin ? [['/cuentas', 'Cuentas']] : [])
  ]
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><Sprout /><span>Semilleros<small>Uniautónoma del Cauca</small></span></div>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
          ))}
        </nav>
        <div className="me">
          <strong>{nombreCompleto(user)}</strong>
          <span className="rol">{user.rol}</span>
          <button className="btn ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}
