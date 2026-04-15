const ROLE_BG = {
  Farmer:   'bg-[#2D6A4F]',
  Vendor:   'bg-[#2563EB]',
  Supplier: 'bg-[#EA580C]',
}

export default function Avatar({ src, name = '', role, size = 'md', className = '' }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?'
  const sizeMap = {
    xs:  'w-7 h-7 text-xs',
    sm:  'w-9 h-9 text-sm',
    md:  'w-12 h-12 text-base',
    lg:  'w-16 h-16 text-xl',
    xl:  'w-24 h-24 text-3xl',
    '2xl': 'w-32 h-32 text-4xl',
  }
  const roleBg = ROLE_BG[role] ?? 'bg-bark-500'
  return (
    <div className={`rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm ${sizeMap[size]} ${className}`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <div className={`w-full h-full flex items-center justify-center ${roleBg} text-white font-display font-bold`}>
            {initials}
          </div>
      }
    </div>
  )
}
