import { useRef } from 'react'
import { Camera, X } from 'lucide-react'

export default function ImageUploader({ value, onChange, shape = 'circle', label = 'Upload Photo', className = '' }) {
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  const isCircle = shape === 'circle'

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer overflow-hidden
          ${isCircle ? 'w-28 h-28 rounded-full' : 'w-full h-40 rounded-xl'}
          bg-cream-200 border-2 border-dashed border-cream-300
          hover:border-forest-400 hover:bg-cream-100 transition-all duration-200 group`}
      >
        {value
          ? <>
              <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </>
          : <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-bark-400">
              <Camera size={28} />
              <span className="text-xs font-body text-center px-2">{label}</span>
            </div>
        }
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <button type="button" onClick={() => onChange(null)}
                className="flex items-center gap-1 text-xs text-bark-400 hover:text-red-500 transition-colors">
          <X size={12} /> Remove
        </button>
      )}
    </div>
  )
}
