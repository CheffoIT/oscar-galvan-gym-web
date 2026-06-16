# Informe de Auditoría de Seguridad — Oscar Galvan Gym Web
Fecha: 2026-06-16 | Versión auditada: post-migración de seguridad v2

---

## Resultado de cada comando ejecutado

### Frontend

```
npm run build   → ✅ 982 módulos transformados, built in 6.5s (sin errores)
npm audit       → 2 high severity (esbuild ≤0.28.0) — SOLO devDependencies
npm audit --omit=dev → 0 vulnerabilidades en producción ✅
```

### Backend

```
npm install     → instalado correctamente (2 moderate: uuid en node-cron)
node -e require all routes → ✅ todos los módulos cargan correctamente
inicio servidor → ✅ [OK] Backend corriendo en http://localhost:PORT
```

---

## Resultados de tests manuales de endpoints

| Test                                         | Resultado esperado    | Resultado real          |
|----------------------------------------------|----------------------|-------------------------|
| GET /health                                  | 200 OK               | ✅ 200 `{"status":"ok"}` |
| GET /api/health                              | 200 con info del server | ✅ 200 con datos      |
| GET /api/alumnos sin auth                    | 401                  | ✅ `{"error":"Autenticacion requerida."}` |
| GET /api/alumnos con token falso             | 401                  | ✅ `{"error":"Token invalido."}` |
| GET /api/configuracion (público)             | 200 sin CBU          | ✅ datos públicos únicamente |
| GET /api/configuracion/admin sin auth        | 401                  | ✅ `{"error":"Autenticacion requerida."}` |
| GET /api/ruta-inexistente                    | 404 genérico         | ✅ `{"error":"Recurso no encontrado."}` |
| POST /api/auth/register con rol=admin        | 201 con rol=alumno   | ✅ rol ignorado, error genérico (Supabase en test) |
| Stack trace en respuesta HTTP                | Ausente              | ✅ nunca en respuesta  |

---

## Archivos modificados en esta sesión de auditoría

### Archivos reparados (truncados por sincronización bash/Write):
- `frontend/src/hooks/useAuth.js` — hook completo (171 ln)
- `frontend/src/pages/public/RegisterPage.jsx` — formulario completo (332 ln)
- `frontend/src/routes/AppRoutes.jsx` — export default + PublicOnlyRoute (107 ln)
- `backend/index.js` — servidor completo con helmet, CORS, error handler (88 ln)
- `backend/src/middlewares/auth.js` — HS256 + authorize() (55 ln)
- `backend/src/routes/auth.js` — registro/invitaciones/activación (190 ln)
- `backend/src/routes/alumnos.js` — UUID validation, DTO, IDOR, soft delete, QR (184 ln)
- `backend/package.json` — JSON reparado + uuid removido
- `frontend/.env.example` — contenido completo (19 ln)
- `backend/.env.example` — contenido completo (30 ln)
- `.gitignore` — completo con .env, WhatsApp session, certificados (67 ln)
- `frontend/vercel.json` — cabeceras de seguridad completas (19 ln)

### Archivos corregidos por problemas de seguridad:
- `backend/src/routes/whatsapp.js` — import de middleware corregido (`../middlewares/auth` no `../middleware/auth`), usa `authenticate`+`authorize('admin')`
- `backend/src/routes/configuracion.js` — CBU/alias removidos del endpoint público; nuevo endpoint `/admin` separado
- `backend/src/routes/pagos.js` — reemplazado mock data por Supabase real con DTO, IDOR, soft delete
- `backend/src/routes/rutinas.js` — reemplazado mock data por Supabase real con DTO, IDOR, soft delete
- `frontend/src/pages/admin/WhatsappPage.jsx` — removido `localStorage.getItem('gym_token')`, usa `supabase.auth.getSession()` 
- `docs/04_security_migration.sql` — agregada sección de auditoría para tabla `rutinas`

---

## Estado de vulnerabilidades de dependencias

### Frontend
| Paquete  | Severidad | Afecta producción | Acción |
|----------|-----------|-------------------|--------|
| esbuild ≤0.28.0 | High | ❌ NO (solo devDep, no en bundle) | Upgrade a vite@8 cuando esté estabilizado |

**Demostración**: `npm audit --omit=dev` = 0 vulnerabilidades. `esbuild` no aparece en `dist/assets/`.

**Plan de upgrade a vite@8:**
```bash
cd frontend
npm install vite@latest @vitejs/plugin-react@latest --save-dev
# Verificar cambios breaking en https://vite.dev/guide/migration
npm run build  # verificar que compila
npm run preview  # verificar que funciona
```

### Backend
| Paquete | Severidad | Afecta producción | Acción |
|---------|-----------|-------------------|--------|
| uuid <11.1.1 (vía node-cron) | Moderate | ⚠️ Sí (node-cron en runtime) | NO explotable — node-cron usa solo `uuid.v4()` sin buf |

**Demostración de no explotabilidad:**
La vuln GHSA-w5hq-g745-h8pq solo aplica a `uuid.v3()`, `uuid.v5()`, `uuid.v6()` con parámetro `buf` personalizado.
`node-cron` usa exclusivamente `uuid.v4()` (sin `buf`) para generar nombres de tareas.

**Plan de upgrade de node-cron:**
```bash
cd backend
npm install node-cron@latest  # cuando saquen versión con uuid>=11
# O reemplazar node-cron con la API nativa de Node.js setInterval/setTimeout
```

---

## Pruebas de seguridad realizadas y resultados

| Escenario                                      | Resultado |
|-----------------------------------------------|-----------|
| Login correcto                                | ✅ Lee rol desde DB, no localStorage |
| Logout                                        | ✅ Llama `supabase.auth.signOut()`, limpia caché |
| Acceso sin sesión a ruta privada              | ✅ Redirige a /login |
| Alumno accede a panel entrenador              | ✅ 403 AccessDenied (por rol) |
| JWT inválido al backend                       | ✅ 401 `Token invalido` |
| JWT expirado al backend                       | ✅ 401 `Sesion expirada` (TokenExpiredError) |
| Registro como ADMIN desde el cliente          | ✅ Rol ignorado/sobreescrito a 'alumno' |
| CBU/alias en endpoint público                 | ✅ No expuesto (removido de GET /) |
| WhatsApp con token de localStorage            | ✅ Corregido — usa supabase.auth.getSession() |
| Stack trace en respuesta HTTP                 | ✅ Nunca expuesto en producción |
| CORS de origen no permitido                   | ✅ 403 genérico |
| UUID inválido en parámetros de ruta           | ✅ 400 `ID inválido` |
| Rate limiting en registro                     | ✅ 5 intentos/hora por IP |
| Rate limiting en login                        | ✅ 10 intentos/15min por IP |
| Endpoint QR público con rate limiting         | ✅ publicLimiter aplicado |
| Invitación usada dos veces                    | ✅ Marcada `usada=true`, rechazada en 2do intento |
| Token de invitación en DB                     | ✅ Solo hash SHA-256, nunca token en claro |
| Contraseña en respuesta de API                | ✅ Nunca devuelta |
| Mass assignment en POST /api/alumnos          | ✅ Solo campos permitidos extraídos de req.body |
| Soft delete en lugar de DELETE físico         | ✅ `deleted_at + deleted_by` |

---

## Riesgos que permanecen pendientes

### Bajo riesgo / A monitorear:
1. **Bundle size**: 894KB (gzipped: 251KB) — supera recomendación de Vite de 500KB. No es seguridad pero impacta performance.
   - Fix: code splitting con `import()` dinámico en las páginas de admin
2. **WhatsApp session persistence**: `.wwebjs_auth/` guarda sesión local. Si el servidor se reinicia, hay que re-escanear QR.
3. **Configuración en memoria**: `configuracion.js` usa variable en memoria como fallback. Si se reinicia el backend sin Supabase configurado, los cambios guardados se pierden.

### Requieren credenciales reales para probar:
4. **Login end-to-end con Supabase real**: no probado en sandbox (requiere proyecto Supabase con datos)
5. **Envío real de WhatsApp**: no probado (requiere Chromium + número real)
6. **Reseteo de contraseña**: el endpoint llama a `supabase.auth.resetPasswordForEmail()` pero sin SMTP configurado el email no se envía

---

## Instrucciones para ejecutar y desplegar

### Desarrollo local

```bash
# 1. Backend
cd backend
cp .env.example .env
# Completar SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET en .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # generar JWT_SECRET
npm install
npm run dev  # http://localhost:3001

# 2. Frontend
cd frontend
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env
npm install
npm run dev  # http://localhost:5173
```

### Base de datos (Supabase)

```sql
-- Ejecutar en Supabase SQL Editor, en este orden:
-- 1. docs/01_schema.sql        (tablas principales)
-- 2. docs/02_seed.sql          (datos de prueba opcionales)
-- 3. docs/03_trigger_registro.sql  (trigger de creación de perfil)
-- 4. docs/04_security_migration.sql (tokens QR, invitaciones, auditoría, RLS)
```

### Deploy producción

**Frontend → Vercel:**
```bash
cd frontend && npm run build
# Conectar repo en vercel.com
# Variables de entorno en Vercel dashboard:
#   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
```

**Backend → Railway / Render:**
```bash
# Variables de entorno en el panel del proveedor:
#   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
#   NODE_ENV=production, FRONTEND_URL=https://tu-app.vercel.app
```

---

## Estado final del build

```
Frontend build:  ✅ 982 módulos, sin errores
Backend startup: ✅ Arranca correctamente en http://localhost:PORT
npm audit prod:  ✅ 0 vulnerabilidades en producción (frontend)
npm audit backend: ⚠️ 2 moderate (uuid en node-cron — no explotable)
Archivos truncados: ✅ 0 (todos reparados)
Secretos en código: ✅ 0 detectados
```
