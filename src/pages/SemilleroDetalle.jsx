import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, errorMessage, fmtDia, nombreCompleto } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, ErrorBox, Loading, Ok, PageHead, estadoTone } from '../components/ui'

export default function SemilleroDetalle() {
  const { id } = useParams()
  const { user, isEstudiante, isGestor } = useAuth()
  const uid = user._id || user.id
  const [s, setS] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const cargar = useCallback(async () => {
    setErr('')
    try { setS((await api.get(`/semilleros/${id}`)).data) } catch (e) { setErr(errorMessage(e)) }
  }, [id])
  useEffect(() => { cargar() }, [cargar])

  async function accion(fn, mensaje) {
    setBusy(true); setErr(''); setOk('')
    try { await fn(); setOk(mensaje); await cargar() } catch (e) { setErr(errorMessage(e)) } finally { setBusy(false) }
  }

  if (!s) return err ? <ErrorBox msg={err} onRetry={cargar} /> : <Loading />
  const integrantes = s.integrantes || []
  const soyMiembro = integrantes.some((i) => (i.id_usuario?._id || i.id_usuario) === uid)
  const soyLider = (s.id_docente_lider?._id || s.id_docente_lider) === uid
  const puedeEstado = isGestor || soyLider

  return (
    <>
      <PageHead kicker={<Link to="/semilleros">← Semilleros</Link>} title={s.nombre}>
        <Badge tone={estadoTone(s.estado)}>{s.estado ? 'Activo' : 'Inactivo'}</Badge>
        {isEstudiante && (soyMiembro
          ? <button className="btn ghost" disabled={busy} onClick={() => accion(() => api.delete(`/semilleros/${id}/asociarme`), 'Saliste del semillero')}>Salir del semillero</button>
          : <button className="btn primary" disabled={busy || !s.estado} onClick={() => accion(() => api.put(`/semilleros/${id}/asociarme`), '¡Te asociaste al semillero!')}>Asociarme</button>)}
        {puedeEstado && (
          <button className="btn ghost" disabled={busy} onClick={() => accion(() => api.patch(`/semilleros/${id}/estado`, { estado: !s.estado }), `Semillero ${s.estado ? 'desactivado' : 'activado'}`)}>
            {s.estado ? 'Desactivar' : 'Activar'}
          </button>
        )}
      </PageHead>
      <ErrorBox msg={err} /><Ok msg={ok} />
      <div className="two">
        <section className="panel">
          <h2>Información</h2>
          <dl>
            <dt>Facultad</dt><dd>{s.facultad}</dd>
            <dt>Área estudiada</dt><dd>{s.area_estudiada?.nombre || '—'}<br /><small className="muted">{s.area_estudiada?.descripcion}</small></dd>
            <dt>Docente líder</dt><dd>{nombreCompleto(s.id_docente_lider) || 'Por asignar'}<br /><small className="muted">{s.id_docente_lider?.correo_institucional}</small></dd>
            <dt>Creado</dt><dd>{fmtDia(s.fecha_creacion)}</dd>
          </dl>
          <h3>Líneas de investigación</h3>
          <ul className="plain">{(s.lineas_investigacion || []).map((l) => <li key={l.nombre}><b>{l.nombre}</b><br /><small className="muted">{l.descripcion}</small></li>)}</ul>
        </section>
        <section className="panel">
          <h2>Integrantes ({integrantes.length})</h2>
          {integrantes.length === 0 ? <p className="muted">Este semillero aún no tiene estudiantes asociados.</p> : (
            <table>
              <thead><tr><th>Nombre</th><th>Código</th><th>Programa</th><th>Desde</th></tr></thead>
              <tbody>
                {integrantes.map((i) => (
                  <tr key={i._id}>
                    <td>{nombreCompleto(i.id_usuario)}</td>
                    <td>{i.id_usuario?.perfil_estudiante?.codigo_estudiantil || '—'}</td>
                    <td>{i.id_usuario?.perfil_estudiante?.programa_academico || '—'}</td>
                    <td>{fmtDia(i.fecha_vinculacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  )
}
