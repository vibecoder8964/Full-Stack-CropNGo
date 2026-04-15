import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

export default function TagInput({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Type or select...',
  allowOther = false,
  max,
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)

  const filtered = options.filter(o =>
    o.toLowerCase().includes(query.toLowerCase()) && !selected.includes(o)
  )

  const add = (item) => {
    if (!item || selected.includes(item)) return
    if (max && selected.length >= max) return
    onChange([...selected, item])
    setQuery('')
    inputRef.current?.focus()
  }

  const remove = (item) => onChange(selected.filter(s => s !== item))

  const handleKey = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      const match = filtered[0]
      if (match) add(match)
      else if (allowOther) add(query.trim())
      e.preventDefault()
    }
    if (e.key === 'Backspace' && !query && selected.length) {
      remove(selected[selected.length - 1])
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      {label && <label className="label">{label}</label>}
      <div
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
        className="min-h-[48px] flex flex-wrap gap-1.5 p-2.5 bg-white border border-cream-300 rounded-xl
                   focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/20
                   cursor-text transition-all duration-200"
      >
        {selected.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-forest-100 text-forest-700 text-sm font-body
                                     px-2.5 py-1 rounded-pill animate-pop">
            {tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); remove(tag) }}
                    className="hover:text-red-500 transition-colors">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-bark-700 placeholder-bark-300 text-sm outline-none py-0.5"
        />
      </div>

      {open && (filtered.length > 0 || (allowOther && query.trim())) && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-cream-200 rounded-xl shadow-float
                       max-h-48 overflow-y-auto animate-slide-down">
          {filtered.map(o => (
            <li key={o}
                onMouseDown={() => add(o)}
                className="px-4 py-2.5 text-sm font-body text-bark-700 hover:bg-cream-100 cursor-pointer transition-colors">
              {o}
            </li>
          ))}
          {allowOther && query.trim() && !options.includes(query.trim()) && (
            <li onMouseDown={() => add(query.trim())}
                className="px-4 py-2.5 text-sm font-body text-forest-600 hover:bg-cream-100 cursor-pointer transition-colors border-t border-cream-200">
              Add "{query.trim()}"
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
