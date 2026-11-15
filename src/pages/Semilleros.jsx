import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage, nombreCompleto } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, Empty, ErrorBox, Loading, PageHead, estadoTone, useDebounced } from '../components/ui'

export default function Semilleros() {
  const { isDocente, isAdmin } = useAuth()
  const [f, setF] = useState({ q: '', facultad: '', area: '', linea: '' })
  const [lista, setLista] = useState(null)
  const [opc, setOpc] = useState({ facultades: [], areas: [], lineas: [] })
  const [err, setErr] = useState('')
  const q = useDebounced(f.q)

  // Opciones de los filtros: se calculan una vez con la lista completa
  useEffect(() => {
    api.get('/semilleros/detalles').then(({ data }) => {
      const u = (arr) => [...new Set(arr.filter(Boolean))].sort()
      setOpc({
        facultades: u(data.map((s) => s.facultad)),
        areas: u(data.map((s) => s.area_estudiada?.nombre)),
        lineas: u(data.flatMap((s) => (s.lineas_investigacion || []).map((l) => l.nombre)))
      })
    }).catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setErr('')
    try {
      const params = { ...(q && { q }), ...(f.facultad && { facultad: f.facultad }), ...(f.area && { area: f.area }), ...(f.linea && { linea: f.linea }) }
      const { data } = await api.get('/semilleros/detalles', { params })
      setLista(data)
    } catch (e) { setErr(errorMessage(e)); setLista([]) }
  }, [q, f.facultad, f.area, f.linea])
  useEffect(() => { cargar() }, [cargar])

  const limpiar = () => setF({ q: '', facultad: '', area: '', linea: '' })
  const hayFiltros = f.q || f.facultad || f.area || f.linea

  return (
    <>
      <PageHead kicker="Directorio" title="Semilleros de investigación">
        {(isDocente || isAdmin) && <Link className="btn primary" to="/semilleros/nuevo">+ Nuevo semillero</Link>}
      </PageHead>
      <div className="filters">
        <input className="grow" placeholder="Buscar por semillero, docente, línea o integrante…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.facultad} onChange={(e) => setF({ ...f, facultad: e.target.value })}><option value="">Todas las facultades</option>{opc.facultades.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })}><option value="">Todas las áreas</option>{opc.areas.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={f.linea} onChange={(e) => setF({ ...f, linea: e.target.value })}><option value="">Todas las etiquetas</option>{opc.lineas.map((x) => <option key={x}>{x}</option>)}</select>
        {hayFiltros && <button className="btn ghost" onClick={limpiar}>Limpiar</button>}
      </div>
      <ErrorBox msg={err} onRetry={cargar} />
      {lista === null ? <Loading label="Cargando semilleros…" /> : lista.length === 0 && !err ? (
        <Empty>No hay semilleros que coincidan con la búsqueda.</Empty>
      ) : (
        <div className="grid">
          {lista.map((s) => {
            const ints = (s.integrantes || []).map((i) => nombreCompleto(i.id_usuario)).filter(Boolean)
            return (
              <article className="card" key={s._id}>
                <div className="card-top">
                  <Badge tone={estadoTone(s.estado)}>{s.estado ? 'Activo' : 'Inactivo'}</Badge>
                  <small>{s.facultad}</small>
                </div>
                <h3><Link to={`/semilleros/${s._id}`}>{s.nombre}</Link></h3>
                <p className="muted">{s.area_estudiada?.nombre || 'Sin área'}</p>
                <p className="line"><b>Docente líder:</b> {nombreCompleto(s.id_docente_lider) || 'Por asignar'}</p>
                <div className="tags">
                  {(s.lineas_investigacion || []).map((l) => (
                    <button key={l.nombre} className={`tag ${f.linea === l.nombre ? 'on' : ''}`} onClick={() => setF({ ...f, linea: f.linea === l.nombre ? '' : l.nombre })}>{l.nombre}</button>
                  ))}
                </div>
                <p className="line"><b>Integrantes ({ints.length}):</b> {ints.length ? ints.slice(0, 3).join(', ') + (ints.length > 3 ? ` y ${ints.length - 3} más` : '') : 'Aún sin integrantes'}</p>
                <Link className="btn ghost" to={`/semilleros/${s._id}`}>Ver detalle</Link>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
