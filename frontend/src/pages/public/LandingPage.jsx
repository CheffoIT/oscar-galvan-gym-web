import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import SectionTitle from '../../components/ui/SectionTitle'
import { configuracionGym as mockConfig } from '../../data/configuracionGymMock'
import { getConfiguracion, getMembresias } from '../../services/api'

export default function LandingPage() {
  const [gymData, setGymData] = useState(mockConfig)

  // Cargar configuración y planes reales desde Supabase
  useEffect(() => {
    Promise.all([getConfiguracion(), getMembresias()]).then(
      ([{ data: confData }, { data: planesData }]) => {
        setGymData(prev => ({
          ...prev,
          ...(confData ? {
            nombre:       confData.nombre        || prev.nombre,
            slogan:       confData.slogan        || prev.slogan,
            fraseHero:    confData.frase_hero    || prev.fraseHero,
            subfraseHero: confData.subfrase_hero || prev.subfraseHero,
            whatsapp:     confData.whatsapp      || prev.whatsapp,
            instagram:    confData.instagram     || prev.instagram,
            direccion:    confData.direccion     || prev.direccion,
            cbu:          confData.cbu           || prev.cbu,
            alias:        confData.alias_cbu     || prev.alias,
            mostrarPrecios: confData.mostrar_precios ?? prev.mostrarPrecios,
            logo_url:     confData.logo_url      || prev.logo_url,
            // Caminatas
            caminatas: {
              ...prev.caminatas,
              dias:        confData.caminatas_dias        || prev.caminatas?.dias,
              lugar:       confData.caminatas_lugar       || prev.caminatas?.lugar,
              duracion:    confData.caminatas_duracion    || prev.caminatas?.duracion,
              instructor:  confData.caminatas_instructor  || prev.caminatas?.instructor,
              descripcion: confData.caminatas_descripcion || prev.caminatas?.descripcion,
            },
            // Horarios individuales por día
            horarios: confData.horario_lunes ? [
              { dia: 'Lunes',      horario: confData.horario_lunes     || 'Cerrado' },
              { dia: 'Martes',     horario: confData.horario_martes    || 'Cerrado' },
              { dia: 'Miércoles',  horario: confData.horario_miercoles || 'Cerrado' },
              { dia: 'Jueves',     horario: confData.horario_jueves    || 'Cerrado' },
              { dia: 'Viernes',    horario: confData.horario_viernes   || 'Cerrado' },
              { dia: 'Sábados',    horario: confData.horario_sabado    || 'Cerrado' },
              { dia: 'Domingos',   horario: confData.horario_domingo   || 'Cerrado' },
            ] : prev.horarios,
            // Servicios y beneficios
            servicios:  confData.servicios  || prev.servicios,
            beneficios: confData.beneficios || prev.beneficios,
          } : {}),
          // Planes desde Supabase (convertir formato de BD al formato del mock)
          planes: planesData?.length ? planesData.map(p => ({
            nombre:      p.nombre,
            precio:      parseFloat(p.precio),
            duracion:    `${p.duracion_dias} días`,
            descripcion: p.descripcion,
          })) : prev.planes,
        }))
      }
    )
  }, [])

  const { nombre, slogan, fraseHero, subfraseHero, horarios, servicios,
          caminatas, beneficios, planes, ubicacionMapsUrl, instagram,
          mostrarPrecios, direccion, whatsapp } = gymData

  const waUrl = `https://wa.me/${(whatsapp||'').replace(/\D/g,'')}?text=${encodeURIComponent(gymData.whatsappMensaje||'Hola! Quiero consultar.')}`

  return (
    <div className="bg-gym-black text-gym-white min-h-screen">
      <Navbar publicMode />

      {/* ── HERO ─────────────────────────────────────── */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #050505 0%, #0d0520 40%, #1a0540 70%, #050505 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gym-purple/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gym-yellow/5 rounded-full blur-3xl pointer-events-none" />

        {/* Diagonal stripes decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute bg-gym-purple h-px w-full"
              style={{ top: `${i * 14}%`, transform: `rotate(-5deg) scaleX(1.5)` }} />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
          {/* Pre-title */}
          <p className="text-gym-yellow text-sm font-semibold tracking-[0.3em] uppercase mb-6 animate-fade-up">
            ★ Entrenamiento Personalizado ★
          </p>

          {/* Logo del gimnasio (si existe) */}
          {gymData.logo_url ? (
            <div className="flex justify-center mb-6 animate-fade-up">
              <img
                src={gymData.logo_url}
                alt={nombre}
                className="w-40 h-40 sm:w-52 sm:h-52 object-contain drop-shadow-[0_0_30px_rgba(107,33,168,0.6)]
                  animate-float rounded-full"
              />
            </div>
          ) : (
            <>
              {/* Texto del nombre si no hay logo */}
              <h1 className="font-display text-6xl sm:text-8xl md:text-9xl tracking-wider uppercase leading-none mb-4 animate-fade-up">
                <span className="text-gym-white">OSCAR</span>{' '}
                <span className="text-gym-yellow">GALVAN</span>
              </h1>
            </>
          )}

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-widest text-gym-purplel uppercase mb-6 animate-fade-up">
            FUERZA & MUSCULACIÓN
          </h2>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-20 bg-gym-purple" />
            <div className="w-2 h-2 bg-gym-yellow rotate-45" />
            <div className="h-px w-20 bg-gym-purple" />
          </div>

          {/* Sub headline */}
          <p className="text-gym-gray text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {subfraseHero}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-gym-yellow text-gym-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-gym-yellowl hover:shadow-yellow transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>📱</span> Consultar por WhatsApp
            </a>
            <a
              href="#planes"
              className="border border-gym-purple text-gym-purplel font-bold px-8 py-4 rounded-xl text-lg hover:bg-gym-purple/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>💪</span> Ver Planes
            </a>
          </div>

          {/* Stats rápidos */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { n: '+200', l: 'Alumnos' },
              { n: '5+',   l: 'Años de exp.' },
              { n: '100%', l: 'Personalizado' },
            ].map(({ n, l }) => (
              <div key={l} className="text-center">
                <p className="font-display text-3xl text-gym-yellow">{n}</p>
                <p className="text-gym-gray text-xs">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gym-purple/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-gym-yellow rounded-full" />
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ──────────────────────────────────── */}
      <section id="servicios" className="py-24 px-6 bg-gym-dark">
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            title="Nuestros Servicios"
            subtitle="Todo lo que necesitás para transformar tu cuerpo y superar tus límites."
            className="mb-14"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((s) => (
              <div
                key={s.titulo}
                className="bg-gym-card border border-gym-border rounded-xl p-6
                  hover:border-gym-purple/50 hover:shadow-gym transition-all duration-300
                  group relative overflow-hidden"
              >
                {/* Accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gym-purple rounded-l-xl
                  group-hover:bg-gym-yellow transition-colors duration-300" />
                <div className="text-4xl mb-4 ml-2">{s.icono}</div>
                <h3 className="font-display text-xl tracking-wider text-gym-white mb-2 ml-2">
                  {s.titulo}
                </h3>
                <p className="text-gym-gray text-sm leading-relaxed ml-2">{s.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ─────────────────────────────────── */}
      <section id="beneficios" className="py-24 px-6 bg-gym-black">
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            title="¿Por qué elegirnos?"
            subtitle="No somos un gimnasio cualquiera. Somos tu equipo de transformación."
            accent="purple"
            className="mb-14"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beneficios.map((b, i) => (
              <div
                key={b.titulo}
                className="flex gap-4 bg-gym-card border border-gym-border rounded-xl p-6
                  hover:border-gym-purple/40 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gym-yellow/10 border border-gym-yellow/30
                  rounded-lg flex items-center justify-center font-display text-gym-yellow text-xl">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gym-white mb-1">{b.titulo}</h3>
                  <p className="text-gym-gray text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HORARIOS ───────────────────────────────────── */}
      <section id="horarios" className="py-24 px-6 bg-gym-dark">
        <div className="max-w-3xl mx-auto">
          <SectionTitle
            title="Horarios"
            subtitle="Encontrá el momento perfecto para entrenar."
            className="mb-14"
          />
          <div className="bg-gym-card border border-gym-border rounded-2xl overflow-hidden">
            {horarios.map((h, i) => (
              <div
                key={h.dia}
                className={`flex items-center justify-between px-6 py-4 border-b border-gym-border last:border-b-0
                  ${i % 2 === 0 ? 'bg-transparent' : 'bg-gym-border/30'}`}
              >
                <span className="font-medium text-gym-white">{h.dia}</span>
                <span className={`text-sm font-semibold ${h.horario.includes('Cerrado') ? 'text-gym-grays' : 'text-gym-yellow'}`}>
                  {h.horario}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAMINATAS ──────────────────────────────────── */}
      <section id="caminatas" className="py-24 px-6 bg-gym-black">
        <div className="max-w-4xl mx-auto">
          <SectionTitle
            title="Grupos de Caminata"
            subtitle="Actividad cardiovascular al aire libre para todos los niveles."
            accent="purple"
            className="mb-14"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Info */}
            <div className="space-y-5">
              {[
                { icon: '📅', label: 'Días', value: caminatas.dias },
                { icon: '📍', label: 'Lugar', value: caminatas.lugar },
                { icon: '⏱️', label: 'Duración', value: caminatas.duracion },
                { icon: '👤', label: 'Instructor', value: caminatas.instructor },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gym-purple/20 border border-gym-purple/30 rounded-lg
                    flex items-center justify-center text-xl flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-gym-gray text-xs uppercase tracking-wider">{label}</p>
                    <p className="text-gym-white font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Card destacada */}
            <div className="bg-gym-card border-gradient rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🚶</div>
              <h3 className="font-display text-3xl text-gym-white tracking-wider mb-2">
                CAMINÁ CON NOSOTROS
              </h3>
              <p className="text-gym-gray text-sm mb-6 leading-relaxed">
                {caminatas.descripcion}
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-gym-yellow text-gym-black font-bold px-6 py-3 rounded-xl hover:bg-gym-yellowl transition-all inline-block"
              >
                Sumarme al grupo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANES ─────────────────────────────────────── */}
      {mostrarPrecios !== false && (
        <section id="planes" className="py-24 px-6 bg-gym-dark">
          <div className="max-w-5xl mx-auto">
            <SectionTitle
              title="Nuestros Planes"
              subtitle="Elegí el plan que mejor se adapta a tus objetivos."
              className="mb-14"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {planes.map((plan, i) => (
                <div
                  key={plan.nombre}
                  className={`bg-gym-card border rounded-2xl p-7 flex flex-col
                    transition-all duration-300 hover:shadow-gym
                    ${i === 1 ? 'border-gym-yellow shadow-yellow scale-105' : 'border-gym-border hover:border-gym-purple/50'}`}
                >
                  {i === 1 && (
                    <span className="bg-gym-yellow text-gym-black text-xs font-bold px-3 py-1 rounded-full self-start mb-4">
                      ⭐ MÁS POPULAR
                    </span>
                  )}
                  <h3 className="font-display text-2xl tracking-wider text-gym-white mb-1">{plan.nombre}</h3>
                  <p className="text-gym-gray text-xs mb-4">{plan.duracion}</p>
                  <p className="font-display text-4xl text-gym-yellow mb-2">
                    ${plan.precio.toLocaleString('es-AR')}
                  </p>
                  <p className="text-gym-gray text-sm mb-6 flex-1">{plan.descripcion}</p>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-center font-bold py-3 rounded-xl transition-all duration-200
                      ${i === 1
                        ? 'bg-gym-yellow text-gym-black hover:bg-gym-yellowl'
                        : 'border border-gym-purple text-gym-purplel hover:bg-gym-purple/20'}`}
                  >
                    Consultar
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── UBICACIÓN ──────────────────────────────────── */}
      <section id="ubicacion" className="py-24 px-6 bg-gym-black">
        <div className="max-w-5xl mx-auto">
          <SectionTitle
            title="Dónde estamos"
            subtitle={direccion}
            accent="purple"
            className="mb-14"
          />
          <div className="bg-gym-card border border-gym-border rounded-2xl overflow-hidden h-72 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-gym-white font-medium mb-2">{direccion}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(direccion)}`}
                target="_blank"
                rel="noreferrer"
                className="text-gym-yellow text-sm hover:underline"
              >
                Ver en Google Maps →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACTO ───────────────────────────────────── */}
      <section id="contacto" className="py-24 px-6 bg-gym-dark">
        <div className="max-w-3xl mx-auto text-center">
          <SectionTitle
            title="¿Listo para empezar?"
            subtitle="Contactanos por WhatsApp y te asesoramos sin compromiso."
            className="mb-10"
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-gym-yellow text-gym-black font-bold px-10 py-4 rounded-xl text-lg hover:bg-gym-yellowl hover:shadow-yellow transition-all flex items-center justify-center gap-2"
            >
              <span>📱</span> WhatsApp
            </a>
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noreferrer"
              className="border border-gym-purple text-gym-purplel font-bold px-10 py-4 rounded-xl text-lg hover:bg-gym-purple/20 transition-all flex items-center justify-center gap-2"
            >
              <span>📸</span> Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="bg-gym-black border-t border-gym-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gym-purple rounded-lg flex items-center justify-center text-white font-display">G</div>
            <span className="font-display text-lg tracking-wider">
              OSCAR GALVAN <span className="text-gym-yellow">GYM</span>
            </span>
          </div>
          <p className="text-gym-grays text-sm">{direccion}</p>
          <div className="flex items-center gap-4 text-sm text-gym-grays">
            <Link to="/login" className="hover:text-gym-yellow transition-colors">Acceso alumnos</Link>
            <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="hover:text-gym-yellow transition-colors">@{instagram}</a>
          </div>
        </div>
        <div className="text-center text-gym-grays text-xs mt-6 border-t border-gym-border pt-4">
          © {new Date().getFullYear()} Oscar Galvan Fuerza y Musculación — Todos los derechos reservados
        </div>
      </footer>

      {/* ── WhatsApp flotante ───────────────────────────── */}
      <a
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full shadow-lg
          flex items-center justify-center text-2xl hover:bg-green-400 hover:scale-110
          transition-all duration-200"
        title="Contactar por WhatsApp"
      >
        📱
      </a>
    </div>
  )
}
