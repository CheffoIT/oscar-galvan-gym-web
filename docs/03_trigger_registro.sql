-- ============================================================
-- TRIGGER: auto-crear perfil cuando se registra un usuario
--
-- INSTRUCCIONES:
-- 1. Ir a https://supabase.com → tu proyecto → SQL Editor
-- 2. Pegar este SQL completo y ejecutarlo (Run)
-- 3. También deshabilitar confirmación de email:
--    Authentication → Providers → Email → desactivar "Confirm email"
-- ============================================================

-- Función que se ejecuta al crear un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, apellido, email, rol, activo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre',   'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido',  ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol',       'alumno'),
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- Si el rol es alumno, también insertar en tabla alumnos
  IF (NEW.raw_user_meta_data->>'rol') = 'alumno' OR
     (NEW.raw_user_meta_data->>'rol') IS NULL THEN
    INSERT INTO public.alumnos (nombre, apellido, email, estado)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'nombre',  'Usuario'),
      COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
      NEW.email,
      'activo'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger que llama a la función en cada nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
