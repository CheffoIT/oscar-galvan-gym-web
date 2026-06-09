-- ============================================================
-- OSCAR GALVAN GYM WEB — Schema de base de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Habilitar extensión UUID (ya viene activada en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- NOTA IMPORTANTE sobre auth.users:
-- Supabase maneja la autenticación en su propia tabla "auth.users".
-- Nosotros creamos una tabla "perfiles" que referencia auth.users
-- para guardar el rol y datos extra del usuario.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. PERFILES (extiende auth.users de Supabase)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      VARCHAR(100) NOT NULL,
  apellido    VARCHAR(100),
  rol         VARCHAR(20)  NOT NULL DEFAULT 'alumno'
                CHECK (rol IN ('admin', 'entrenador', 'alumno')),
  activo      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE perfiles IS 'Perfil extendido de cada usuario autenticado con su rol.';

-- ─────────────────────────────────────────────────────────────
-- 2. ENTRENADORES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entrenadores (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil_id    UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  especialidad VARCHAR(200),
  bio          TEXT,
  foto_url     TEXT,
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE entrenadores IS 'Datos adicionales de los entrenadores del gimnasio.';

-- ─────────────────────────────────────────────────────────────
-- 3. MEMBRESÍAS / PLANES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membresias (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(100) NOT NULL,
  precio          DECIMAL(10,2) NOT NULL,
  duracion_dias   SMALLINT NOT NULL DEFAULT 30,
  descripcion     TEXT,
  activa          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE membresias IS 'Planes de membresía disponibles en el gimnasio.';

-- ─────────────────────────────────────────────────────────────
-- 4. ALUMNOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alumnos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil_id        UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  entrenador_id    UUID REFERENCES entrenadores(id) ON DELETE SET NULL,
  nombre           VARCHAR(100) NOT NULL,
  apellido         VARCHAR(100) NOT NULL,
  dni              VARCHAR(20) UNIQUE NOT NULL,
  email            VARCHAR(255),
  telefono         VARCHAR(30),
  fecha_nacimiento DATE,
  foto_url         TEXT,
  qr_code          TEXT,
  estado           VARCHAR(20) NOT NULL DEFAULT 'activo'
                   CHECK (estado IN ('activo', 'inactivo', 'suspendido', 'moroso')),
  observaciones    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE alumnos IS 'Alumnos registrados en el gimnasio.';
CREATE INDEX idx_alumnos_estado ON alumnos(estado);
CREATE INDEX idx_alumnos_entrenador ON alumnos(entrenador_id);

-- ─────────────────────────────────────────────────────────────
-- 5. HISTORIAL CLÍNICO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_clinico (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id       UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  patologias      TEXT,
  lesiones_previas TEXT,
  medicacion      TEXT,
  observaciones   TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 6. PAGOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id        UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  membresia_id     UUID REFERENCES membresias(id) ON DELETE SET NULL,
  monto            DECIMAL(10,2) NOT NULL,
  fecha_pago       DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE NOT NULL,
  metodo           VARCHAR(30) DEFAULT 'efectivo'
                   CHECK (metodo IN ('efectivo', 'transferencia', 'otro')),
  estado           VARCHAR(20) NOT NULL DEFAULT 'activo'
                   CHECK (estado IN ('activo', 'vencido', 'pendiente')),
  comprobante_url  TEXT,
  registrado_por   UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  notas            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE pagos IS 'Registro de pagos y membresías de alumnos.';
CREATE INDEX idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_vencimiento ON pagos(fecha_vencimiento);

-- ─────────────────────────────────────────────────────────────
-- 7. EJERCICIOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ejercicios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(150) NOT NULL,
  descripcion     TEXT,
  imagen_url      TEXT,
  video_url       TEXT,
  grupo_muscular  VARCHAR(100),
  dificultad      VARCHAR(20) DEFAULT 'intermedio'
                  CHECK (dificultad IN ('principiante', 'intermedio', 'avanzado')),
  created_by      UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ejercicios IS 'Biblioteca de ejercicios del gimnasio.';

-- ─────────────────────────────────────────────────────────────
-- 8. RUTINAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rutinas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(150) NOT NULL,
  descripcion     TEXT,
  entrenador_id   UUID REFERENCES entrenadores(id) ON DELETE SET NULL,
  alumno_id       UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha_inicio    DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin       DATE,
  activa          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE rutinas IS 'Rutinas de entrenamiento asignadas a alumnos.';
CREATE INDEX idx_rutinas_alumno ON rutinas(alumno_id);
CREATE INDEX idx_rutinas_activa ON rutinas(activa);

-- ─────────────────────────────────────────────────────────────
-- 9. RUTINA_EJERCICIOS (tabla pivote)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rutina_ejercicios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rutina_id       UUID NOT NULL REFERENCES rutinas(id) ON DELETE CASCADE,
  ejercicio_id    UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  dia             VARCHAR(50),
  series          SMALLINT NOT NULL DEFAULT 3,
  repeticiones    VARCHAR(20) NOT NULL DEFAULT '10',
  descanso_seg    SMALLINT DEFAULT 60,
  orden           SMALLINT DEFAULT 1,
  notas           TEXT
);

CREATE INDEX idx_rutina_ej_rutina ON rutina_ejercicios(rutina_id);

-- ─────────────────────────────────────────────────────────────
-- 10. REGISTROS DE PESO (historial por ejercicio)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registros_peso (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id       UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  ejercicio_id    UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  peso_kg         DECIMAL(5,2),
  repeticiones    SMALLINT,
  series          SMALLINT,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_regpeso_alumno ON registros_peso(alumno_id);
CREATE INDEX idx_regpeso_ejercicio ON registros_peso(ejercicio_id);

-- ─────────────────────────────────────────────────────────────
-- 11. SEGUIMIENTO FÍSICO (medidas corporales)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seguimiento_fisico (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id       UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  peso_kg         DECIMAL(5,2),
  altura_cm       DECIMAL(5,1),
  pecho_cm        DECIMAL(5,1),
  cintura_cm      DECIMAL(5,1),
  cadera_cm       DECIMAL(5,1),
  brazo_der_cm    DECIMAL(5,1),
  brazo_izq_cm    DECIMAL(5,1),
  pierna_der_cm   DECIMAL(5,1),
  pierna_izq_cm   DECIMAL(5,1),
  grasa_corporal  DECIMAL(4,1),
  observaciones   TEXT,
  registrado_por  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seguimiento_alumno ON seguimiento_fisico(alumno_id);

-- ─────────────────────────────────────────────────────────────
-- 12. DIETAS / RECOMENDACIONES NUTRICIONALES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dietas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id       UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  entrenador_id   UUID REFERENCES entrenadores(id) ON DELETE SET NULL,
  descripcion     TEXT NOT NULL,
  calorias_dia    SMALLINT,
  proteinas_g     SMALLINT,
  carbohidratos_g SMALLINT,
  grasas_g        SMALLINT,
  observaciones   TEXT,
  activa          BOOLEAN NOT NULL DEFAULT true,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 13. CAMINATAS / CARDIO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caminatas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id        UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha            DATE NOT NULL DEFAULT CURRENT_DATE,
  duracion_min     SMALLINT,
  distancia_km     DECIMAL(5,2),
  tipo             VARCHAR(50) DEFAULT 'caminata',
  observaciones    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 14. ASISTENCIAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asistencias (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id       UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  hora            TIME NOT NULL DEFAULT CURRENT_TIME,
  metodo          VARCHAR(20) DEFAULT 'qr'
                  CHECK (metodo IN ('qr', 'manual')),
  registrado_por  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asistencias_alumno ON asistencias(alumno_id);
CREATE INDEX idx_asistencias_fecha  ON asistencias(fecha);

-- ─────────────────────────────────────────────────────────────
-- 15. CONFIGURACIÓN DEL GIMNASIO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_gimnasio (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           VARCHAR(200) NOT NULL DEFAULT 'Mi Gimnasio',
  slogan           VARCHAR(300),
  frase_hero       TEXT,
  subfrase_hero    TEXT,
  logo_url         TEXT,
  whatsapp         VARCHAR(30),
  instagram        VARCHAR(100),
  facebook         VARCHAR(100),
  email_contacto   VARCHAR(255),
  direccion        TEXT,
  horarios_texto   TEXT,
  cbu              VARCHAR(22),
  alias_cbu        VARCHAR(50),
  mostrar_precios  BOOLEAN NOT NULL DEFAULT true,
  color_primario   VARCHAR(7) DEFAULT '#6B21A8',
  color_acento     VARCHAR(7) DEFAULT '#EAB308',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE configuracion_gimnasio IS 'Configuración global del gimnasio. Solo debe haber 1 fila.';

-- ─────────────────────────────────────────────────────────────
-- 16. IMÁGENES DE LA LANDING
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imagenes_landing (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url         TEXT NOT NULL,
  descripcion VARCHAR(200),
  seccion     VARCHAR(50),
  orden       SMALLINT DEFAULT 1,
  activa      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 17. NOTIFICACIONES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id       UUID REFERENCES alumnos(id) ON DELETE CASCADE,
  tipo            VARCHAR(50) NOT NULL
                  CHECK (tipo IN ('aviso','vencimiento','bienvenida','rutina_nueva','pago','general')),
  titulo          VARCHAR(200) NOT NULL,
  contenido       TEXT NOT NULL,
  leido           BOOLEAN NOT NULL DEFAULT false,
  fecha_envio     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_alumno ON notificaciones(alumno_id);
CREATE INDEX idx_notif_leido  ON notificaciones(leido);

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN: auto-actualizar updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER trg_perfiles_updated_at
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_alumnos_updated_at
  BEFORE UPDATE ON alumnos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rutinas_updated_at
  BEFORE UPDATE ON rutinas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_config_updated_at
  BEFORE UPDATE ON configuracion_gimnasio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN: calcular estado de pago automáticamente
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION recalcular_estado_pagos()
RETURNS void AS $$
BEGIN
  -- Marcar como vencido los pagos cuya fecha_vencimiento ya pasó
  UPDATE pagos
  SET estado = 'vencido'
  WHERE estado = 'activo'
    AND fecha_vencimiento < CURRENT_DATE;

  -- Actualizar estado del alumno a moroso si tiene pagos vencidos y no tiene pago activo
  UPDATE alumnos
  SET estado = 'moroso'
  WHERE estado = 'activo'
    AND id IN (
      SELECT DISTINCT alumno_id FROM pagos WHERE estado = 'vencido'
    )
    AND id NOT IN (
      SELECT DISTINCT alumno_id FROM pagos WHERE estado = 'activo'
    );
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) — Seguridad a nivel de fila
-- ─────────────────────────────────────────────────────────────

-- Activar RLS en todas las tablas
ALTER TABLE perfiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrenadores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutina_ejercicios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_peso     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_fisico ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE caminatas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_clinico  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_gimnasio ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_landing   ENABLE ROW LEVEL SECURITY;

-- Función helper: obtener rol del usuario autenticado
CREATE OR REPLACE FUNCTION get_rol()
RETURNS TEXT AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ── POLÍTICAS: perfiles ──────────────────────────────
CREATE POLICY "perfil_propio" ON perfiles
  FOR ALL USING (id = auth.uid());

CREATE POLICY "admin_ve_todos_perfiles" ON perfiles
  FOR SELECT USING (get_rol() = 'admin');

-- ── POLÍTICAS: alumnos ───────────────────────────────
-- Admin: acceso total
CREATE POLICY "admin_alumnos" ON alumnos
  FOR ALL USING (get_rol() = 'admin');

-- Entrenador: solo sus alumnos
CREATE POLICY "entrenador_sus_alumnos" ON alumnos
  FOR SELECT USING (
    get_rol() = 'entrenador'
    AND entrenador_id IN (
      SELECT id FROM entrenadores WHERE perfil_id = auth.uid()
    )
  );

-- Alumno: solo su propio registro
CREATE POLICY "alumno_su_registro" ON alumnos
  FOR SELECT USING (perfil_id = auth.uid());

-- ── POLÍTICAS: configuracion_gimnasio ────────────────
-- Lectura pública (la landing la necesita sin autenticación)
CREATE POLICY "config_lectura_publica" ON configuracion_gimnasio
  FOR SELECT USING (true);

-- Solo admin puede modificar
CREATE POLICY "config_escritura_admin" ON configuracion_gimnasio
  FOR ALL USING (get_rol() = 'admin');

-- ── POLÍTICAS: imagenes_landing ──────────────────────
CREATE POLICY "imagenes_lectura_publica" ON imagenes_landing
  FOR SELECT USING (activa = true);

CREATE POLICY "imagenes_escritura_admin" ON imagenes_landing
  FOR ALL USING (get_rol() = 'admin');

-- ── POLÍTICAS: pagos ─────────────────────────────────
CREATE POLICY "admin_todos_pagos" ON pagos
  FOR ALL USING (get_rol() = 'admin');

CREATE POLICY "alumno_sus_pagos" ON pagos
  FOR SELECT USING (
    alumno_id IN (SELECT id FROM alumnos WHERE perfil_id = auth.uid())
  );

-- ── POLÍTICAS: rutinas ───────────────────────────────
CREATE POLICY "admin_todas_rutinas" ON rutinas
  FOR ALL USING (get_rol() = 'admin');

CREATE POLICY "entrenador_sus_rutinas" ON rutinas
  FOR ALL USING (
    get_rol() = 'entrenador'
    AND entrenador_id IN (
      SELECT id FROM entrenadores WHERE perfil_id = auth.uid()
    )
  );

CREATE POLICY "alumno_su_rutina" ON rutinas
  FOR SELECT USING (
    alumno_id IN (SELECT id FROM alumnos WHERE perfil_id = auth.uid())
  );

-- ── POLÍTICAS: ejercicios ────────────────────────────
CREATE POLICY "ejercicios_lectura_autenticados" ON ejercicios
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ejercicios_escritura_admin_ent" ON ejercicios
  FOR ALL USING (get_rol() IN ('admin', 'entrenador'));

-- ── POLÍTICAS: registros_peso ────────────────────────
CREATE POLICY "admin_ent_todos_pesos" ON registros_peso
  FOR ALL USING (get_rol() IN ('admin', 'entrenador'));

CREATE POLICY "alumno_sus_pesos" ON registros_peso
  FOR ALL USING (
    alumno_id IN (SELECT id FROM alumnos WHERE perfil_id = auth.uid())
  );

-- ── POLÍTICAS: seguimiento_fisico ────────────────────
CREATE POLICY "admin_ent_seguimiento" ON seguimiento_fisico
  FOR ALL USING (get_rol() IN ('admin', 'entrenador'));

CREATE POLICY "alumno_su_seguimiento" ON seguimiento_fisico
  FOR SELECT USING (
    alumno_id IN (SELECT id FROM alumnos WHERE perfil_id = auth.uid())
  );

-- ── POLÍTICAS: asistencias ───────────────────────────
CREATE POLICY "admin_ent_asistencias" ON asistencias
  FOR ALL USING (get_rol() IN ('admin', 'entrenador'));

CREATE POLICY "alumno_sus_asistencias" ON asistencias
  FOR SELECT USING (
    alumno_id IN (SELECT id FROM alumnos WHERE perfil_id = auth.uid())
  );

-- ── POLÍTICAS: notificaciones ────────────────────────
CREATE POLICY "alumno_sus_notifs" ON notificaciones
  FOR SELECT USING (
    alumno_id IN (SELECT id FROM alumnos WHERE perfil_id = auth.uid())
  );

CREATE POLICY "admin_todas_notifs" ON notificaciones
  FOR ALL USING (get_rol() = 'admin');

-- ── POLÍTICAS: historial_clinico ─────────────────────
-- Solo admin y entrenador pueden ver historial clínico
CREATE POLICY "admin_ent_historial" ON historial_clinico
  FOR ALL USING (get_rol() IN ('admin', 'entrenador'));

-- ── POLÍTICAS: dietas y caminatas ────────────────────
CREATE POLICY "admin_ent_dietas" ON dietas
  FOR ALL USING (get_rol() IN ('admin', 'entrenador'));

CREATE POLICY "alumno_su_dieta" ON dietas
  FOR SELECT USING (
    alumno_id IN (SELECT id FROM alumnos WHERE perfil_id = auth.uid())
  );

CREATE POLICY "admin_ent_caminatas" ON caminatas
  FOR ALL USING (get_rol() IN ('admin', 'entrenador'));

CREATE POLICY "alumno_sus_caminatas" ON caminatas
  FOR ALL USING (
    alumno_id IN (SELECT id FROM alumnos WHERE perfil_id = auth.uid())
  );

-- ── POLÍTICAS: rutina_ejercicios ─────────────────────
CREATE POLICY "admin_ent_rutina_ej" ON rutina_ejercicios
  FOR ALL USING (get_rol() IN ('admin', 'entrenador'));

CREATE POLICY "alumno_ve_rutina_ej" ON rutina_ejercicios
  FOR SELECT USING (
    rutina_id IN (
      SELECT r.id FROM rutinas r
      JOIN alumnos a ON a.id = r.alumno_id
      WHERE a.perfil_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- FIN DEL SCHEMA
-- ─────────────────────────────────────────────────────────────
SELECT 'Schema creado exitosamente ✅' AS resultado;
