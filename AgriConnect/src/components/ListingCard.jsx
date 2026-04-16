import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import RoleBadge from './RoleBadge'
import StarRating from './StarRating'
import { MapPin } from 'lucide-react'

const CATEGORY_STYLES = {
  Paddy: { bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', emoji: '🌾', color: 'text-forest-600' },
  Durian: { bg: 'linear-gradient(135deg, #fff8e1, #ffecb3)', emoji: '🥭', color: 'text-amber-600' },
  Fruits: { bg: 'linear-gradient(135deg, #fff8e1, #ffecb3)', emoji: '🍎', color: 'text-amber-600' },
  Vegetables: { bg: 'linear-gradient(135deg, #f1f8e9, #dcedc8)', emoji: '🥬', color: 'text-[#65a30d]' },
  Machinery: { bg: 'linear-gradient(135deg, #e8eaf6, #c5cae9)', emoji: '🚜', color: 'text-indigo-600' },
  Tools: { bg: 'linear-gradient(135deg, #e8eaf6, #c5cae9)', emoji: '🔧', color: 'text-indigo-600' },
  Equipment: { bg: 'linear-gradient(135deg, #e8eaf6, #c5cae9)', emoji: '🚜', color: 'text-indigo-600' },
  default: { bg: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)', emoji: '📦', color: 'text-bark-500' }
}

export default function ListingCard({ listing }) {
  const navigate = useNavigate()
  const { name, description, price, unit, category, sellerId, sellerName, sellerRole,
          rating, reviewCount, distance } = listing

  // Resolve styles precisely
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.default

  return (
    <div className="card flex flex-col rounded-2xl bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden text-left border border-cream-200 mx-auto w-full">
      
      {/* Category Gradient Hero / Product Image */}
      <div 
        className="h-44 flex items-center justify-center relative overflow-hidden"
        style={{ background: listing.imageUrl ? undefined : style.bg }}
      >
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl drop-shadow-sm select-none">{style.emoji}</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Uppercase Dynamic Pill */}
        <span className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${style.color}`}>
          {category}
        </span>

        {/* Root Serif Product Mapping */}
        <h3 className="font-display font-bold text-[17px] text-[#1A1A1A] leading-snug line-clamp-2 mb-1.5">
          {name}
        </h3>

        {/* Strict Line Clamp Descriptor */}
        <p className="text-[13px] text-bark-400 font-body line-clamp-2 flex-1 mb-3">
          {description}
        </p>

        {/* Pricing Layout Flow */}
        <div className="flex items-center justify-between mb-3">
          {price
            ? <span className="text-xl font-display font-bold text-[#2D6A4F]">RM {price.toLocaleString()} <span className="text-[11px] font-body text-bark-400 tracking-normal ml-0.5">{unit}</span></span>
            : <span className="font-body text-[13px] text-bark-400 italic font-semibold">Negotiable</span>
          }
          
          <div className="flex items-center gap-1 bg-[#F0EBE0] px-2 py-0.5 rounded-full text-bark-500">
            <MapPin size={10} className="opacity-80" />
            <span className="text-[11px] font-body font-bold">
              {typeof distance === 'number' ? `${distance.toFixed(1)} km` : 'Local'}
            </span>
          </div>
        </div>

        {/* Star Density */}
        <div className="flex items-center gap-1 mb-3">
          <StarRating value={rating} readOnly size={13} />
          <span className="text-[11px] text-bark-400 font-semibold ml-0.5">({reviewCount})</span>
        </div>

        {/* Seller Navigation Root */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/app/profile/${sellerId}`) }}
          className="flex items-center gap-2.5 pt-3 border-t border-cream-200 hover:bg-cream-50/50 transition-colors w-full rounded-b-xl -mx-4 px-4 pb-1"
        >
          <Avatar name={sellerName} role={sellerRole} size="xs" className="shadow-sm ring-1 ring-cream-200" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-body font-bold text-bark-700">{sellerName}</span>
            <div className="scale-90 origin-left mt-0.5">
               <RoleBadge role={sellerRole} />
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
