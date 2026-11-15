import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage, fmtDia, nombreCompleto } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, Empty, ErrorBox, Loading, Ok, PageHead, estadoTone, useDebounced } from '../components/ui'

const ESTADOS = ['En Propuesta', 'En ejecucion', 'Finalizado', 'Cancelado']

export default function Proyectos() {
  const { user, isGestor, isEstudiante } = useAuth()
  const uid = user._id || user.id
  const [f, setF] = useState({ q: '', estado: '', desde: '', hasta: '' })
  const [lista, setLista] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const q = useDebounced(f.q)

  const cargar = useCallback(async () => {
    setErr('')
    try {
      const params = { ...(q && { q }), ...(f.estado && { estado: f.estado }), ...(f.desde && { desde: f.desde }), ...(f.hasta && { hasta: f.hasta }) }
      setLista((await api.get('/proyectos', { params })).data)
    } catch (e) { setErr(errorMessage(e)); setLista([]) }
  }, [q, f.estado, f.desde, f.hasta])
  useEffect(() => { cargar() }, [cargar])

  async function cambiar(p, estado) {
    setErr(''); setOk('')
    try {
      await api.patch(`/proyectos/${p._id}/estado`, { estado })
      setOk(`"${p.titulo}" ahora está: ${estado}`)
      setLista((l) => l.map((x) => (x._id === p._id ? { ...x, estado } : x)))
    } catch (e) { setErr(errorMessage(e)) }
  }

  return (
    <>
      <PageHead kicker="Investigación" title="Proyectos">
        {isEstudiante && <Link className="btn primary" to="/proyectos/nuevo">+ Nuevo proyecto</Link>}
      </PageHead>
      <div className="filters">
        <input className="grow" placeholder="Buscar por título…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value })}><option value="">Todos los estados</option>{ESTADOS.map((x) => <option key={x}>{x}</option>)}</select>
        <label className="inline">Desde<input type="date" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></label>
        <label className="inline">Hasta<input type="date" value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></label>
      </div>
      <ErrorBox msg={err} onRetry={cargar} /><Ok msg={ok} />
      {lista === null ? <Loading /> : lista.length === 0 ? <Empty>No hay proyectos con esos filtros.</Empty> : (
        <div className="grid">
          {lista.map((p) => {
            const puede = isGestor || (p.id_docente_asesor?._id === uid)
            return (
              <article className="card" key={p._id}>
                <div className="card-top"><Badge tone={estadoTone(p.estado)}>{p.estado}</Badge><small>{fmtDia(p.fecha_inicio)}</small></div>
                <h3>{p.titulo}</h3>
                <p className="muted">{p.descripcion_general}</p>
                <p className="line"><b>Asesor:</b> {nombreCompleto(p.id_docente_asesor)}</p>
                <p className="line"><b>Semilleros:</b> {(p.articulacion_interdisciplinar?.semilleros_involucrados || []).map((s) => s.nombre).join(', ') || '—'}</p>
                <p className="line"><b>Integrantes:</b> {(p.integrantes_participacion || []).map((i) => nombreCompleto(i.id_usuario)).join(', ') || '—'}</p>
                {puede && (
                  <label className="inline">Cambiar estado
                    <select value={ESTADOS.find((e) => e.toLowerCase() === String(p.estado).toLowerCase()) || ''} onChange={(e) => cambiar(p, e.target.value)}>
                      <option value="" disabled>—</option>{ESTADOS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </label>
                )}
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
