import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api/client'
import { ErrorBox } from '../components/ui'
import { Sprout } from '../components/Layout'

const vacio = { nombre: '', apellido: '', correo: '', password: '', codigo: '', programa: 'Ingeniería de Software', semestre: 1, escalafon: 'Asociado', facultad: 'Facultad de Ingeniería' }

export default function Login() {
  const { isAuth, login, registrar } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [modo, setModo] = useState('login') // login | estudiante | docente
  const [f, setF] = useState(vacio)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  if (isAuth) return <Navigate to={loc.state?.from || '/semilleros'} replace />

  async function enviar(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (modo === 'login') {
        await login(f.correo, f.password)
      } else {
        if (!f.nombre.trim() || !f.apellido.trim()) throw { response: { status: 400, data: { message: 'Nombre y apellido son obligatorios' } } }
        const base = { nombre: f.nombre.trim(), apellido: f.apellido.trim(), correo_institucional: f.correo.trim().toLowerCase(), password: f.password }
        const payload = modo === 'estudiante'
          ? { ...base, perfil_estudiante: { codigo_estudiantil: f.codigo.trim(), programa_academico: f.programa, semestre_actual: Number(f.semestre) || 1 } }
          : { ...base, perfil_docente: { escalafon: f.escalafon, departamento_facultad: f.facultad, horarios_asesoria: [] } }
        await registrar(modo, payload)
      }
      nav(loc.state?.from || '/semilleros', { replace: true })
    } catch (e2) {
      setErr(errorMessage(e2))
    } finally { setBusy(false) }
  }

  return (
    <div className="login">
      <section className="login-hero">
        <Sprout size={44} />
        <h1>Semilleros de investigación</h1>
        <p>Encuentra un semillero, únete como estudiante y sigue los proyectos, eventos y reportes de tu facultad.</p>
        <small>Corporación Universitaria Autónoma del Cauca</small>
      </section>
      <section className="login-form">
        <div className="tabs">
          {[['login', 'Ingresar'], ['estudiante', 'Soy estudiante'], ['docente', 'Soy docente']].map(([k, l]) => (
            <button key={k} type="button" className={modo === k ? 'on' : ''} onClick={() => { setModo(k); setErr('') }}>{l}</button>
          ))}
        </div>
        <form onSubmit={enviar}>
          <h2>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
          {modo !== 'login' && (
            <div className="row2">
              <label>Nombre<input required value={f.nombre} onChange={set('nombre')} /></label>
              <label>Apellido<input required value={f.apellido} onChange={set('apellido')} /></label>
            </div>
          )}
          <label>Correo institucional<input type="email" required value={f.correo} onChange={set('correo')} placeholder="nombre.apellido@uniautonoma.edu.co" /></label>
          <label>Contraseña<input type="password" required minLength={4} value={f.password} onChange={set('password')} /></label>
          {modo === 'estudiante' && (
            <>
              <div className="row2">
                <label>Código estudiantil<input required value={f.codigo} onChange={set('codigo')} /></label>
                <label>Semestre<input type="number" min="1" max="12" value={f.semestre} onChange={set('semestre')} /></label>
              </div>
              <label>Programa académico<input required value={f.programa} onChange={set('programa')} /></label>
            </>
          )}
          {modo === 'docente' && (
            <div className="row2">
              <label>Escalafón
                <select value={f.escalafon} onChange={set('escalafon')}>{['Auxiliar', 'Asistente', 'Asociado', 'Titular'].map((x) => <option key={x}>{x}</option>)}</select>
              </label>
              <label>Facultad<input required value={f.facultad} onChange={set('facultad')} /></label>
            </div>
          )}
          <ErrorBox msg={err} />
          <button className="btn primary wide" disabled={busy}>{busy ? 'Un momento…' : modo === 'login' ? 'Entrar' : 'Crear cuenta y entrar'}</button>
          {busy && <small className="hint">Si es la primera vez, el servidor puede tardar hasta un minuto en despertar.</small>}
        </form>
      </section>
    </div>
  )
}
