export const horariosMock = [
  { dia: 'Lunes',    apertura: '07:00', cierre: '22:00', turnoTarde: '16:00', abierto: true },
  { dia: 'Martes',   apertura: '07:00', cierre: '22:00', turnoTarde: '16:00', abierto: true },
  { dia: 'Miércoles',apertura: '07:00', cierre: '22:00', turnoTarde: '16:00', abierto: true },
  { dia: 'Jueves',   apertura: '07:00', cierre: '22:00', turnoTarde: '16:00', abierto: true },
  { dia: 'Viernes',  apertura: '07:00', cierre: '22:00', turnoTarde: '16:00', abierto: true },
  { dia: 'Sábados',  apertura: '08:00', cierre: '13:00', turnoTarde: null,    abierto: true },
  { dia: 'Domingos', apertura: null,    cierre: null,    turnoTarde: null,    abierto: false },
]

export const asistenciasMock = [
  { id: 'a1', alumnoId:'1', alumno:'Lucas Fernández',  fecha:'2026-06-02', hora:'18:30', metodo:'qr' },
  { id: 'a2', alumnoId:'2', alumno:'Valentina Rios',   fecha:'2026-06-02', hora:'09:15', metodo:'qr' },
  { id: 'a3', alumnoId:'4', alumno:'Sofía Montiel',    fecha:'2026-06-02', hora:'17:00', metodo:'manual' },
  { id: 'a4', alumnoId:'6', alumno:'Marina Torres',    fecha:'2026-06-02', hora:'10:00', metodo:'qr' },
  { id: 'a5', alumnoId:'1', alumno:'Lucas Fernández',  fecha:'2026-06-01', hora:'18:45', metodo:'qr' },
  { id: 'a6', alumnoId:'2', alumno:'Valentina Rios',   fecha:'2026-06-01', hora:'08:50', metodo:'qr' },
  { id: 'a7', alumnoId:'3', alumno:'Marcos Suárez',    fecha:'2026-05-30', hora:'20:00', metodo:'manual' },
]

export const getAsistenciasHoy = () => {
  const hoy = new Date().toISOString().split('T')[0]
  return asistenciasMock.filter(a => a.fecha === hoy)
}
