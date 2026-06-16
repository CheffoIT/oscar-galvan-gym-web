-- ============================================================
-- OSCAR GALVAN GYM WEB — Migración de seguridad v2
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- EJECUTAR DESPUÉS de 01_schema.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. TABLA DE INVITACIONES
--    El entrenador/admin crea un alumno con email.
--    El sistema genera un token seguro para activación.
--    El alumno establece su propia contraseña.
--    El entrenador NUNCA ve ni maneja contraseñas.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitaciones (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre         VARCHAR(100) NOT NULL,
  apellido       VARCHAR(100) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  -- Solo guardar el HASH del token, nunca el token en claro
  token_hash     VARCHAR(64)  NOT NULL UNIQUE,
  rol            VARCHAR(20)  NOT NULL DEFAULT 'alumno'
                 CHECK (rol IN ('alumno', 'entrenador')),
  creado_por     UUID         REFERENCES perfiles(id) ON DELETE SET NULL,
  entrenador_id  UUID         REFERENCES entrenadores(id) ON DELETE SET NULL,
  expira_en      TIMESTAMPTZ  NOT NULL,
  usada          BOOLEAN      NOT NULL DEFAULT false,
  usada_en       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE invitaciones IS 'Tokens de activación de cuenta generados por el gimnasio.';
COMMENT ON COLUMN invitaciones.token_hash IS 'SHA-256 del token. El token en claro nunca se almacena.';

CREATE INDEX IF NOT EXISTS idx_invitaciones_email   ON invitaciones(email);
CREATE INDEX IF NOT EXISTS idx_invitaciones_token   ON invitaciones(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitaciones_creador ON invitaciones(creado_por);

-- ─────────────────────────────────────────────────────────────
-- 2. TOKEN PÚBLICO QR EN ALUMNOS
--    Reemplaza el uso de ID predecible en el QR.
--    El token es un UUID generado aleatoriamente.
--    Puede revocarse y regenerarse.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE alumnos
  ADD COLUMN IF NOT EXISTS qr_token            VARCHAR(64),
  ADD COLUMN IF NOT EXISTS qr_token_activo     BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qr_token_creado_en  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qr_token_caduca_en  TIMESTAMPTZ;

COMMENT ON COLUMN alumnos.qr_token IS 'Token público UUID para la ficha QR. No contiene el ID real.';
COMMENT ON COLUMN alumnos.qr_token_activo IS 'false = QR revocado o nunca generado.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_alumnos_qr_token ON alumnos(qr_token)
  WHERE qr_token IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 3. CAMPOS DE AUDITORÍA EN ALUMNOS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE alumnos
  ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by    UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by    UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by    UUID REFERENCES perfiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN alumnos.deleted_at IS 'Borrado lógico: fecha de eliminación. NULL = activo.';
COMMENT ON COLUMN alumnos.deleted_by IS 'Quién realizó el borrado lógico.';

-- ─────────────────────────────────────────────────────────────
-- 4. CAMPOS DE AUDITORÍA EN PAGOS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE pagos
  ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by    UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by    UUID REFERENCES perfiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN pagos.deleted_at IS 'Borrado lógico en pagos (trazabilidad financiera).';

-- ─────────────────────────────────────────────────────────────
-- 5. TABLA DE LOG DE ACCESOS ADMINISTRATIVOS (auditoría)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS log_accesos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID         REFERENCES perfiles(id) ON DELETE SET NULL,
  accion      VARCHAR(100) NOT NULL,
  recurso     VARCHAR(100),
  recurso_id  UUID,
  ip          VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE log_accesos IS 'Registro de acciones administrativas importantes.';
CREATE INDEX IF NOT EXISTS idx_log_usuario   ON log_accesos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_created   ON log_accesos(created_at);

-- ─────────────────────────────────────────────────────────────
-- 6. ÍNDICES DE RENDIMIENTO Y SEGURIDAD ADICIONALES
-- ─────────────────────────────────────────────────────────────
-- Buscar alumnos activos (excluir borrados lógicamente)
CREATE INDEX IF NOT EXISTS idx_alumnos_activos
  ON alumnos(estado) WHERE deleted_at IS NULL;

-- Pagos activos
CREATE INDEX IF NOT EXISTS idx_pagos_activos
  ON pagos(alumno_id, fecha_vencimiento) WHERE deleted_at IS NULL;

-- Perfiles por rol
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles(rol);

-- ─────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
--    Protege los datos a nivel de base de datos.
--    Incluso si alguien obtiene la anon key, no puede ver
--    datos de otros usuarios.
-- ─────────────────────────────────────────────────────────────

-- Habilitar RLS en tablas sensibles
ALTER TABLE perfiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutina_ejercicios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_fisico  ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_clinico   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitaciones        ENABLE ROW LEVEL SECURITY;

-- ── PERFILES: cada usuario solo ve su propio perfil ────────────────────
DROP POLICY IF EXISTS "Perfil propio" ON perfiles;
CREATE POLICY "Perfil propio"
  ON perfiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin ve todos los perfiles" ON perfiles;
CREATE POLICY "Admin ve todos los perfiles"
  ON perfiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'entrenador')
    )
  );

DROP POLICY IF EXISTS "Admin actualiza perfiles" ON perfiles;
CREATE POLICY "Admin actualiza perfiles"
  ON perfiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

-- ── ALUMNOS: acceso por rol ────────────────────────────────────────────
DROP POLICY IF EXISTS "Alumno ve su propio registro" ON alumnos;
CREATE POLICY "Alumno ve su propio registro"
  ON alumnos FOR SELECT
  USING (
    perfil_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'entrenador')
    )
  );

DROP POLICY IF EXISTS "Admin y entrenador crean alumnos" ON alumnos;
CREATE POLICY "Admin y entrenador crean alumnos"
  ON alumnos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'entrenador')
    )
  );

DROP POLICY IF EXISTS "Admin y entrenador actualizan alumnos" ON alumnos;
CREATE POLICY "Admin y entrenador actualizan alumnos"
  ON alumnos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'entrenador')
    )
  );

-- Solo admin puede eliminar (borrado lógico)
DROP POLICY IF EXISTS "Solo admin elimina alumnos" ON alumnos;
CREATE POLICY "Solo admin elimina alumnos"
  ON alumnos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

-- ── PAGOS: solo admin ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin ve pagos" ON pagos;
CREATE POLICY "Admin ve pagos"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

DROP POLICY IF EXISTS "Alumno ve sus propios pagos" ON pagos;
CREATE POLICY "Alumno ve sus propios pagos"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM alumnos a
      WHERE a.id = pagos.alumno_id AND a.perfil_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin crea pagos" ON pagos;
CREATE POLICY "Admin crea pagos"
  ON pagos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin actualiza pagos" ON pagos;
CREATE POLICY "Admin actualiza pagos"
  ON pagos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

-- ── RUTINAS ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Rutinas visibles por participantes" ON rutinas;
CREATE POLICY "Rutinas visibles por participantes"
  ON rutinas FOR SELECT
  USING (
    -- El alumno dueño
    EXISTS (SELECT 1 FROM alumnos a WHERE a.id = rutinas.alumno_id AND a.perfil_id = auth.uid())
    -- El entrenador responsable
    OR EXISTS (SELECT 1 FROM entrenadores e WHERE e.id = rutinas.entrenador_id AND e.perfil_id = auth.uid())
    -- El admin
    OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
  );

DROP POLICY IF EXISTS "Entrenador y admin crean rutinas" ON rutinas;
CREATE POLICY "Entrenador y admin crean rutinas"
  ON rutinas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'entrenador')
    )
  );

DROP POLICY IF EXISTS "Entrenador y admin actualizan rutinas" ON rutinas;
CREATE POLICY "Entrenador y admin actualizan rutinas"
  ON rutinas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'entrenador')
    )
  );

-- ── SEGUIMIENTO FÍSICO ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Seguimiento propio y entrenador" ON seguimiento_fisico;
CREATE POLICY "Seguimiento propio y entrenador"
  ON seguimiento_fisico FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM alumnos a WHERE a.id = seguimiento_fisico.alumno_id AND a.perfil_id = auth.uid())
    OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('admin', 'entrenador'))
  );

-- ── HISTORIAL CLÍNICO: muy restringido ───────────────────────────────
DROP POLICY IF EXISTS "Historial clinico restringido" ON historial_clinico;
CREATE POLICY "Historial clinico restringido"
  ON historial_clinico FOR SELECT
  USING (
    -- Solo el alumno mismo y admin/entrenador autorizado
    EXISTS (SELECT 1 FROM alumnos a WHERE a.id = historial_clinico.alumno_id AND a.perfil_id = auth.uid())
    OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('admin', 'entrenador'))
  );

-- ── INVITACIONES ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Ver invitaciones propias" ON invitaciones;
CREATE POLICY "Ver invitaciones propias"
  ON invitaciones FOR SELECT
  USING (
    creado_por = auth.uid()
    OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
  );

DROP POLICY IF EXISTS "Crear invitaciones" ON invitaciones;
CREATE POLICY "Crear invitaciones"
  ON invitaciones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'entrenador')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 8. FUNCIÓN: Generar QR token para alumno
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generar_qr_token(p_alumno_id UUID, p_dias_expiracion INT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generar UUID como token (no contiene el ID del alumno)
  v_token := gen_random_uuid()::TEXT;

  UPDATE alumnos
  SET
    qr_token           = v_token,
    qr_token_activo    = true,
    qr_token_creado_en = now(),
    qr_token_caduca_en = CASE
      WHEN p_dias_expiracion IS NOT NULL
      THEN now() + (p_dias_expiracion || ' days')::INTERVAL
      ELSE NULL
    END
  WHERE id = p_alumno_id;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generar_qr_token IS 'Genera un token QR seguro para la ficha pública del alumno.';

-- ─────────────────────────────────────────────────────────────
-- 9. FUNCIÓN: Revocar QR token
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION revocar_qr_token(p_alumno_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE alumnos
  SET qr_token_activo = false
  WHERE id = p_alumno_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 10. TRIGGER: Actualizar updated_at automáticamente en alumnos
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alumnos_updated_at ON alumnos;
CREATE TRIGGER trg_alumnos_updated_at
  BEFORE UPDATE ON alumnos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_perfiles_updated_at ON perfiles;
CREATE TRIGGER trg_perfiles_updated_at
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

RAISE NOTICE '✅ Migración de seguridad v2 aplicada correctamente';

-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN ADICIONAL: Auditoría en tabla rutinas
-- (agregado en revisión integral v2 — 2026-06)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE rutinas
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID REFERENCES perfiles(id),
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES perfiles(id),
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES perfiles(id),
  ADD COLUMN IF NOT EXISTS ejercicios  JSONB DEFAULT '[]'::jsonb;

-- RLS en rutinas: políticas de acceso
DROP POLICY IF EXISTS "Admin ve rutinas" ON rutinas;
CREATE POLICY "Admin ve rutinas"
  ON rutinas FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

DROP POLICY IF EXISTS "Entrenador ve sus rutinas" ON rutinas;
CREATE POLICY "Entrenador ve sus rutinas"
  ON rutinas FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND entrenador_id = (SELECT id FROM perfiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Alumno ve su rutina" ON rutinas;
CREATE POLICY "Alumno ve su rutina"
  ON rutinas FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM alumnos a
      WHERE a.id = rutinas.alumno_id AND a.perfil_id = auth.uid()
    )
  );

-- Índice para búsquedas de rutinas activas por alumno
CREATE INDEX IF NOT EXISTS idx_rutinas_alumno_activa
  ON rutinas(alumno_id) WHERE deleted_at IS NULL AND activa = true;

RAISE NOTICE '✅ Auditoría en rutinas aplicada correctamente';
