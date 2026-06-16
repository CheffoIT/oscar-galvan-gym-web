# 🏋️ Oscar Galvan Gym Web

**Plataforma web full stack para gestión de gimnasios y entrenadores personales.**

> Proyecto académico — Tecnicatura Superior en Desarrollo de Software

---

## Descripción

Oscar Galvan Gym Web es una plataforma responsive que centraliza la gestión de:
- Alumnos, rutinas, ejercicios y seguimiento físico
- Pagos y membresías con control de vencimientos
- Asistencia con lectura de QR
- Landing page pública editable sin tocar código
- Roles: Administrador, Entrenador y Alumno

Identidad visual: **fitness urbano premium** — negro, morado `#6B21A8` y amarillo `#EAB308`.

---

## Stack tecnológico

| Capa          | Tecnología                          |
|---------------|-------------------------------------|
| Frontend      | React 18 + Vite + Tailwind CSS      |
| Backend       | Node.js + Express                   |
| Base de datos | PostgreSQL (Supabase)               |
| Autenticación | Supabase Auth / JWT                 |
| Storage       | Supabase Storage                    |
| QR            | qrcode + html5-qrcode               |
| Gráficos      | Recharts                            |
| Hosting       | Vercel (frontend) + Railway (backend)|

---

## Instalación

### Requisitos previos
- Node.js >= 18
- npm >= 9

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # completá con tus credenciales Supabase
npm run dev             # http://localhost:5173
```

### Backend

```bash
cd backend
npm install
cp .env.example .env    # completá con tus credenciales Supabase
npm run dev             # http://localhost:3001
```

---

## Usuarios demo (sin Supabase configurado)

| Rol          | Email                  | Contraseña       |
|--------------|------------------------|------------------|
| Admin        | admin@gym.com          | admin123         |
| Entrenador   | entrenador@gym.com     | entrenador123    |
| Alumno       | alumno@gym.com         | alumno123        |

---

## Rutas disponibles

### Frontend (React Router)

| Ruta                      | Descripción              | Acceso     |
|---------------------------|--------------------------|------------|
| `/`                       | Landing page pública     | Público    |
| `/login`                  | Inicio de sesión         | Público    |
| `/admin`                  | Dashboard administrador  | Admin      |
| `/admin/alumnos`          | Gestión de alumnos       | Admin      |
| `/admin/rutinas`          | Gestión de rutinas       | Admin      |
| `/admin/pagos`            | Pagos y membresías       | Admin      |
| `/admin/configuracion`    | Configuración del gym    | Admin      |
| `/entrenador`             | Dashboard entrenador     | Entrenador |
| `/alumno`                 | Panel del alumno         | Alumno     |

### Backend (Express API)

| Endpoint               | Método | Descripción              |
|------------------------|--------|--------------------------|
| `/api/health`          | GET    | Estado del servidor      |
| `/api/auth/login`      | POST   | Iniciar sesión           |
| `/api/auth/logout`     | POST   | Cerrar sesión            |
| `/api/alumnos`         | GET    | Listar alumnos           |
| `/api/alumnos/:id`     | GET    | Ver alumno               |
| `/api/alumnos`         | POST   | Crear alumno             |
| `/api/rutinas`         | GET    | Listar rutinas           |
| `/api/rutinas`         | POST   | Crear rutina             |
| `/api/pagos`           | GET    | Listar pagos             |
| `/api/pagos`           | POST   | Registrar pago           |
| `/api/configuracion`   | GET    | Configuración pública    |
| `/api/configuracion`   | PUT    | Actualizar configuración |

---

## Estructura del proyecto

```
oscar-galvan-gym-web/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           (Button, Card, StatCard, Badge, Input, Modal, Table, SectionTitle)
│   │   │   └── layout/       (Navbar, Sidebar, DashboardLayout)
│   │   ├── pages/
│   │   │   ├── public/       (LandingPage, LoginPage)
│   │   │   ├── admin/        (AdminDashboard, AlumnosPage, RutinasPage, PagosPage, ConfiguracionPage)
│   │   │   ├── entrenador/   (EntrenadorDashboard)
│   │   │   └── alumno/       (AlumnoDashboard)
│   │   ├── routes/           (AppRoutes.jsx)
│   │   ├── services/         (supabaseClient.js)
│   │   ├── hooks/            (useAuth.js)
│   │   ├── data/             (alumnosMock, rutinasMock, pagosMock, horariosMock, configuracionGymMock)
│   │   └── index.css         (estilos Tailwind + componentes custom)
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── backend/
│   ├── src/
│   │   ├── routes/           (health, auth, alumnos, rutinas, pagos, configuracion)
│   │   ├── middlewares/      (auth.js — JWT + roles)
│   │   └── config/           (supabase.js)
│   ├── index.js
│   └── .env.example
└── README.md
```

---

## Próximos pasos (Etapa 2)

- [ ] Conectar Supabase: crear tablas y ejecutar migraciones SQL
- [ ] Activar Supabase Auth para login real
- [ ] Implementar generación real de QR por alumno
- [ ] Módulo de seguimiento físico con gráficos
- [ ] Módulo de asistencia con lector de QR (html5-qrcode)
- [ ] Upload de imágenes a Supabase Storage
- [ ] Módulo de dietas y recomendaciones nutricionales
- [ ] Integración con n8n para recordatorios de pago
- [ ] Deploy en Vercel + Railway

---

## Módulos pendientes de implementar

| Módulo                  | Estado         |
|-------------------------|----------------|
| Autenticación real      | Mock por ahora |
| QR generación/escaneo   | Estructura OK  |
| Supabase Storage (imgs) | Config lista   |
| Seguimiento físico      | Pendiente      |
| Dietas                  | Pendiente      |
| Historial clínico       | Pendiente      |
| Asistencias QR          | Pendiente      |
| Reportes + estadísticas | Parcial        |
| n8n automatizaciones    | Pendiente      |

---

## Paleta de colores

| Variable           | Hex        | Uso                      |
|--------------------|------------|--------------------------|
| `gym-black`        | `#050505`  | Fondo principal          |
| `gym-dark`         | `#111111`  | Fondo secundario         |
| `gym-card`         | `#1a1a2e`  | Cards y paneles          |
| `gym-purple`       | `#6B21A8`  | Color de marca           |
| `gym-purplel`      | `#9333EA`  | Acentos y hover          |
| `gym-yellow`       | `#EAB308`  | CTAs y highlights        |
| `gym-white`        | `#F8FAFC`  | Textos principales       |
| `gym-gray`         | `#A1A1AA`  | Textos secundarios       |

---

*Oscar Galvan Gym Web — Fuerza. Disciplina. Resultados.*
