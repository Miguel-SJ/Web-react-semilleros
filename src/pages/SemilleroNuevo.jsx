import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorMessage, nombreCompleto } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ErrorBox, PageHead } from '../components/ui'

export default function SemilleroNuevo() {
  const { user, isAdmin } = useAuth()
  const uid = user._id || user.id
  const nav = useNavigate()
  const [f, setF] = useState({ nombre: '', facultad: 'Facultad de Ingeniería', areaNombre: '', areaDesc: '', lider: '' })
  const [lineas, setLineas] = useState([{ nombre: '', descripcion: '' }])
  const [docentes, setDocentes] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (!isAdmin) return
    api.get('/usuarios').then(({ data }) => setDocentes(data.filter((u) => u.rol === 'docente'))).catch((e) => setErr(errorMessage(e)))
  }, [isAdmin])

  const setLinea = (i, k, v) => setLineas(lineas.map((l, j) => (j === i ? { ...l, [k]: v } : l)))

  async function enviar(e) {
    e.preventDefault(); setErr('')
    const validas = lineas.map((l) => ({ nombre: l.nombre.trim(), descripcion: l.descripcion.trim() })).filter((l) => l.nombre)
    if (!validas.length) return setErr('Agrega al menos una línea de investigación')
    const lider = isAdmin ? f.lider : uid
    if (!lider) return setErr('Elige el docente líder')
    setBusy(true)
    try {
      const { data } = await api.post('/semilleros', {
        nombre: f.nombre.trim(), facultad: f.facultad.trim(), id_docente_lider: lider,
        area_estudiada: { nombre: f.areaNombre.trim(), descripcion: f.areaDesc.trim() },
        lineas_investigacion: validas
      })
      nav(`/semilleros/${data._id}`, { replace: true })
    } catch (e2) { setErr(errorMessage(e2)); setBusy(false) }
  }

  return (
    <div className="form-page">
      <PageHead kicker={<Link to="/semilleros">← Semilleros</Link>} title="Nuevo semillero" />
      <form className="panel" onSubmit={enviar}>
        <label>Nombre del semillero<input required value={f.nombre} onChange={set('nombre')} /></label>
        <label>Facultad<input required value={f.facultad} onChange={set('facultad')} /></label>
        <div className="row2">
          <label>Área estudiada<input required value={f.areaNombre} onChange={set('areaNombre')} /></label>
          <label>Descripción del área<input value={f.areaDesc} onChange={set('areaDesc')} /></label>
        </div>
        {isAdmin ? (
          <label>Docente líder
            <select required value={f.lider} onChange={set('lider')}><option value="">Selecciona…</option>{docentes.map((d) => <option key={d._id} value={d._id}>{nombreCompleto(d)}</option>)}</select>
          </label>
        ) : <p className="muted">Serás el docente líder: <b>{nombreCompleto(user)}</b></p>}
        <h3>Líneas de investigación (etiquetas)</h3>
        <div className="rows">
          {lineas.map((l, i) => (
            <div className="row2" key={i}>
              <input placeholder="Nombre" value={l.nombre} onChange={(e) => setLinea(i, 'nombre', e.target.value)} />
              <input placeholder="Descripción" value={l.descripcion} onChange={(e) => setLinea(i, 'descripcion', e.target.value)} />
              <button type="button" className="btn ghost" disabled={lineas.length === 1} onClick={() => setLineas(lineas.filter((_, j) => j !== i))}>Quitar</button>
            </div>
          ))}
          <button type="button" className="btn ghost" style={{ justifySelf: 'start' }} onClick={() => setLineas([...lineas, { nombre: '', descripcion: '' }])}>+ Agregar línea</button>
        </div>
        <ErrorBox msg={err} />
        <div className="actions"><button className="btn primary" disabled={busy}>{busy ? 'Guardando…' : 'Crear semillero'}</button><Link className="btn ghost" to="/semilleros">Cancelar</Link></div>
      </form>
    </div>
  )
}
