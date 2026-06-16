-- ============================================================
-- OSCAR GALVAN GYM WEB — Trigger automático de perfil
-- Ejecutar en SQL Editor DESPUÉS de 01_schema.sql
--
-- ¿Qué hace?
-- Cada vez que un nuevo usuario se registra en Supabase Auth,
-- este trigger crea automáticamente una fila en la tabla "perfiles"
-- con el rol 'alumno' por defecto.
-- El admin puede cambiar el rol manualmente después desde el panel.
-- ============================================================

-- Función que se ejecuta al crear un usuario en auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, apellido, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre',  split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE(NEW.raw_user_meta_data->>'rol',      'alumno')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que llama a la función después de cada INSERT en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

SELECT 'Trigger de auto-perfil creado ✅' AS resultado;

-- ============================================================
-- CÓMO CAMBIAR EL ROL DE UN USUARIO
-- (ejecutar en SQL Editor cuando quieras ascender a alguien)
-- ============================================================

-- Cambiar a admin:
-- UPDATE perfiles SET rol = 'admin' WHERE id = 'uuid-del-usuario';

-- Cambiar a entrenador:
-- UPDATE perfiles SET rol = 'entrenador' WHERE id = 'uuid-del-usuario';

-- Ver todos los perfiles y sus roles:
-- SELECT p.id, p.nombre, p.apellido, p.rol, u.email
-- FROM perfiles p
-- JOIN auth.users u ON u.id = p.id
-- ORDER BY p.rol;
