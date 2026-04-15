import { Plus } from 'lucide-react'

export default function FloatingActionButton({ onClick, label = 'Add' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-6 z-30 w-[56px] h-[56px] bg-[#2D6A4F] hover:bg-forest-600 active:bg-forest-700
                 text-white rounded-full shadow-lg flex items-center justify-center
                 transition-all duration-200 animate-soft-pulse"
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  )
}
