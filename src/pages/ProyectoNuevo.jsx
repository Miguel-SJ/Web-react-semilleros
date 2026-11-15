import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorMessage, nombreCompleto } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ErrorBox, Loading, PageHead } from '../components/ui'

const TIPOS = ['Investigación aplicada', 'Desarrollo tecnológico', 'Innovación educativa']

export default function ProyectoNuevo() {
  const { user } = useAuth()
  const uid = user._id || user.id
  const nav = useNavigate()
  const [datos, setDatos] = useState(null)
  const [f, setF] = useState({ titulo: '', descripcion: '', tipo: TIPOS[0], semillero: '', asesor: '', objetivos: '', colab: '' })
  const [sel, setSel] = useState([])
  const [busca, setBusca] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    Promise.all([api.get('/usuarios'), api.get('/semilleros/detalles')])
      .then(([u, s]) => setDatos({ docentes: u.data.filter((x) => x.rol === 'docente'), estudiantes: u.data.filter((x) => x.rol === 'estudiante' && x._id !== uid), semilleros: s.data.filter((x) => x.estado) }))
      .catch((e) => { setErr(errorMessage(e)); setDatos({ docentes: [], estudiantes: [], semilleros: [] }) })
  }, [uid])

  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function enviar(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      await api.post('/proyectos', {
        titulo: f.titulo.trim(), descripcion_general: f.descripcion.trim(), tipo_proyecto: f.tipo, id_docente_asesor: f.asesor,
        objetivos: f.objetivos.split('\n').map((x) => x.trim()).filter(Boolean),
        integrantes_participacion: [
          { id_usuario: uid, rol_en_proyecto: 'Líder de desarrollo', participacion: true },
          ...sel.map((id) => ({ id_usuario: id, rol_en_proyecto: 'Co-investigador', participacion: true }))
        ],
        articulacion_interdisciplinar: { semilleros_involucrados: [f.semillero], descripcion_colaboracion: f.colab.trim() }
      })
      nav('/proyectos', { replace: true })
    } catch (e2) { setErr(errorMessage(e2)); setBusy(false) }
  }

  if (!datos) return <Loading />
  const lista = datos.estudiantes.filter((s) => nombreCompleto(s).toLowerCase().includes(busca.toLowerCase()))
  return (
    <div className="form-page">
      <PageHead kicker={<Link to="/proyectos">← Proyectos</Link>} title="Nuevo proyecto" />
      <form className="panel" onSubmit={enviar}>
        <label>Título<input required value={f.titulo} onChange={set('titulo')} /></label>
        <label>Descripción general<textarea required value={f.descripcion} onChange={set('descripcion')} /></label>
        <div className="row2">
          <label>Tipo de proyecto<select value={f.tipo} onChange={set('tipo')}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label>Semillero
            <select required value={f.semillero} onChange={set('semillero')}><option value="">Selecciona…</option>{datos.semilleros.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}</select>
          </label>
        </div>
        <label>Docente asesor
          <select required value={f.asesor} onChange={set('asesor')}><option value="">Selecciona…</option>{datos.docentes.map((d) => <option key={d._id} value={d._id}>{nombreCompleto(d)}</option>)}</select>
        </label>
        <label>Objetivos (uno por línea)<textarea value={f.objetivos} onChange={set('objetivos')} /></label>
        <label>Colaboración con el semillero<input value={f.colab} onChange={set('colab')} /></label>
        <h3>Otros integrantes <small className="muted">(tú ya apareces como líder)</small></h3>
        <input placeholder="Buscar estudiante…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ marginBottom: '.5rem' }} />
        <div className="checks">
          {lista.length === 0 && <small className="muted">Sin resultados</small>}
          {lista.map((s) => (
            <label key={s._id}><input type="checkbox" checked={sel.includes(s._id)} onChange={() => toggle(s._id)} />{nombreCompleto(s)} <small className="muted">{s.perfil_estudiante?.programa_academico}</small></label>
          ))}
        </div>
        <ErrorBox msg={err} />
        <div className="actions"><button className="btn primary" disabled={busy}>{busy ? 'Guardando…' : 'Crear proyecto'}</button><Link className="btn ghost" to="/proyectos">Cancelar</Link></div>
      </form>
    </div>
  )
}
