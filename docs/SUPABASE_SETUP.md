# 🔌 Guía completa: Conectar Supabase al proyecto

Seguí estos pasos en orden. Al final el sistema va a funcionar con base de datos real.

---

## PASO 1 — Crear cuenta y proyecto en Supabase

1. Abrí **https://supabase.com** en tu navegador
2. Hacé clic en **"Start your project"** → iniciá sesión con GitHub o email
3. Una vez en el dashboard, clic en **"New project"**
4. Completá el formulario:
   - **Organization:** tu nombre o "OscarGalvanGym"
   - **Name:** `oscar-galvan-gym`
   - **Database Password:** elegí una contraseña fuerte y **guardala** (la vas a necesitar)
   - **Region:** `South America (São Paulo)` — el más cercano a Argentina
5. Hacé clic en **"Create new project"**
6. Esperá 1-2 minutos mientras Supabase provisiona el proyecto ☕

---

## PASO 2 — Obtener las credenciales

1. En tu proyecto Supabase, andá a **Settings** (ícono de engranaje, abajo a la izquierda)
2. Clic en **"API"** en el menú lateral
3. Vas a ver dos valores que necesitás copiar:

```
Project URL:      https://xxxxxxxxxxx.supabase.co
anon public key:  eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...  (clave larga)
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...  (NUNCA la expongas en el frontend)
```

> ⚠️ **IMPORTANTE:**
> - La `anon public key` va en el **frontend** — es pública pero tiene RLS que la protege
> - La `service_role key` va solo en el **backend** — tiene acceso total, nunca la pongas en el navegador

---

## PASO 3 — Configurar los archivos .env

### Frontend (.env)

Abrí el archivo `frontend/.env` (copiarlo desde `frontend/.env.example`):

```bash
# Desde la carpeta frontend/
cp .env.example .env
```

Luego editalo con tus datos reales:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

VITE_API_URL=http://localhost:3001
```

### Backend (.env)

```bash
# Desde la carpeta backend/
cp .env.example .env
```

```env
SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

JWT_SECRET=pon_aqui_un_string_largo_y_aleatorio_minimo_32_caracteres
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## PASO 4 — Crear las tablas (ejecutar el schema SQL)

1. En Supabase, andá a **"SQL Editor"** (ícono de código, en el menú izquierdo)
2. Hacé clic en **"New query"**
3. Abrí el archivo `docs/01_schema.sql` de tu proyecto
4. **Copiá todo el contenido** y pegalo en el editor de Supabase
5. Hacé clic en **"Run"** (botón verde, o `Ctrl+Enter`)
6. Deberías ver al final: `Schema creado exitosamente ✅`

> Si aparece algún error, revisá que estés en la pestaña correcta del proyecto.

---

## PASO 5 — Crear los usuarios de prueba en Supabase Auth

1. En Supabase, andá a **"Authentication"** → **"Users"**
2. Hacé clic en **"Add user"** → **"Create new user"** para cada uno:

| Email               | Contraseña       | Rol (lo configurás en paso 6) |
|---------------------|------------------|-------------------------------|
| admin@gym.com       | Admin123!        | admin                         |
| entrenador@gym.com  | Entrenador123!   | entrenador                    |
| alumno@gym.com      | Alumno123!       | alumno                        |

3. Después de crear cada usuario, **copiá el UUID** que Supabase genera (columna "UID")

> Los UUIDs tienen este formato: `550e8400-e29b-41d4-a716-446655440000`

---

## PASO 6 — Cargar los datos iniciales (seed)

1. Abrí el archivo `docs/02_seed.sql`
2. **Reemplazá** los tres UUIDs al inicio del script con los que copiaste en el paso anterior:

```sql
v_admin_id       UUID := '550e8400-...';  -- ← UUID del usuario admin@gym.com
v_entrenador_id  UUID := '6ba7b810-...';  -- ← UUID del usuario entrenador@gym.com
v_alumno_id      UUID := '6ba7b811-...';  -- ← UUID del usuario alumno@gym.com
```

3. Copiá el script modificado y pegalo en **SQL Editor → New query**
4. Hacé clic en **"Run"**
5. Deberías ver: `Seed cargado exitosamente ✅`

---

## PASO 7 — Configurar Supabase Auth (ajustes de seguridad)

1. Andá a **Authentication → Providers → Email**
2. Verificá que esté **habilitado** el proveedor Email
3. Desactivá **"Confirm email"** por ahora (para no necesitar verificar emails en desarrollo)
4. Guardá los cambios

---

## PASO 8 — Crear los buckets de Storage

1. Andá a **"Storage"** en el menú izquierdo
2. Hacé clic en **"New bucket"** y creá estos buckets uno por uno:

| Nombre             | Public | Descripción                          |
|--------------------|--------|--------------------------------------|
| `gym-assets`       | ✅ Sí  | Logo e imágenes de la landing        |
| `exercise-media`   | ✅ Sí  | Imágenes y videos de ejercicios      |
| `alumni-photos`    | ❌ No  | Fotos de alumnos (acceso privado)    |
| `payment-vouchers` | ❌ No  | Comprobantes de pago                 |

3. Para cada bucket público, hacé clic en el bucket → **"Policies"** → **"New policy"** → **"For full customization"**:
   - Operation: `SELECT`
   - Target roles: `public` (sin autenticación)
   - Policy definition: `true`
   - Guardá

---

## PASO 9 — Verificar que todo funciona

### Verificar tablas creadas
1. Andá a **"Table Editor"** en Supabase
2. Deberías ver las tablas: `alumnos`, `rutinas`, `pagos`, `ejercicios`, `configuracion_gimnasio`, etc.

### Verificar datos del seed
1. Hacé clic en la tabla `alumnos` → deberías ver los 6 alumnos de prueba
2. Clic en `configuracion_gimnasio` → deberías ver 1 fila con los datos del gimnasio

### Arrancar el frontend
```bash
cd frontend
npm run dev
```

Abrí `http://localhost:5173/login` e ingresá con:
- `admin@gym.com` / `Admin123!`

Si ves el dashboard con datos reales → ¡Supabase conectado! 🎉

---

## PASO 10 — Verificar el backend

```bash
cd backend
npm run dev
```

Abrí en el navegador: `http://localhost:3001/api/health`

Deberías ver:
```json
{
  "status": "OK",
  "app": "Oscar Galvan Gym Web API",
  "database": "conectado"
}
```

---

## 🐛 Problemas comunes y soluciones

### "Invalid API key"
→ Verificá que copiaste la `anon key` correcta en `frontend/.env` (no la service_role)
→ Asegurate de que el archivo se llame `.env` y no `.env.example`
→ Reiniciá el servidor de Vite después de cambiar el .env

### "User not found" al hacer login
→ Verificá que los usuarios existen en Authentication → Users
→ Asegurate de que "Confirm email" esté desactivado o que los emails estén confirmados
→ Verificá que el campo `confirmed_at` no esté vacío en la tabla `auth.users`

### "Row level security" bloquea todo
→ Verificá que el script `01_schema.sql` corrió sin errores
→ Revisá que la función `get_rol()` se creó correctamente:
```sql
SELECT get_rol();  -- Ejecutar estando autenticado debería devolver 'admin', etc.
```

### "Permission denied" en tablas
→ Asegurate de que la fila en `perfiles` con el UUID del usuario existe
→ El trigger que crea el perfil automáticamente quizás falló — crealo manualmente:
```sql
INSERT INTO perfiles (id, nombre, apellido, rol)
VALUES ('tu-uuid-aqui', 'Oscar', 'Galvan', 'admin');
```

### Los datos mock siguen apareciendo
→ Verificá que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` no estén vacías
→ En `supabaseClient.js` hay una guarda: si las variables están vacías, usa datos mock
→ Reiniciá completamente el servidor de Vite (Ctrl+C y volver a correr `npm run dev`)

---

## ✅ Checklist final

- [ ] Proyecto creado en supabase.com
- [ ] Credenciales copiadas en `frontend/.env` y `backend/.env`
- [ ] Script `01_schema.sql` ejecutado sin errores
- [ ] 3 usuarios creados en Authentication
- [ ] Script `02_seed.sql` ejecutado con los UUIDs reales
- [ ] Confirm email desactivado en Authentication → Providers
- [ ] 4 buckets de Storage creados
- [ ] Frontend levanta sin errores (`npm run dev`)
- [ ] Login con `admin@gym.com` funciona y muestra datos reales
- [ ] Backend responde en `/api/health` con `"database": "conectado"`

---

*Una vez completado todo este checklist, el sistema está funcionando con Supabase real.*
*El próximo paso es implementar QR real, upload de imágenes y deploy en Vercel.*
