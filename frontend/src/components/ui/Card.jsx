export default function Card({ children, className = '', hover = true, accent = false }) {
  return (
    <div className={`
      bg-gym-card border rounded-xl p-5 transition-all duration-300
      ${accent ? 'border-gym-purple/50 shadow-gym' : 'border-gym-border'}
      ${hover ? 'hover:border-gym-purple/40 hover:shadow-gym-hover cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
