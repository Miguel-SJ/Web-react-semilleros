import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setToken, setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)
const KEY = 'semilleros_sesion'

// Respaldo en sessionStorage: sobrevive a recargar la pestaña pero se borra al cerrarla.
function leerSesion() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY))
    if (s?.token) { setToken(s.token); return s }
  } catch { /* sin sesión */ }
  return null
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion)

  const guardar = (token, user) => {
    setToken(token)
    sessionStorage.setItem(KEY, JSON.stringify({ token, user }))
    setSesion({ token, user })
  }

  const logout = useCallback(() => {
    setToken(null)
    sessionStorage.removeItem(KEY)
    setSesion(null)
  }, [])

  useEffect(() => { setUnauthorizedHandler(logout) }, [logout])

  const login = async (correo, password) => {
    const { data } = await api.post('/usuarios/login', { correo_institucional: correo.trim().toLowerCase(), password })
    guardar(data.token, data.usuario)
  }

  // tipo: 'estudiante' | 'docente'. En auto-registro inicia sesión con el token recibido.
  const registrar = async (tipo, payload, { iniciarSesion = true } = {}) => {
    const { data } = await api.post(`/usuarios/${tipo}`, payload)
    if (iniciarSesion) guardar(data.token, data.usuario)
    return data.usuario
  }

  const value = useMemo(() => {
    const user = sesion?.user || null
    return {
      user, isAuth: !!sesion?.token, login, registrar, logout,
      isAdmin: user?.rol === 'administrador',
      isGestor: ['administrador', 'coordinador'].includes(user?.rol),
      isDocente: user?.rol === 'docente',
      isEstudiante: user?.rol === 'estudiante'
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
