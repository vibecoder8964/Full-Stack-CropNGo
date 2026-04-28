import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import RoleBadge from './RoleBadge'

const CATEGORY_EMOJI = {
  'Paddy': '🌾', 'Durian': '🥭', 'Rambutan': '🍇', 'Mango': '🥭',
  'Vegetables': '🥬', 'Fruits': '🍎', 'Rubber': '🌿', 'Palm Oil': '🌴',
  'Banana': '🍌', 'Coconut': '🥥', 'Pineapple': '🍍', 'Corn': '🌽',
}

export default function WantedCard({ listing }) {
  const navigate = useNavigate()
  const { name, category, price, unit, sellerId, sellerName, sellerRole } = listing
  const emoji = CATEGORY_EMOJI[category] || '📦'

  return (
    <div 
      onClick={() => navigate(`/app/profile/${sellerId}`)}
      className="flex items-center gap-4 bg-white rounded-2xl border border-cream-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 cursor-pointer group w-full"
    >
      {/* Left: Category Emoji Pill */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200/60 flex items-center justify-center flex-shrink-0 shadow-inner-sm">
        <span className="text-2xl select-none">{emoji}</span>
      </div>

      {/* Middle: Name + Category */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-[16px] text-bark-700 leading-snug truncate group-hover:text-forest-700 transition-colors">
          {name}
        </h3>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 mt-0.5 block">
          {category}
        </span>
        <div className="flex items-center gap-2 mt-1.5">
          <Avatar name={sellerName} role={sellerRole} size="xs" className="shadow-sm ring-1 ring-cream-200" />
          <span className="text-xs font-body font-semibold text-bark-500 truncate">{sellerName}</span>
          <div className="scale-[0.85] origin-left">
            <RoleBadge role={sellerRole} />
          </div>
        </div>
      </div>

      {/* Right: Demanding Price */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-xs font-body text-bark-400 font-semibold uppercase tracking-wider">Wanted</span>
        {price ? (
          <>
            <span className="text-xl font-display font-bold text-[#C05621] leading-none mt-1">
              RM {price.toLocaleString()}
            </span>
            <span className="text-[11px] font-body text-bark-400 mt-0.5">/{unit}</span>
          </>
        ) : (
          <span className="text-sm font-body text-bark-400 italic font-semibold mt-1">Negotiable</span>
        )}
      </div>
    </div>
  )
}
