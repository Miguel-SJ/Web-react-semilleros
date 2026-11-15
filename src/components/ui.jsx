import { useEffect, useState } from 'react'

export function Loading({ label = 'Cargando…' }) {
  const [lento, setLento] = useState(false)
  useEffect(() => { const t = setTimeout(() => setLento(true), 4000); return () => clearTimeout(t) }, [])
  return (
    <div className="loading">
      <span className="spinner" /> {label}
      {lento && <small>El servidor gratuito se está despertando, puede tardar hasta un minuto…</small>}
    </div>
  )
}
export const ErrorBox = ({ msg, onRetry }) => msg ? (
  <div className="alert error" role="alert">{msg}{onRetry && <button className="link" onClick={onRetry}>Reintentar</button>}</div>
) : null
export const Ok = ({ msg }) => msg ? <div className="alert ok" role="status">{msg}</div> : null
export const Empty = ({ children }) => <div className="empty">{children}</div>
export const Badge = ({ tone = 'blue', children }) => <span className={`badge ${tone}`}>{children}</span>
export const estadoTone = (e) => {
  const t = String(e).toLowerCase()
  if (t.includes('ejecu') || t === 'true' || t === 'activo' || t === 'activa') return 'green'
  if (t.includes('final') || t.includes('próximo') || t.includes('proximo')) return 'blue'
  if (t.includes('cancel') || t === 'false' || t.includes('inactiv') || t.includes('suspend')) return 'red'
  return 'amber'
}
export function PageHead({ kicker, title, children }) {
  return (
    <header className="page-head">
      <div><p className="kicker">{kicker}</p><h1>{title}</h1></div>
      <div className="page-actions">{children}</div>
    </header>
  )
}
export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}
