import { useState } from 'react'
import { ChevronLeft, ChevronRight, User, ShoppingBag, Bot } from 'lucide-react'

const SLIDES = [
  {
    icon: <User size={48} className="text-white" />,
    title: 'Update Your Profile',
    desc: 'Keep your profile fresh — add photos, update your crops or tools, and let others know what you offer. Go to Profile → Edit anytime.',
    color: 'from-forest-600 to-forest-400',
  },
  {
    icon: <ShoppingBag size={48} className="text-white" />,
    title: 'List Items in the Shop',
    desc: 'Farmers can list crops, Suppliers can list equipment, and Vendors can post buying requests. Tap the + button in the Shop tab to get started.',
    color: 'from-bark-600 to-bark-400',
  },
  {
    icon: <Bot size={48} className="text-white" />,
    title: 'Use AI Search',
    desc: 'Get personalised farming advice, check land suitability for crops, or find farmers and suppliers using our AI assistant. Open the AI tab to explore.',
    color: 'from-forest-500 to-bark-500',
  },
]

export default function Step4Tutorial({ onComplete }) {
  const [current, setCurrent] = useState(0)

  const next = () => {
    if (current < SLIDES.length - 1) setCurrent(c => c + 1)
    else onComplete()
  }

  const slide = SLIDES[current]

  return (
    <div className="flex flex-col gap-8 animate-fade-in py-2">
      <div className="text-center mb-2 flex flex-col items-center">
        <h2 className="font-display font-bold text-3xl text-bark-700 mb-2">Quick Tour</h2>
        <p className="text-base text-bark-500 font-body">Learn how to make the most of CropNGo.</p>
      </div>

      {/* Slide */}
      <div className={`bg-gradient-to-br ${slide.color} rounded-2xl p-8 flex flex-col items-center text-center gap-4 transition-all duration-300`}>
        <div className="mb-2">{slide.icon}</div>
        <h3 className="font-display font-bold text-white text-xl">{slide.title}</h3>
        <p className="text-white/85 font-body text-sm leading-relaxed max-w-xs">{slide.desc}</p>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-forest-500' : 'w-2 bg-cream-300'}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 mt-4">
        <button
          type="button"
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="p-3 rounded-full border border-cream-300 text-bark-400 disabled:opacity-30 hover:bg-cream-200 transition-all font-semibold"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          id="tutorial-next"
          type="button"
          onClick={next}
          className="btn-primary flex-1 flex items-center justify-center gap-2 shadow-lg shadow-forest-500/20 py-4"
        >
          {current < SLIDES.length - 1 ? (
            <><span>Next</span> <ChevronRight size={20} /></>
          ) : (
            'Get Started!'
          )}
        </button>
      </div>
    </div>
  )
}
