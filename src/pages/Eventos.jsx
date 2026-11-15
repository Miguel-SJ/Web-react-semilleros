import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage, fmtFecha } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, Empty, ErrorBox, Loading, Ok, PageHead } from '../components/ui'

export default function Eventos() {
  const { user } = useAuth()
  const uid = user._id || user.id
  const [lista, setLista] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const cargar = useCallback(async () => {
    setErr('')
    try { setLista((await api.get('/publicaciones')).data) } catch (e) { setErr(errorMessage(e)); setLista([]) }
  }, [])
  useEffect(() => { cargar() }, [cargar])

  async function inscribir(p) {
    setErr(''); setOk('')
    try { await api.put(`/publicaciones/${p._id}/inscribir`); setOk(`Quedaste inscrito en "${p.titulo}"`); cargar() }
    catch (e) { setErr(errorMessage(e)) }
  }

  return (
    <>
      <PageHead kicker="Capacitaciones" title="Eventos de los semilleros" />
      <ErrorBox msg={err} onRetry={cargar} /><Ok msg={ok} />
      {lista === null ? <Loading /> : lista.length === 0 ? <Empty>Todavía no hay eventos publicados.</Empty> : (
        <div className="grid">
          {lista.map((p) => {
            const d = p.detalles_capacitacion || {}
            const ins = d.inscritos || []
            const inscrito = ins.some((i) => (i._id || i) === uid)
            const lleno = d.cupo_maximo && ins.length >= d.cupo_maximo
            return (
              <article className="card" key={p._id}>
                <div className="card-top"><Badge tone={inscrito ? 'blue' : lleno ? 'red' : 'green'}>{inscrito ? 'Inscrito' : lleno ? 'Cupo completo' : 'Inscripciones abiertas'}</Badge><small>{p.id_semillero_organizador?.nombre}</small></div>
                <h3>{p.titulo}</h3>
                <p className="muted">{p.contenido}</p>
                <p className="line"><b>Cuándo:</b> {fmtFecha(d.fecha_hora_inicio)}</p>
                <p className="line"><b>Dónde:</b> {d.enlace_reunion_lugar || 'Por definir'}</p>
                <p className="line"><b>Instructor:</b> {d.instructor || '—'}</p>
                <p className="line"><b>Cupos:</b> {ins.length}{d.cupo_maximo ? ` de ${d.cupo_maximo}` : ''}</p>
                <button className="btn primary" disabled={inscrito || lleno} onClick={() => inscribir(p)}>{inscrito ? 'Ya estás inscrito' : 'Inscribirme'}</button>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
