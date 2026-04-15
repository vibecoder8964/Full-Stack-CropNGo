import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sprout, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

const TABS = [
  { label: 'Profile', path: '/app/profile' },
  { label: 'Shop',    path: '/app/shop' },
  { label: 'Chat',    path: '/app/chat' },
  { label: 'Events',  path: '/app/events' },
  { label: 'AI',      path: '/app/ai' },
]

export default function TopNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef])

  return (
    <nav className="hidden md:block fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-[#F8F3E8] border-b border-cream-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/app/profile')}>
          <div className="w-10 h-10 flex items-center justify-center rounded-2xl transition-colors bg-forest-500 text-white">
            <Sprout size={24} />
          </div>
          <span className="font-display font-bold text-xl tracking-wide transition-colors text-bark-700">
            AgriConnect
          </span>
        </div>

        {/* Desktop Links */}
        <div className="flex items-center gap-3 text-sm font-semibold text-bark-600">
          {TABS.map(({ label, path }) => {
            const active = pathname.startsWith(path)
            
            const handleClick = () => {
              if (path === '/app/events') {
                const cooldownStart = localStorage.getItem('agriconnect_events_cooldown_start')
                if (cooldownStart) {
                  const elapsed = Date.now() - parseInt(cooldownStart)
                  if (elapsed < 30000) {
                    const remaining = Math.ceil((30000 - elapsed) / 1000)
                    alert(`Please wait ${remaining}s for cooldown before accessing the Events page again.`)
                    return
                  }
                }
              }
              navigate(path)
            }

            return (
              <button 
                key={path} 
                onClick={handleClick} 
                className={`px-5 py-2 rounded-full transition-all duration-300 ${
                  active 
                    ? 'bg-forest-600 text-white shadow-sm border border-transparent font-bold' 
                    : 'border border-bark-400/20 text-bark-600 hover:bg-white/50 hover:border-bark-400/40'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Auth / Profile Actions */}
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="rounded-full ring-2 ring-transparent hover:ring-forest-200 transition-all focus:outline-none"
          >
            <Avatar src={user?.avatar} name={user?.username} role={user?.role} size="sm" className="shadow-sm" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-nav border border-cream-200 overflow-hidden animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-cream-100 bg-cream-50/50">
                <span className="block text-sm font-display font-bold text-bark-700 truncate">{user?.username || 'User'}</span>
                <span className="block text-xs font-body text-bark-400">{user?.role || 'Guest'}</span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <button 
                  onClick={() => { setDropdownOpen(false); navigate('/app/profile'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-body text-bark-600 hover:text-forest-700 hover:bg-forest-50 rounded-xl transition-colors text-left"
                >
                  <User size={16} /> View Profile
                </button>
                <button 
                  onClick={() => { setDropdownOpen(false); logout(); navigate('/'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-body text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors text-left font-semibold"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}
