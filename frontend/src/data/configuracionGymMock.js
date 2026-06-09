// Datos configurables del gimnasio — se reemplazarán con Supabase
export const configuracionGym = {
  nombre:         'Oscar Galvan Fuerza y Musculacion',
  slogan:         'FUERZA. DISCIPLINA. RESULTADOS.',
  fraseHero:      'TRANSFORMA TU CUERPO, TRANSFORMA TU VIDA',
  subfraseHero:   'Entrenamiento personalizado para resultados reales. Sin excusas.',
  whatsapp:       '+5492615551234',
  whatsappMensaje:'Hola! Quiero consultar sobre los planes del gimnasio.',
  instagram:      'oscargalvanfym',
  direccion:      'Av. San Martín 1234, Godoy Cruz, Mendoza',
  horarios:       [
    { dia: 'Lunes a Viernes', horario: '07:00 a 13:00 / 16:00 a 22:00' },
    { dia: 'Sábados',         horario: '08:00 a 13:00' },
    { dia: 'Domingos',        horario: 'Cerrado' },
  ],
  cbu:            '0000003100012345678900',
  alias:          'OSCAR.GYM.FUERZA',
  logoUrl:        null,             // reemplazar con URL de Supabase Storage
  colorPrimario:  '#6B21A8',
  colorAcento:    '#EAB308',

  planes: [
    { nombre: 'Plan Básico',      precio: 8000,  duracion: '1 mes',  descripcion: 'Acceso completo al gimnasio' },
    { nombre: 'Plan 3 Meses',     precio: 21000, duracion: '3 meses',descripcion: 'Ahorra 15% en planes trimestrales' },
    { nombre: 'Plan Personalizado',precio: 15000,duracion: '1 mes',  descripcion: 'Rutina + seguimiento con entrenador' },
  ],

  servicios: [
    { icono: '💪', titulo: 'Musculación',        descripcion: 'Sala completa con equipamiento moderno para fuerza y volumen.' },
    { icono: '🏃', titulo: 'Cardio',             descripcion: 'Caminadoras, bicicletas y elípticas de última generación.' },
    { icono: '📋', titulo: 'Rutinas Personalizadas', descripcion: 'Planes de entrenamiento adaptados a tus objetivos.' },
    { icono: '🥗', titulo: 'Nutrición',          descripcion: 'Guía nutricional para potenciar tus resultados.' },
    { icono: '📊', titulo: 'Seguimiento Físico', descripcion: 'Control de medidas y progreso cada 30 días.' },
    { icono: '🚶', titulo: 'Grupos de Caminata', descripcion: 'Salidas grupales guiadas los sábados por la mañana.' },
  ],

  caminatas: {
    titulo:      'Grupos de Caminata',
    descripcion: 'Actividad cardiovascular al aire libre, ideal para comenzar tu camino fitness. Todos los niveles bienvenidos.',
    dias:        'Sábados 8:00 hs',
    lugar:       'Parque General San Martín, Mendoza',
    duracion:    '45 a 60 minutos',
    instructor:  'Oscar Galvan',
  },

  beneficios: [
    { titulo: 'Entrenamiento Personalizado', desc: 'Cada alumno tiene su rutina adaptada a sus objetivos y condición física.' },
    { titulo: 'Seguimiento Real',            desc: 'Control mensual de medidas, pesos y progreso documentado.' },
    { titulo: 'Comunidad',                   desc: 'Un ambiente motivador donde todos se apoyan mutuamente.' },
    { titulo: 'Flexibilidad de Horarios',    desc: 'Amplio rango horario para que entrenes cuando puedas.' },
  ],

  ubicacionMapsUrl: 'https://maps.google.com/?q=Av+San+Martin+1234+Godoy+Cruz+Mendoza',
  mapaEmbed:        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26785!2d-68.85!3d-32.91!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDU0!5e0!3m2!1ses!2sar!4v1',
}
