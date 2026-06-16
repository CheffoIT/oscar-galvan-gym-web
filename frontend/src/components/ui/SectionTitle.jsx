export default function SectionTitle({ title, subtitle, accent = 'yellow', align = 'center', className = '' }) {
  const alignClass = { center: 'text-center items-center', left: 'text-left items-start' }
  const accentLine = { yellow: 'bg-gym-yellow', purple: 'bg-gym-purple' }

  return (
    <div className={`flex flex-col gap-3 ${alignClass[align]} ${className}`}>
      <h2 className="font-display text-4xl md:text-5xl tracking-wider uppercase text-gym-white">
        {title}
      </h2>
      <div className={`h-1 w-16 rounded-full ${accentLine[accent]}`} />
      {subtitle && (
        <p className="text-gym-gray max-w-xl text-sm md:text-base leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}
