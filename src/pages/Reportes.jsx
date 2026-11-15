import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'
import { Empty, ErrorBox, Loading, PageHead } from '../components/ui'

const Bars = ({ rows, label, value }) => {
  const max = Math.max(1, ...rows.map((r) => r[value]))
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r[label]}>
          <span>{r[label]}</span>
          <div><i style={{ width: `${(r[value] / max) * 100}%` }} /></div>
          <b>{r[value]}</b>
        </li>
      ))}
    </ul>
  )
}

export default function Reportes() {
  const [rango, setRango] = useState({ desde: '', hasta: '' })
  const [aplicado, setAplicado] = useState({ desde: '', hasta: '' })
  const [res, setRes] = useState(null)
  const [carga, setCarga] = useState([])
  const [err, setErr] = useState('')

  const cargar = useCallback(async () => {
    setErr(''); setRes(null)
    const params = { ...(aplicado.desde && { desde: aplicado.desde }), ...(aplicado.hasta && { hasta: aplicado.hasta }) }
    try {
      const [r, c] = await Promise.all([api.get('/reportes/resumen', { params }), api.get('/reportes/carga-docentes', { params })])
      setRes(r.data); setCarga(c.data)
    } catch (e) { setErr(errorMessage(e)); setRes({}) }
  }, [aplicado])
  useEffect(() => { cargar() }, [cargar])

  function exportarCSV() {
    const filas = [['Docente', 'Correo', 'Departamento', 'Proyectos'], ...carga.map((c) => [c.docente, c.correo, c.departamento || '', c.total_proyectos])]
    const csv = filas.map((f) => f.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `carga-docentes_${aplicado.desde || 'inicio'}_${aplicado.hasta || 'hoy'}.csv`
    a.click()
  }

  return (
    <>
      <PageHead kicker="Indicadores" title="Reportes" />
      <form className="filters" onSubmit={(e) => { e.preventDefault(); setAplicado(rango) }}>
        <label className="inline">Desde<input type="date" value={rango.desde} onChange={(e) => setRango({ ...rango, desde: e.target.value })} /></label>
        <label className="inline">Hasta<input type="date" value={rango.hasta} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} /></label>
        <button className="btn primary">Aplicar fechas</button>
        {(aplicado.desde || aplicado.hasta) && <button type="button" className="btn ghost" onClick={() => { setRango({ desde: '', hasta: '' }); setAplicado({ desde: '', hasta: '' }) }}>Limpiar</button>}
      </form>
      <ErrorBox msg={err} onRetry={cargar} />
      {res === null ? <Loading label="Generando reportes…" /> : !res.semilleros ? null : (
        <>
          <div className="stats">
            <div><b>{res.semilleros.total}</b><span>Semilleros ({res.semilleros.activos} activos)</span></div>
            <div><b>{res.proyectos.total}</b><span>Proyectos</span></div>
            <div><b>{res.eventos.total}</b><span>Eventos</span></div>
            <div><b>{res.eventos.inscritos}</b><span>Inscripciones a eventos</span></div>
          </div>
          <div className="two">
            <section className="panel">
              <h2>Proyectos por estado</h2>
              {res.proyectos.por_estado.length ? <Bars rows={res.proyectos.por_estado} label="estado" value="total" /> : <Empty>Sin proyectos en el rango.</Empty>}
            </section>
            <section className="panel">
              <div className="panel-head"><h2>Carga de docentes (proyectos asesorados)</h2>{carga.length > 0 && <button className="btn ghost" onClick={exportarCSV}>Exportar CSV</button>}</div>
              {carga.length ? <Bars rows={carga} label="docente" value="total_proyectos" /> : <Empty>Sin proyectos en el rango.</Empty>}
            </section>
          </div>
          <section className="panel">
            <h2>Usuarios por rol</h2>
            <Bars rows={res.usuarios} label="rol" value="total" />
          </section>
        </>
      )}
    </>
  )
}
