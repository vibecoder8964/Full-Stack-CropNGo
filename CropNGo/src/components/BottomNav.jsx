import { useNavigate, useLocation } from 'react-router-dom'
import { User, ShoppingBag, MessageCircle, Calendar, Bot } from 'lucide-react'

const TABS = [
  { icon: User,          label: 'Profile', path: '/app/profile' },
  { icon: ShoppingBag,   label: 'Shop',    path: '/app/shop' },
  { icon: MessageCircle, label: 'Chat',    path: '/app/chat' },
  { icon: Calendar,      label: 'Events',  path: '/app/events' },
  { icon: Bot,           label: 'AI',      path: '/app/ai' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-cream-200"
         style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1">
        {TABS.map(({ icon: Icon, label, path }) => {
          const active = pathname.startsWith(path)
          
          const handleClick = () => {
            navigate(path)
          }

          return (
            <button
              key={path}
              onClick={handleClick}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-300
                ${active ? 'text-forest-600' : 'text-bark-400 hover:text-bark-600'}`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? 'bg-forest-100 text-forest-600 ring-2 ring-forest-500/20' : ''}`}>
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-body font-semibold leading-none ${active ? 'text-forest-600' : ''}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
