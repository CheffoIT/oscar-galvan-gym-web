-- ============================================================
-- OSCAR GALVAN GYM WEB — Datos iniciales (seed)
-- EJECUTAR DESPUÉS de 01_schema.sql
--
-- IMPORTANTE: Antes de ejecutar este script, necesitás crear
-- los usuarios en Supabase Auth manualmente o via API.
-- Este script asume que ya existen los auth.users con estos IDs.
--
-- Pasos previos:
-- 1. Ve a Supabase Dashboard → Authentication → Users
-- 2. Clic en "Add user" para cada usuario:
--    - admin@gym.com / Admin123!
--    - entrenador@gym.com / Entrenador123!
--    - alumno@gym.com / Alumno123!
-- 3. Copiá los UUIDs generados y reemplazá abajo.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- REEMPLAZÁ estos UUIDs con los reales de tu Supabase Auth
-- Encontrás los UUIDs en: Authentication → Users → columna "UID"
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_admin_id       UUID := 'a5bfd392-e3b5-4e79-8dbb-b93a00f23863'; -- admin@gym.com
  v_entrenador_id  UUID := '45675a85-4104-43b3-8983-eccc30f02552'; -- entrenador@gym.com
  v_alumno_id      UUID := 'b8ba8c3d-fa02-458c-8544-c02cf5417939'; -- alumno@gym.com

  v_entrenador_ref UUID;
  v_alumno_ref     UUID;
  v_memb_basico    UUID;
  v_memb_trimest   UUID;
  v_memb_person    UUID;
  v_ej1 UUID; v_ej2 UUID; v_ej3 UUID; v_ej4 UUID;
  v_ej5 UUID; v_ej6 UUID; v_ej7 UUID; v_ej8 UUID;
  v_rutina1 UUID;
BEGIN

  -- ── Perfiles ──────────────────────────────────────────────
  INSERT INTO perfiles (id, nombre, apellido, rol, activo) VALUES
    (v_admin_id,      'Oscar',   'Galvan',    'admin',      true),
    (v_entrenador_id, 'Carlos',  'Ramos',     'entrenador', true),
    (v_alumno_id,     'Lucas',   'Fernández', 'alumno',     true)
  ON CONFLICT (id) DO UPDATE SET activo = true;

  -- ── Entrenador ────────────────────────────────────────────
  INSERT INTO entrenadores (id, perfil_id, especialidad, activo)
  SELECT uuid_generate_v4(), v_entrenador_id, 'Musculación y fuerza', true
  WHERE NOT EXISTS (SELECT 1 FROM entrenadores WHERE perfil_id = v_entrenador_id)
  RETURNING id INTO v_entrenador_ref;

  -- ── Configuración del gimnasio ────────────────────────────
  INSERT INTO configuracion_gimnasio (
    nombre, slogan, frase_hero, subfrase_hero,
    whatsapp, instagram, direccion,
    cbu, alias_cbu, mostrar_precios
  ) VALUES (
    'Oscar Galvan Fuerza y Musculacion',
    'FUERZA. DISCIPLINA. RESULTADOS.',
    'TRANSFORMA TU CUERPO, TRANSFORMA TU VIDA',
    'Entrenamiento personalizado para resultados reales. Sin excusas.',
    '+5492615551234',
    'oscargalvanfym',
    'Av. San Martín 1234, Godoy Cruz, Mendoza',
    '0000003100012345678900',
    'OSCAR.GYM.FUERZA',
    true
  );

  -- ── Membresías ────────────────────────────────────────────
  INSERT INTO membresias (id, nombre, precio, duracion_dias, descripcion) VALUES
    (uuid_generate_v4(), 'Plan Básico',        8000,  30,  'Acceso completo al gimnasio')
    RETURNING id INTO v_memb_basico;

  INSERT INTO membresias (id, nombre, precio, duracion_dias, descripcion) VALUES
    (uuid_generate_v4(), 'Plan 3 Meses',       21000, 90,  'Ahorrás 15% pagando trimestral')
    RETURNING id INTO v_memb_trimest;

  INSERT INTO membresias (id, nombre, precio, duracion_dias, descripcion) VALUES
    (uuid_generate_v4(), 'Plan Personalizado', 15000, 30,  'Rutina + seguimiento con entrenador')
    RETURNING id INTO v_memb_person;

  -- ── Alumno demo ───────────────────────────────────────────
  INSERT INTO alumnos (
    id, perfil_id, entrenador_id,
    nombre, apellido, dni, email, telefono, fecha_nacimiento,
    estado
  ) VALUES (
    uuid_generate_v4(), v_alumno_id, v_entrenador_ref,
    'Lucas', 'Fernández', '38521478',
    'lucas.fdez@email.com', '+5492614501234', '1995-03-12',
    'activo'
  ) RETURNING id INTO v_alumno_ref;

  -- Más alumnos demo (sin cuenta de usuario)
  INSERT INTO alumnos (nombre, apellido, dni, email, telefono, entrenador_id, estado, fecha_nacimiento) VALUES
    ('Valentina', 'Rios',    '41236589', 'vale.rios@email.com',    '+5492614509876', v_entrenador_ref, 'activo',  '1999-07-22'),
    ('Marcos',    'Suárez',  '35698741', 'marcos.suarez@email.com','+5492614503456', v_entrenador_ref, 'moroso',  '1990-11-05'),
    ('Sofía',     'Montiel', '43210987', 'sofi.montiel@email.com', '+5492614502222', v_entrenador_ref, 'activo',  '2001-04-18'),
    ('Diego',     'Peralta', '37852369', 'dperalta@email.com',     '+5492614508888', v_entrenador_ref, 'inactivo','1993-09-30'),
    ('Marina',    'Torres',  '40125698', 'marina.torres@email.com','+5492614507777', v_entrenador_ref, 'activo',  '1997-12-03');

  -- ── Pagos demo ────────────────────────────────────────────
  INSERT INTO pagos (alumno_id, membresia_id, monto, fecha_pago, fecha_vencimiento, metodo, estado)
  SELECT id, v_memb_person, 15000, '2026-05-05', '2026-06-05', 'transferencia', 'activo'
  FROM alumnos WHERE dni = '38521478';

  INSERT INTO pagos (alumno_id, membresia_id, monto, fecha_pago, fecha_vencimiento, metodo, estado)
  SELECT id, v_memb_basico, 8000, '2026-05-18', '2026-06-18', 'efectivo', 'activo'
  FROM alumnos WHERE dni = '41236589';

  INSERT INTO pagos (alumno_id, membresia_id, monto, fecha_pago, fecha_vencimiento, metodo, estado)
  SELECT id, v_memb_basico, 8000, '2026-04-01', '2026-05-01', 'transferencia', 'vencido'
  FROM alumnos WHERE dni = '35698741';

  -- ── Ejercicios demo ───────────────────────────────────────
  INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, dificultad, created_by) VALUES
    ('Sentadilla Libre',         'Piernas',      'Ejercicio rey del tren inferior.',         'intermedio',   v_entrenador_id) RETURNING id INTO v_ej1;
  INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, dificultad, created_by) VALUES
    ('Press Banca Plano',        'Pecho',        'Empuje horizontal con barra.',             'intermedio',   v_entrenador_id) RETURNING id INTO v_ej2;
  INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, dificultad, created_by) VALUES
    ('Peso Muerto Convencional', 'Espalda baja', 'Tirón desde el piso con barra.',           'avanzado',     v_entrenador_id) RETURNING id INTO v_ej3;
  INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, dificultad, created_by) VALUES
    ('Dominadas',                'Espalda',      'Tirón vertical con peso corporal.',        'intermedio',   v_entrenador_id) RETURNING id INTO v_ej4;
  INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, dificultad, created_by) VALUES
    ('Press Militar',            'Hombros',      'Empuje vertical con barra.',              'intermedio',   v_entrenador_id) RETURNING id INTO v_ej5;
  INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, dificultad, created_by) VALUES
    ('Curl Bíceps',              'Bíceps',       'Flexión de codo con mancuerna.',          'principiante', v_entrenador_id) RETURNING id INTO v_ej6;
  INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, dificultad, created_by) VALUES
    ('Hip Thrust',               'Glúteos',      'Empuje de cadera con barra.',             'intermedio',   v_entrenador_id) RETURNING id INTO v_ej7;
  INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, dificultad, created_by) VALUES
    ('Plancha Abdominal',        'Core',         'Isometría de core en posición horizontal.','principiante',v_entrenador_id) RETURNING id INTO v_ej8;

  -- ── Rutina demo ───────────────────────────────────────────
  INSERT INTO rutinas (nombre, descripcion, entrenador_id, alumno_id, activa)
  VALUES (
    'Fuerza Hipertrofia A/B',
    'Rutina dividida en dos días para ganancias de fuerza e hipertrofia.',
    v_entrenador_ref, v_alumno_ref, true
  ) RETURNING id INTO v_rutina1;

  -- Ejercicios de la rutina — Día A
  INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id, dia, series, repeticiones, descanso_seg, orden, notas) VALUES
    (v_rutina1, v_ej2, 'Día A — Empujes', 4, '8-10', 90, 1, 'Controlá la bajada 3 segundos.'),
    (v_rutina1, v_ej5, 'Día A — Empujes', 3, '10',   75, 2, ''),
    (v_rutina1, v_ej8, 'Día A — Empujes', 3, '45 seg',45, 3, '');

  -- Ejercicios de la rutina — Día B
  INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id, dia, series, repeticiones, descanso_seg, orden, notas) VALUES
    (v_rutina1, v_ej4, 'Día B — Jalones', 4, 'máx',  90,  1, 'Si no llegás a 5, usá asistencia.'),
    (v_rutina1, v_ej3, 'Día B — Jalones', 3, '5',    120, 2, 'Espalda recta en todo momento.'),
    (v_rutina1, v_ej1, 'Día B — Jalones', 4, '8',    90,  3, 'Profundidad parallel o más.');

  -- ── Seguimiento físico inicial ────────────────────────────
  INSERT INTO seguimiento_fisico (alumno_id, peso_kg, altura_cm, cintura_cm, fecha) VALUES
    (v_alumno_ref, 82.0, 175, 88.0, '2026-03-01'),
    (v_alumno_ref, 80.5, 175, 86.5, '2026-04-01'),
    (v_alumno_ref, 78.5, 175, 85.0, '2026-05-01');

  -- ── Asistencias recientes ─────────────────────────────────
  INSERT INTO asistencias (alumno_id, fecha, hora, metodo) VALUES
    (v_alumno_ref, CURRENT_DATE - 1, '18:30', 'qr'),
    (v_alumno_ref, CURRENT_DATE - 2, '18:45', 'qr'),
    (v_alumno_ref, CURRENT_DATE - 4, '19:00', 'manual');

  RAISE NOTICE 'Seed cargado exitosamente ✅';
END $$;
