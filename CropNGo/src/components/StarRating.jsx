import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, size = 20, readOnly = false }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`transition-transform duration-100 ${!readOnly && 'hover:scale-110 active:scale-95'} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            size={size}
            className={`transition-colors duration-150 ${
              star <= display
                ? 'fill-amber-400 stroke-amber-400'
                : 'fill-none stroke-cream-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
