import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'https://api-semilleros.onrender.com/api'

// El access token vive en memoria (variable del módulo), como indica el PDF de la clase.
let accessToken = null
let onUnauthorized = null
export const setToken = (t) => { accessToken = t }
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

export const api = axios.create({ baseURL: API, timeout: 60000 }) // 60 s: Render gratis tarda en despertar

// Interceptor de petición: agrega Authorization: Bearer <token>
api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`
  return cfg
})

// Interceptor de respuesta: si el token venció o es inválido (401) cierra la sesión
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const esLogin = err.config?.url?.includes('/usuarios/login')
    if (err.response?.status === 401 && onUnauthorized && !esLogin) onUnauthorized()
    return Promise.reject(err)
  }
)

// "Evaluar el response": traduce el código HTTP o el error de red a un mensaje claro
export function errorMessage(err) {
  if (!err.response) {
    return err.code === 'ECONNABORTED'
      ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
      : 'No hay conexión con el servidor. Revisa tu internet.'
  }
  const { status, data } = err.response
  if (data?.message) return data.message
  const base = { 400: 'Datos inválidos', 401: 'Tu sesión expiró', 403: 'No tienes permisos para esto', 404: 'No se encontró el recurso', 409: 'Conflicto con el estado actual' }
  return base[status] || `Error del servidor (${status})`
}

export const fmtFecha = (iso) =>
  iso ? new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' }) : 'Por definir'
export const fmtDia = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium' }) : '—'
export const nombreCompleto = (u) => (u ? `${u.nombre || ''} ${u.apellido || ''}`.trim() : '')
