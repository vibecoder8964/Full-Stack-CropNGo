const ROLE_COLOR = {
  Farmer:   'bg-[#F0FFF4] text-[#2D6A4F] border-[#95D5B2]',
  Vendor:   'bg-blue-50 text-[#2563EB] border-blue-200',
  Supplier: 'bg-orange-50 text-[#EA580C] border-orange-200',
}

const ROLE_DOT = {
  Farmer:   'bg-farmer',
  Vendor:   'bg-vendor',
  Supplier: 'bg-supplier',
}

export default function RoleBadge({ role, size = 'sm' }) {
  if (!role) return null
  const sizeClass = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill border font-body font-semibold ${ROLE_COLOR[role] ?? 'bg-gray-100 text-gray-700'} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[role] ?? 'bg-gray-400'}`} />
      {role}
    </span>
  )
}
