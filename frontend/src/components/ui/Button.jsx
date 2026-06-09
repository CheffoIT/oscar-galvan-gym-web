export default function Button({ children, variant = 'primary', size = 'md', onClick, type = 'button', disabled = false, className = '', fullWidth = false }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variants = {
    primary:   'bg-gym-yellow text-gym-black hover:bg-gym-yellowl hover:shadow-yellow',
    secondary: 'border border-gym-purple text-gym-purplel hover:bg-gym-purple/20',
    danger:    'bg-red-700 text-white hover:bg-red-600',
    ghost:     'text-gym-gray hover:text-gym-white hover:bg-gym-border',
    outline:   'border border-gym-border text-gym-white hover:border-gym-purple',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
    xl: 'px-9 py-4 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
