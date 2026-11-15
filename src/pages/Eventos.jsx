import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage, fmtFecha } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, Empty, ErrorBox, Loading, Ok, PageHead, estadoTone } from '../components/ui'

const ESTADOS = ['Próximo', 'Finalizado', 'Cancelado']

export default function Eventos() {
  const { user, isDocente, isAdmin } = useAuth()
  const uid = user._id || user.id
  const [lista, setLista] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const cargar = useCallback(async () => {
    setErr('')
    try { setLista((await api.get('/publicaciones')).data) } catch (e) { setErr(errorMessage(e)); setLista([]) }
  }, [])
  useEffect(() => { cargar() }, [cargar])

  async function accion(fn, mensaje) {
    setErr(''); setOk('')
    try { await fn(); setOk(mensaje); cargar() } catch (e) { setErr(errorMessage(e)) }
  }
  const eliminar = (p) => { if (window.confirm(`¿Eliminar el evento "${p.titulo}"?`)) accion(() => api.delete(`/publicaciones/${p._id}`), 'Evento eliminado') }

  const vista = (lista || []).filter((p) => !filtro || (p.estado || 'Próximo') === filtro)

  return (
    <>
      <PageHead kicker="Capacitaciones" title="Eventos de los semilleros">
        {(isDocente || isAdmin) && <Link className="btn primary" to="/eventos/nuevo">+ Nuevo evento</Link>}
      </PageHead>
      <div className="filters">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}><option value="">Todos los estados</option>{ESTADOS.map((x) => <option key={x}>{x}</option>)}</select>
      </div>
      <ErrorBox msg={err} onRetry={cargar} /><Ok msg={ok} />
      {lista === null ? <Loading /> : vista.length === 0 ? <Empty>No hay eventos para mostrar.</Empty> : (
        <div className="grid">
          {vista.map((p) => {
            const d = p.detalles_capacitacion || {}
            const ins = d.inscritos || []
            const estado = p.estado || 'Próximo'
            const inscrito = ins.some((i) => (i._id || i) === uid)
            const lleno = d.cupo_maximo && ins.length >= d.cupo_maximo
            const abierto = estado === 'Próximo'
            return (
              <article className="card" key={p._id}>
                <div className="card-top"><Badge tone={estadoTone(estado)}>{estado}</Badge><small>{p.id_semillero_organizador?.nombre}</small></div>
                <h3>{p.titulo}</h3>
                <p className="muted">{p.contenido}</p>
                <p className="line"><b>Cuándo:</b> {fmtFecha(d.fecha_hora_inicio)}</p>
                <p className="line"><b>Dónde:</b> {d.enlace_reunion_lugar || 'Por definir'}</p>
                <p className="line"><b>Instructor:</b> {d.instructor || '—'}</p>
                <p className="line"><b>Cupos:</b> {ins.length}{d.cupo_maximo ? ` de ${d.cupo_maximo}` : ''}{lleno ? ' (completo)' : ''}</p>
                <div className="actions">
                  {inscrito
                    ? <button className="btn ghost" onClick={() => accion(() => api.delete(`/publicaciones/${p._id}/inscribir`), `Te desinscribiste de "${p.titulo}"`)}>Desinscribirme</button>
                    : <button className="btn primary" disabled={!abierto || lleno} onClick={() => accion(() => api.put(`/publicaciones/${p._id}/inscribir`), `Quedaste inscrito en "${p.titulo}"`)}>{!abierto ? `Evento ${estado.toLowerCase()}` : lleno ? 'Cupo completo' : 'Inscribirme'}</button>}
                </div>
                {p.puede_gestionar && (
                  <div className="actions">
                    <label className="inline">Estado
                      <select value={estado} onChange={(e) => accion(() => api.patch(`/publicaciones/${p._id}/estado`, { estado: e.target.value }), `"${p.titulo}": ${e.target.value}`)}>{ESTADOS.map((x) => <option key={x}>{x}</option>)}</select>
                    </label>
                    <button className="btn danger" onClick={() => eliminar(p)}>Eliminar</button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
