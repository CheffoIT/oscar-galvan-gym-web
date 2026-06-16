export const pagosMock = [
  { id: 'p1', alumnoId:'1', alumno:'Lucas Fernández',    plan:'Plan Personalizado',monto:15000, fechaPago:'2026-05-05', vencimiento:'2026-06-05', metodo:'transferencia', estado:'activo',   registradoPor:'Admin' },
  { id: 'p2', alumnoId:'2', alumno:'Valentina Rios',      plan:'Plan Básico',      monto:8000,  fechaPago:'2026-05-18', vencimiento:'2026-06-18', metodo:'efectivo',     estado:'activo',   registradoPor:'Admin' },
  { id: 'p3', alumnoId:'3', alumno:'Marcos Suárez',       plan:'Plan Básico',      monto:8000,  fechaPago:'2026-04-01', vencimiento:'2026-05-01', metodo:'transferencia', estado:'vencido',  registradoPor:'Admin' },
  { id: 'p4', alumnoId:'4', alumno:'Sofía Montiel',       plan:'Plan 3 Meses',     monto:21000, fechaPago:'2026-04-10', vencimiento:'2026-07-10', metodo:'transferencia', estado:'activo',   registradoPor:'Admin' },
  { id: 'p5', alumnoId:'6', alumno:'Marina Torres',       plan:'Plan Personalizado',monto:15000,fechaPago:'2026-05-20', vencimiento:'2026-06-20', metodo:'efectivo',     estado:'activo',   registradoPor:'Admin' },
  { id: 'p6', alumnoId:'1', alumno:'Lucas Fernández',    plan:'Plan Personalizado',monto:15000, fechaPago:'2026-04-05', vencimiento:'2026-05-05', metodo:'transferencia', estado:'vencido',  registradoPor:'Admin' },
  { id: 'p7', alumnoId:'3', alumno:'Marcos Suárez',       plan:'Plan Básico',      monto:8000,  fechaPago:'2026-03-01', vencimiento:'2026-04-01', metodo:'efectivo',     estado:'vencido',  registradoPor:'Admin' },
  { id: 'p8', alumnoId:'5', alumno:'Diego Peralta',       plan:'Plan Básico',      monto:7500,  fechaPago:'2025-12-01', vencimiento:'2026-01-01', metodo:'efectivo',     estado:'vencido',  registradoPor:'Admin' },
]

export const estadisticasPagos = {
  ingresosMes:         [
    { mes: 'Ene', total: 45000 },
    { mes: 'Feb', total: 52000 },
    { mes: 'Mar', total: 48000 },
    { mes: 'Abr', total: 58000 },
    { mes: 'May', total: 63000 },
    { mes: 'Jun', total: 38000 },
  ],
  totalMesActual:   63000,
  totalMesAnterior: 58000,
  pagosActivos:     4,
  pagosVencidos:    4,
}

export const getPagosActivos  = () => pagosMock.filter(p => p.estado === 'activo')
export const getPagosVencidos = () => pagosMock.filter(p => p.estado === 'vencido')
export const getPagosByAlumno = (alumnoId) => pagosMock.filter(p => p.alumnoId === alumnoId)
