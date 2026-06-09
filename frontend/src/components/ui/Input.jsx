export default function Input({ label, id, type = 'text', placeholder, value, onChange, error, icon, required = false, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gym-gray">
          {label} {required && <span className="text-gym-yellow">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gym-grays text-lg">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`
            w-full bg-gym-dark border text-gym-white placeholder:text-gym-grays
            rounded-lg px-4 py-3 text-sm
            focus:outline-none focus:ring-1 transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-700 focus:border-red-500 focus:ring-red-500/30'
              : 'border-gym-border focus:border-gym-purple focus:ring-gym-purple/30'}
          `}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
