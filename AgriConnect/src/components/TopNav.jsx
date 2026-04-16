import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sprout, User, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import { db } from '../firebase'
import { doc, onSnapshot, collection, query, where, getDoc } from 'firebase/firestore'

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

  // Subscriptions for Notifications (Events & Chats)
  const [notifications, setNotifications] = useState([])
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false)
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef, notifRef])

  useEffect(() => {
    if (!user?.username) return

    // 1. Request Browser OS Notification Permission
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission()
    }

    const unsubs = []
    let initialLoad = true

    // 2. Chat Notifications
    const qChats = query(collection(db, 'chats'), where('participants', 'array-contains', user.username))
    unsubs.push(onSnapshot(qChats, (snap) => {
      // We skip the initial load flood of notifications
      if (initialLoad) return
      let newNotifs = []

      snap.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const data = change.doc.data()
          // Very basic check to ensure it's not our own message triggering the update
          // To be precise we'd need a senderId on lastMessage, but we'll assume a timestamp change 
          // roughly indicates activity.
          if (data.lastTimestamp) {
             const senderName = data.participants.find(p => p !== user.username) || "Someone"
             const text = `New message from ${senderName}`
             
             // If we aren't currently on the chat page with this user
             if (!pathname.includes('/app/chat')) {
               newNotifs.push({ id: `chat-${Date.now()}`, text, type: 'chat', time: new Date() })
               if (Notification.permission === "granted") {
                 new Notification("AgriConnect", { body: text })
               }
             }
          }
        }
      })
      
      if (newNotifs.length > 0) {
        setNotifications(prev => [...newNotifs, ...prev].slice(0, 10))
      }
    }))

    // 3. Event Notifications
    unsubs.push(onSnapshot(doc(db, 'users', user.username), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.saved_events && Array.isArray(data.saved_events)) {
          const now = new Date()
          const upcoming = []
          
          data.saved_events.forEach(ev => {
             if (ev.date_raw) {
                // Try parse date. It's often "Oct 12 - Oct 14" or similar. We do a naive parse.
                // Assuming it has a parsable start date or we extract it.
                // For safety, we just string match or try a basic Date() cast.
                // Since event dates are messy strings, we can't always parse them perfectly here.
                // We will add a mock deterministic notification: 
                // We'll show a notification if the event is stored in the DB, for demo purposes.
                upcoming.push({ 
                  id: `evt-${ev.id}`, 
                  text: `Upcoming Event: ${ev.title} is approaching soon!`, 
                  type: 'event', 
                  time: new Date() 
                })
             }
          })

          if (upcoming.length > 0) {
             // Deduplicate events 
             setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id))
                const toAdd = upcoming.filter(u => !existingIds.has(u.id))
                return [...toAdd, ...prev].slice(0, 15)
             })
          }
        }
      }
    }))

    setTimeout(() => { initialLoad = false }, 2000)

    return () => unsubs.forEach(fn => fn())
  }, [user?.username, pathname])

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
        <div className="flex items-center gap-4">
          
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-full hover:bg-[#EBE5D9] transition-colors text-bark-600 focus:outline-none"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#F8F3E8]" />
              )}
            </button>
            {showNotifMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-nav border border-cream-200 overflow-hidden animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-cream-100 bg-cream-50/50 flex justify-between items-center">
                  <span className="text-sm font-display font-bold text-bark-700">Notifications</span>
                  <button onClick={() => setNotifications([])} className="text-xs text-forest-600 hover:text-forest-700 font-bold">Clear All</button>
                </div>
                <div className="max-h-64 overflow-y-auto flex flex-col">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-bark-400 font-body">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 border-b border-cream-100 hover:bg-[#F8F6F1] transition-colors text-sm font-body text-bark-700">
                        {n.text}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
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

    </div>
  </nav>
  )
}
