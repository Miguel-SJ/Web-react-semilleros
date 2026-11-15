import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorMessage, nombreCompleto } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ErrorBox, Loading, PageHead } from '../components/ui'

export default function EventoNuevo() {
  const { user, isAdmin } = useAuth()
  const uid = user._id || user.id
  const nav = useNavigate()
  const [sems, setSems] = useState(null)
  const [f, setF] = useState({ titulo: '', semillero: '', contenido: '', tematica: '', instructor: nombreCompleto(user), fecha: '', hi: '14:00', hf: '17:00', lugar: '', cupo: 30 })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    api.get('/semilleros/detalles').then(({ data }) => {
      const mios = isAdmin ? data : data.filter((s) => (s.id_docente_lider?._id) === uid)
      setSems(mios.filter((s) => s.estado))
    }).catch((e) => { setErr(errorMessage(e)); setSems([]) })
  }, [isAdmin, uid])

  async function enviar(e) {
    e.preventDefault(); setErr('')
    const inicio = `${f.fecha}T${f.hi}:00-05:00`, fin = `${f.fecha}T${f.hf}:00-05:00`
    if (new Date(fin) <= new Date(inicio)) return setErr('La hora de fin debe ser posterior a la de inicio')
    setBusy(true)
    try {
      await api.post('/publicaciones', {
        titulo: f.titulo.trim(), contenido: f.contenido.trim(), tipo: 'capacitacion', id_semillero_organizador: f.semillero,
        detalles_capacitacion: {
          tematica: f.tematica.trim() || f.titulo.trim(), instructor: f.instructor.trim(),
          fecha_hora_inicio: inicio, fecha_hora_fin: fin, enlace_reunion_lugar: f.lugar.trim(), cupo_maximo: Number(f.cupo) || 0
        }
      })
      nav('/eventos', { replace: true })
    } catch (e2) { setErr(errorMessage(e2)); setBusy(false) }
  }

  if (sems === null) return <Loading />
  return (
    <div className="form-page">
      <PageHead kicker={<Link to="/eventos">← Eventos</Link>} title="Nuevo evento" />
      {sems.length === 0 ? (
        <div className="alert error">No lideras ningún semillero activo. Crea primero un semillero para poder organizar eventos. <Link to="/semilleros/nuevo">Crear semillero</Link></div>
      ) : (
        <form className="panel" onSubmit={enviar}>
          <label>Título<input required value={f.titulo} onChange={set('titulo')} /></label>
          <label>Semillero organizador
            <select required value={f.semillero} onChange={set('semillero')}><option value="">Selecciona…</option>{sems.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}</select>
          </label>
          <label>Descripción<textarea value={f.contenido} onChange={set('contenido')} /></label>
          <div className="row2">
            <label>Temática<input value={f.tematica} onChange={set('tematica')} /></label>
            <label>Instructor<input required value={f.instructor} onChange={set('instructor')} /></label>
          </div>
          <div className="row2">
            <label>Fecha<input type="date" required value={f.fecha} onChange={set('fecha')} /></label>
            <label>Cupo máximo<input type="number" min="1" required value={f.cupo} onChange={set('cupo')} /></label>
          </div>
          <div className="row2">
            <label>Hora de inicio<input type="time" required value={f.hi} onChange={set('hi')} /></label>
            <label>Hora de fin<input type="time" required value={f.hf} onChange={set('hf')} /></label>
          </div>
          <label>Lugar o enlace<input required value={f.lugar} onChange={set('lugar')} placeholder="Auditorio, salón 503 o https://meet…" /></label>
          <ErrorBox msg={err} />
          <div className="actions"><button className="btn primary" disabled={busy}>{busy ? 'Publicando…' : 'Publicar evento'}</button><Link className="btn ghost" to="/eventos">Cancelar</Link></div>
        </form>
      )}
    </div>
  )
}
