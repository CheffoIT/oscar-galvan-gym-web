-- ============================================================
-- OSCAR GALVAN GYM WEB — Migración: Fix RLS infinite recursion
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- EJECUTAR DESPUÉS de 04_security_migration.sql
-- Fecha: 2026-06-16
-- ============================================================
--
-- PROBLEMA: Las políticas "Admin ve todos los perfiles" y
-- "Admin actualiza perfiles" consultaban la tabla `perfiles`
-- dentro del USING de una policy sobre `perfiles`, causando
-- recursión infinita (HTTP 500 en todas las queries a perfiles).
--
-- SOLUCIÓN: Función SECURITY DEFINER que bypasea RLS para
-- obtener el rol del usuario actual, usada en las políticas.
-- ============================================================

-- 1. Función auxiliar que lee el rol sin disparar RLS
CREATE OR REPLACE FUNCTION auth_rol()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION auth_rol() IS
  'Retorna el rol del usuario autenticado. SECURITY DEFINER para evitar recursión en RLS de perfiles.';

-- 2. Reemplazar política recursiva de SELECT
DROP POLICY IF EXISTS "Admin ve todos los perfiles" ON perfiles;
CREATE POLICY "Admin ve todos los perfiles"
  ON perfiles FOR SELECT
  USING (auth_rol() IN ('admin', 'entrenador'));

-- 3. Reemplazar política recursiva de UPDATE
DROP POLICY IF EXISTS "Admin actualiza perfiles" ON perfiles;
CREATE POLICY "Admin actualiza perfiles"
  ON perfiles FOR UPDATE
  USING (auth.uid() = id OR auth_rol() = 'admin');

-- 4. Fix de datos: asegurar que todos los perfiles de seed tengan activo = true
UPDATE perfiles SET activo = true WHERE activo = false OR activo IS NULL;

-- 5. Fix de datos: insertar entrenador en tabla entrenadores si no existe
INSERT INTO entrenadores (id, perfil_id, especialidad, activo)
SELECT uuid_generate_v4(), p.id, 'Musculación y fuerza', true
FROM perfiles p
WHERE p.rol = 'entrenador'
  AND NOT EXISTS (SELECT 1 FROM entrenadores e WHERE e.perfil_id = p.id);
