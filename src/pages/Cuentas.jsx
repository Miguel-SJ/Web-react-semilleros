import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage, nombreCompleto } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, ErrorBox, Loading, Ok, PageHead, estadoTone } from '../components/ui'

const vacio = { tipo: 'estudiante', nombre: '', apellido: '', correo: '', password: '', codigo: '', programa: 'Ingeniería de Software', semestre: 1, escalafon: 'Asociado', facultad: 'Facultad de Ingeniería' }

export default function Cuentas() {
  const { user, registrar } = useAuth()
  const uid = user._id || user.id
  const [lista, setLista] = useState(null)
  const [f, setF] = useState(vacio)
  const [filtro, setFiltro] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const cargar = useCallback(async () => {
    try { setLista((await api.get('/usuarios')).data) } catch (e) { setErr(errorMessage(e)); setLista([]) }
  }, [])
  useEffect(() => { cargar() }, [cargar])

  async function crear(e) {
    e.preventDefault(); setErr(''); setOk('')
    const base = { nombre: f.nombre.trim(), apellido: f.apellido.trim(), correo_institucional: f.correo.trim().toLowerCase(), password: f.password }
    const payload = f.tipo === 'estudiante'
      ? { ...base, perfil_estudiante: { codigo_estudiantil: f.codigo.trim(), programa_academico: f.programa, semestre_actual: Number(f.semestre) || 1 } }
      : { ...base, perfil_docente: { escalafon: f.escalafon, departamento_facultad: f.facultad, horarios_asesoria: [] } }
    try {
      await registrar(f.tipo, payload, { iniciarSesion: false }) // el administrador sigue con su sesión
      setOk(`Cuenta creada: ${base.correo_institucional}`); setF(vacio); cargar()
    } catch (e2) { setErr(errorMessage(e2)) }
  }

  async function alternar(u) {
    setErr(''); setOk('')
    try {
      await api.patch(`/usuarios/${u._id}/estado`, { estado: !u.estado })
      setOk(`${nombreCompleto(u)}: cuenta ${u.estado ? 'suspendida' : 'activada'}`)
      setLista((l) => l.map((x) => (x._id === u._id ? { ...x, estado: !u.estado } : x)))
    } catch (e) { setErr(errorMessage(e)) }
  }

  const vista = (lista || []).filter((u) => `${nombreCompleto(u)} ${u.correo_institucional} ${u.rol}`.toLowerCase().includes(filtro.toLowerCase()))

  return (
    <>
      <PageHead kicker="Administración" title="Cuentas" />
      <ErrorBox msg={err} /><Ok msg={ok} />
      <div className="two">
        <form className="panel" onSubmit={crear}>
          <h2>Crear cuenta</h2>
          <label>Rol<select value={f.tipo} onChange={set('tipo')}><option value="estudiante">Estudiante</option><option value="docente">Docente</option></select></label>
          <div className="row2">
            <label>Nombre<input required value={f.nombre} onChange={set('nombre')} /></label>
            <label>Apellido<input required value={f.apellido} onChange={set('apellido')} /></label>
          </div>
          <label>Correo institucional<input type="email" required value={f.correo} onChange={set('correo')} /></label>
          <label>Contraseña inicial<input type="password" required minLength={4} value={f.password} onChange={set('password')} /></label>
          {f.tipo === 'estudiante' ? (
            <div className="row2">
              <label>Código<input required value={f.codigo} onChange={set('codigo')} /></label>
              <label>Semestre<input type="number" min="1" max="12" value={f.semestre} onChange={set('semestre')} /></label>
            </div>
          ) : (
            <div className="row2">
              <label>Escalafón<select value={f.escalafon} onChange={set('escalafon')}>{['Auxiliar', 'Asistente', 'Asociado', 'Titular'].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Facultad<input required value={f.facultad} onChange={set('facultad')} /></label>
            </div>
          )}
          <button className="btn primary wide">Crear cuenta</button>
        </form>
        <section className="panel">
          <div className="panel-head"><h2>Cuentas registradas</h2></div>
          <input placeholder="Filtrar por nombre, correo o rol…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          {lista === null ? <Loading /> : (
            <ul className="accounts">
              {vista.map((u) => (
                <li key={u._id}>
                  <div><strong>{nombreCompleto(u)}</strong><small>{u.correo_institucional}</small></div>
                  <Badge tone="blue">{u.rol}</Badge>
                  <Badge tone={estadoTone(u.estado ? 'activa' : 'suspendida')}>{u.estado ? 'Activa' : 'Suspendida'}</Badge>
                  <button className="btn ghost" disabled={u._id === uid} onClick={() => alternar(u)}>{u.estado ? 'Suspender' : 'Activar'}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
