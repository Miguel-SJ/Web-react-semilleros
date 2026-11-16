# Semilleros_Web (React + Vite)

Frontend de la API de Semilleros (Node/Express/MongoDB en Render).

## Ejecutar
```bash
npm install
cp .env.example .env     # VITE_API_URL=https://api-semilleros.onrender.com/api
npm run dev              # http://localhost:5173
```

## Estructura
- `src/api/client.js` — Axios + interceptores (token Bearer, 401) + `errorMessage()` (evaluar el response)
- `src/context/AuthContext.jsx` — sesión (token en memoria + sessionStorage), login/registro/logout
- `src/components/ProtectedRoute.jsx` — rutas protegidas por sesión y por rol
- `src/pages/` — Login, Semilleros (buscador y filtros), SemilleroDetalle (asociarme), Proyectos (estado), Eventos (inscribirme), Reportes (fechas), Cuentas (admin)

## Desplegar (Vercel o Netlify)
Build `npm run build`, carpeta `dist`, variable `VITE_API_URL`. Ya incluye `vercel.json` y `public/_redirects` para las rutas de React Router.
En Render (API) puedes limitar CORS con la variable `CORS_ORIGIN=https://tu-sitio.vercel.app`.

## Roles y permisos
- **Estudiante:** asociarse/salir de semilleros, inscribirse/desinscribirse de eventos, crear proyectos.
- **Docente:** crear semilleros y eventos, cambiar estado (Próximo/Finalizado/Cancelado) o eliminar sus eventos, cambiar estado de proyectos que asesora, ver Reportes.
- **Administrador:** todo lo anterior salvo reportes, más eliminar semilleros y gestionar cuentas.
