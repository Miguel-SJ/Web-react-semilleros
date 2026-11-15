import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Semilleros from './pages/Semilleros'
import SemilleroDetalle from './pages/SemilleroDetalle'
import Proyectos from './pages/Proyectos'
import Eventos from './pages/Eventos'
import Reportes from './pages/Reportes'
import Cuentas from './pages/Cuentas'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/semilleros" element={<Semilleros />} />
          <Route path="/semilleros/:id" element={<SemilleroDetalle />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route element={<ProtectedRoute roles={['administrador']} />}>
            <Route path="/cuentas" element={<Cuentas />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/semilleros" replace />} />
    </Routes>
  )
}
