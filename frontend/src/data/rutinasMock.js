export const ejerciciosMock = [
  { id: 'e1', nombre: 'Sentadilla Libre', grupo: 'Piernas', descripcion: 'Ejercicio rey del tren inferior.', imagenUrl: null, videoUrl: 'https://youtube.com/watch?v=example1' },
  { id: 'e2', nombre: 'Press Banca Plano', grupo: 'Pecho', descripcion: 'Empuje horizontal con barra.', imagenUrl: null, videoUrl: null },
  { id: 'e3', nombre: 'Peso Muerto Convencional', grupo: 'Espalda baja', descripcion: 'Tirón desde el piso.', imagenUrl: null, videoUrl: null },
  { id: 'e4', nombre: 'Dominadas', grupo: 'Espalda', descripcion: 'Tirón vertical con peso corporal.', imagenUrl: null, videoUrl: null },
  { id: 'e5', nombre: 'Press Militar', grupo: 'Hombros', descripcion: 'Empuje vertical con barra.', imagenUrl: null, videoUrl: null },
  { id: 'e6', nombre: 'Curl Bíceps', grupo: 'Bíceps', descripcion: 'Flexión de codo con mancuerna o barra.', imagenUrl: null, videoUrl: null },
  { id: 'e7', nombre: 'Tríceps Polea', grupo: 'Tríceps', descripcion: 'Extensión de codo en polea alta.', imagenUrl: null, videoUrl: null },
  { id: 'e8', nombre: 'Peso Muerto Rumano', grupo: 'Isquiotibiales', descripcion: 'Variante rumana para isquios y glúteos.', imagenUrl: null, videoUrl: null },
  { id: 'e9', nombre: 'Hip Thrust', grupo: 'Glúteos', descripcion: 'Empuje de cadera para glúteos.', imagenUrl: null, videoUrl: null },
  { id: 'e10', nombre: 'Plancha Abdominal', grupo: 'Core', descripcion: 'Isometría de core.', imagenUrl: null, videoUrl: null },
]

export const rutinasMock = [
  {
    id: 'r1',
    nombre: 'Fuerza Hipertrofia A/B',
    descripcion: 'Rutina dividida en dos días para ganancias de fuerza e hipertrofia.',
    entrenadorId: '1',
    entrenador: 'Carlos Ramos',
    alumnoId: '1',
    alumno: 'Lucas Fernández',
    fechaInicio: '2026-05-01',
    fechaFin: null,
    activa: true,
    dias: [
      {
        dia: 'Día A — Empujes',
        ejercicios: [
          { ejercicioId: 'e2', nombre: 'Press Banca Plano',  series: 4, repeticiones: '8-10', descanso: 90, notas: 'Controlá la bajada 3 segundos.' },
          { ejercicioId: 'e5', nombre: 'Press Militar',      series: 3, repeticiones: '10',   descanso: 75, notas: '' },
          { ejercicioId: 'e7', nombre: 'Tríceps Polea',      series: 3, repeticiones: '12-15',descanso: 60, notas: 'Codo fijo al costado.' },
          { ejercicioId: 'e10',nombre: 'Plancha Abdominal',  series: 3, repeticiones: '45 seg',descanso:45, notas: '' },
        ]
      },
      {
        dia: 'Día B — Jalones',
        ejercicios: [
          { ejercicioId: 'e4', nombre: 'Dominadas',             series: 4, repeticiones: 'máx', descanso: 90, notas: 'Si no llegás a 5, usá asistencia.' },
          { ejercicioId: 'e3', nombre: 'Peso Muerto Convencional',series:3,repeticiones:'5',   descanso:120,notas:'Espalda recta en todo momento.' },
          { ejercicioId: 'e6', nombre: 'Curl Bíceps',           series: 3, repeticiones: '10-12',descanso:60, notas: '' },
          { ejercicioId: 'e1', nombre: 'Sentadilla Libre',       series: 4, repeticiones: '8',  descanso: 90, notas: 'Profundidad parallel o más.' },
        ]
      }
    ]
  },
  {
    id: 'r2',
    nombre: 'Full Body Tonificación',
    descripcion: 'Rutina de cuerpo completo 3 veces por semana para tonificar y mejorar condición.',
    entrenadorId: '1',
    entrenador: 'Carlos Ramos',
    alumnoId: '2',
    alumno: 'Valentina Rios',
    fechaInicio: '2026-05-10',
    fechaFin: null,
    activa: true,
    dias: [
      {
        dia: 'Día A / C — Cuerpo Completo',
        ejercicios: [
          { ejercicioId: 'e1', nombre: 'Sentadilla Libre', series: 3, repeticiones: '12', descanso: 60, notas: 'Peso moderado, técnica perfecta.' },
          { ejercicioId: 'e2', nombre: 'Press Banca',      series: 3, repeticiones: '12', descanso: 60, notas: '' },
          { ejercicioId: 'e4', nombre: 'Dominadas Asistidas',series:3,repeticiones:'8',  descanso: 60, notas: '' },
          { ejercicioId: 'e10',nombre: 'Plancha',          series: 3, repeticiones: '30 seg',descanso:45,notas:'' },
        ]
      }
    ]
  },
  {
    id: 'r3',
    nombre: 'Glúteos y Piernas',
    descripcion: 'Enfoque en tren inferior femenino con énfasis en glúteos.',
    entrenadorId: '2',
    entrenador: 'Ana Pérez',
    alumnoId: '4',
    alumno: 'Sofía Montiel',
    fechaInicio: '2026-04-15',
    fechaFin: null,
    activa: true,
    dias: [
      {
        dia: 'Día Glúteos + Piernas',
        ejercicios: [
          { ejercicioId: 'e9', nombre: 'Hip Thrust',         series: 4, repeticiones: '12', descanso: 75, notas: 'Empuje fuerte arriba, pausa 1 seg.' },
          { ejercicioId: 'e8', nombre: 'Peso Muerto Rumano', series: 3, repeticiones: '10', descanso: 75, notas: '' },
          { ejercicioId: 'e1', nombre: 'Sentadilla Sumo',    series: 3, repeticiones: '15', descanso: 60, notas: 'Apertura amplia de piernas.' },
          { ejercicioId: 'e10',nombre: 'Plancha Lateral',    series: 3, repeticiones: '30 seg c/lado',descanso:45,notas:'' },
        ]
      }
    ]
  }
]

export const getRutinaByAlumnoId = (alumnoId) => rutinasMock.find(r => r.alumnoId === alumnoId && r.activa)
export const getRutinaById       = (id) => rutinasMock.find(r => r.id === id)
