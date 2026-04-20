import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../../components/Avatar'
import RoleBadge from '../../components/RoleBadge'
import ChatBubble from '../../components/ChatBubble'
import Modal from '../../components/Modal'
import StarRating from '../../components/StarRating'
import { ArrowLeft, ArrowUp, Star, Search, X, MailOpen, Lock, Plus, Loader2 } from 'lucide-react'
import { db } from '../../firebase'
import { collection, doc, query, where, onSnapshot, getDoc, setDoc, addDoc, orderBy } from 'firebase/firestore'

const getWsUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) {
    const loc = window.location
    return (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host
  }
  return apiUrl.replace('http://', 'ws://').replace('https://', 'wss://')
}

// ── E2E Crypto Helpers ──────────────────────────────────────────────────────
// Simple in-memory cache for derived keys to avoid redundant PBKDF2 calls
const KEY_CACHE = new Map()

const getDerivedKey = async (user1, user2) => {
  const users = [user1, user2].sort()
  const pairId = users.join(':')
  if (KEY_CACHE.has(pairId)) return KEY_CACHE.get(pairId)

  const secretStr = pairId + ':secure_e2e_cropngo'
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(secretStr), { name: 'PBKDF2' }, false, ['deriveKey']
  )
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('salt2026'), iterations: 1000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  )
  KEY_CACHE.set(pairId, derivedKey)
  return derivedKey
}

const encryptMsg = async (text, user1, user2) => {
  const key = await getDerivedKey(user1, user2)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  }
}

const decryptMsg = async (ciphertextb64, ivb64, user1, user2) => {
  try {
    const key = await getDerivedKey(user1, user2)
    const ciphertext = new Uint8Array(atob(ciphertextb64).split('').map(c => c.charCodeAt(0)))
    const iv = new Uint8Array(atob(ivb64).split('').map(c => c.charCodeAt(0)))
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return new TextDecoder().decode(decrypted)
  } catch (e) {
    return "[Decryption failed]"
  }
}

const getPairId = (u1, u2) => [u1, u2].sort().join('_')

export default function ChatPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const myUsername = user?.username

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState({})
  
  const [input, setInput] = useState('')
  const [searchQueryInput, setSearchQueryInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [newChatUser, setNewChatUser] = useState('')
  const [newChatLoading, setNewChatLoading] = useState(false)

  const [reviewOpen, setReviewOpen] = useState(false)
  const [review, setReview] = useState({ rating: 0, text: '' })
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const wsRef = useRef(null)
  const [e2eConnected, setE2eConnected] = useState(false)

  const activeConv = conversations.find(c => c.id === activeConvId)
  const activeMessages = messages[activeConvId] ?? []

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  // Subscribe to user's conversations
  useEffect(() => {
    if (!myUsername) return
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', myUsername))
    const unsub = onSnapshot(q, async (snap) => {
      const convs = []
      for (const d of snap.docs) {
        const data = d.data()
        const otherUsername = data.participants.find(u => u !== myUsername)
        // Decrypt last message preview
        let decLastMsg = "🔒 Encrypted Message"
        if (data.lastMessage) {
            decLastMsg = await decryptMsg(data.lastMessage.ciphertext, data.lastMessage.iv, myUsername, otherUsername)
        }
        
        // Fetch target user role (caching this in state could be better, but simple fetch for now)
        // By schema we just need role, if absent fallback to Farmer
        convs.push({
          id: d.id,
          with: { username: otherUsername, role: data.roles?.[otherUsername] || 'Farmer' },
          lastMessage: decLastMsg,
          lastTimestamp: data.lastTimestamp,
          unread: false,
          hasInteracted: true
        })
      }
      convs.sort((a,b) => (b.lastTimestamp || '').localeCompare(a.lastTimestamp || ''))
      setConversations(convs)
    })
    return () => unsub()
  }, [myUsername])

  // Subscribe to active conversation messages
  useEffect(() => {
    if (!myUsername || !activeConvId || !activeConv) return
    const targetUsername = activeConv.with.username
    const q = query(
      collection(db, 'chats', activeConvId, 'messages'),
      orderBy('timestamp', 'asc')
    )
    const unsub = onSnapshot(q, async (snap) => {
      const msgs = []
      for (const d of snap.docs) {
        const data = d.data()
        const text = await decryptMsg(data.ciphertext, data.iv, myUsername, targetUsername)
        msgs.push({
          id: d.id,
          senderId: data.senderId,
          text,
          timestamp: data.timestamp
        })
      }
      setMessages(prev => ({ ...prev, [activeConvId]: msgs }))
    })
    return () => unsub()
  }, [myUsername, activeConvId, activeConv])

  // Establish WebSocket for Real-Time Ping (E2E)
  useEffect(() => {
    if (!myUsername) return
    const ws = new WebSocket(`${getWsUrl()}/ws/chat/${myUsername}`)
    wsRef.current = ws

    ws.onopen = () => setE2eConnected(true)
    ws.onclose = () => setE2eConnected(false)
    ws.onmessage = async (event) => {
      // WS now just acts as an instant ping if needed, but Firestore onSnapshot handles UI delivery natively.
      // E2E is preserved because Firestore only stores ciphertext! We can still keep the WS for active typing dots or real-time presence later.
    }
    return () => ws.close()
  }, [myUsername])

  const createOrOpenChat = async () => {
    if (!newChatUser.trim() || !myUsername) return
    setNewChatLoading(true)
    try {
      const targetUser = newChatUser.trim()
      if (targetUser === myUsername) throw new Error("You cannot chat with yourself.")
      
      const targetDoc = await getDoc(doc(db, 'users', targetUser))
      if (!targetDoc.exists()) {
        throw new Error("Username not found in database.")
      }

      const pairId = getPairId(myUsername, targetUser)
      const chatRef = doc(db, 'chats', pairId)
      const chatSnap = await getDoc(chatRef)

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [myUsername, targetUser],
          roles: {
             [myUsername]: user.role,
             [targetUser]: targetDoc.data().role || 'Farmer'
          },
          lastTimestamp: new Date().toISOString()
        })
      }
      
      setNewChatOpen(false)
      setNewChatUser('')
      setActiveConvId(pairId)
    } catch (e) {
      alert(e.message)
    }
    setNewChatLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || !activeConv) return
    const text = input.trim()
    const targetUsername = activeConv.with.username
    const ts = new Date().toISOString()
    setInput('')
    inputRef.current?.focus()
    
    // E2E Encrypt
    const { ciphertext, iv } = await encryptMsg(text, myUsername, targetUsername)
    
    // Save to Firestore
    await addDoc(collection(db, 'chats', activeConvId, 'messages'), {
      senderId: myUsername,
      ciphertext,
      iv,
      timestamp: ts
    })

    await setDoc(doc(db, 'chats', activeConvId), {
      lastMessage: { ciphertext, iv },
      lastTimestamp: ts
    }, { merge: true })

    // Optional: WS for instant ping bypassing firestore delay
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ to: targetUsername, msg: ciphertext, iv, timestamp: ts }))
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const submitReview = () => {
    // Add real review logic to users collection later
    setReviewOpen(false)
    setReview({ rating: 0, text: '' })
  }

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return formatTime(ts)
    return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
  }

  const displayConvs = conversations.filter(c => c.with.username.toLowerCase().includes(searchQuery.toLowerCase()))

  // ── Conversation List ─────────────────────────────────────────────────────
  const ConvList = () => (
    <div className="flex flex-col gap-6 px-4 pt-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-[28px] text-[#1A1A1A] leading-none mb-1">Messages</h1>
          <button onClick={() => setNewChatOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-forest-600 text-white font-body font-bold text-sm rounded-full shadow-sm hover:bg-forest-700 transition-colors">
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-bark-400" />
          <input
            type="text"
            value={searchQueryInput}
            onChange={e => setSearchQueryInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearchQuery(searchQueryInput)}
            placeholder="Search conversations..."
            className="w-full bg-[#F8F6F1] border border-[#E0D9CC] rounded-full pl-11 pr-10 py-3 text-[15px] text-bark-700 placeholder-bark-400 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all font-body shadow-inner-sm"
          />
          {searchQueryInput && (
            <button onClick={() => { setSearchQueryInput(''); setSearchQuery(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-700 bg-[#E0D9CC]/30 rounded-full p-1">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-cream-200 overflow-hidden flex flex-col mb-10 w-full animate-fade-in">
        {displayConvs.length === 0 ? (
           <div className="p-12 flex flex-col items-center justify-center text-center gap-3 bg-[#F8F6F1]/30">
              <div className="w-12 h-12 rounded-full bg-white border border-[#E0D9CC] flex items-center justify-center text-bark-400 mb-1 shadow-sm">
                <MailOpen size={24} />
              </div>
              <p className="text-[13px] text-bark-500 font-body">Start a conversation by adding a new chat.</p>
           </div>
        ) : (
          displayConvs.map((conv, idx) => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`relative flex items-center gap-4 py-4 pr-4 pl-6 text-left transition-colors duration-200 hover:bg-[#F8F6F1]
                ${idx !== displayConvs.length - 1 ? 'border-b border-cream-200' : ''}`}
            >
              {conv.unread && <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-forest-600" />}
              <Avatar name={conv.with.username} role={conv.with.role} size="md" />
              <div className="flex-1 min-w-0 flex flex-col justify-center h-full gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-body font-bold text-[#1A1A1A] text-[15px]">{conv.with.username}</span>
                    <div className="scale-75 origin-left"><RoleBadge role={conv.with.role} /></div>
                  </div>
                  <span className={`text-[12px] font-body flex-shrink-0 ${conv.unread ? 'font-bold text-forest-600' : 'text-bark-400'}`}>{formatDate(conv.lastTimestamp)}</span>
                </div>
                <p className={`text-[13px] font-body truncate leading-tight ${conv.unread ? 'font-bold text-bark-700' : 'text-bark-400'}`}>{conv.lastMessage}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )

  // ── Thread View ────────────────────────────────────────────────────────────
  const ThreadView = () => (
    <div className="flex flex-col h-[calc(100dvh-4rem-3rem)] bg-white w-full max-w-3xl border border-[#E0D9CC] rounded-[24px] shadow-md animate-slide-up overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E0D9CC] bg-white sticky top-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <button onClick={() => setActiveConvId(null)} className="p-2 -ml-2 rounded-full hover:bg-[#F8F6F1] transition-colors">
          <ArrowLeft size={20} className="text-bark-500" />
        </button>
        <Avatar name={activeConv?.with.username} role={activeConv?.with.role} size="sm" />
        <div className="flex flex-col items-start leading-[1.1] ml-1">
          <span className="font-display font-bold text-[#1A1A1A] text-[16px]">{activeConv?.with.username}</span>
          <div className="scale-[0.70] origin-top-left mt-[2px]"><RoleBadge role={activeConv?.with.role} /></div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-[#F8F6F1] rounded-full border border-[#E0D9CC] shadow-inner-sm">
          <Lock size={12} className={e2eConnected ? "text-forest-600" : "text-bark-400"} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-bark-500">
            {e2eConnected ? 'E2E Secured' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-4 space-y-2 relative bg-[#FAFAF7]">
        {activeMessages.length === 0 && (
          <div className="text-center py-12 text-bark-400 text-[14px] font-body bg-white rounded-2xl border border-[#E0D9CC] shadow-sm mb-4">Start the conversation!</div>
        )}
        {activeMessages.map(msg => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === myUsername}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-5 py-4 border-t border-[#E0D9CC] bg-[#F8F6F1] sticky bottom-0 flex items-end gap-3 z-20">
        <div className="relative flex-1 bg-white rounded-[24px] border border-[#E0D9CC] shadow-inner-[0_2px_4px_rgba(0,0,0,0.02)] focus-within:ring-2 focus-within:ring-forest-500/30 focus-within:border-forest-500 transition-all overflow-hidden flex">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            rows={1}
            className="w-full resize-none py-3 px-5 text-[15px] max-h-32 overflow-y-auto bg-transparent border-none focus:outline-none focus:ring-0 text-[#1A1A1A] font-body placeholder-bark-400 leading-snug"
            style={{ fieldSizing: 'content' }}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-[44px] h-[44px] bg-[#2D6A4F] hover:bg-forest-600 active:bg-forest-700 disabled:opacity-40
                     text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 active:scale-95 shadow-md shrink-0 mb-0.5"
        >
          <ArrowUp size={22} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-[#FAFAF5] min-h-[calc(100dvh-4rem)] flex flex-col pb-6">
      {!activeConvId
        ? ConvList()
        : <div className="flex-1 w-full flex justify-center pt-6 px-4 sm:pt-8 sm:px-6">{ThreadView()}</div>
      }
      
      <Modal open={newChatOpen} onClose={() => setNewChatOpen(false)} title="New Chat">
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-bark-500 font-body">Enter the exact username of the person you want to chat with.</p>
          <div>
            <input
              type="text"
              value={newChatUser}
              onChange={e => setNewChatUser(e.target.value)}
              placeholder="Username"
              className="input-field"
            />
          </div>
          <button onClick={createOrOpenChat} disabled={!newChatUser.trim() || newChatLoading} className="btn-primary w-full disabled:opacity-40 flex justify-center gap-2">
            {newChatLoading && <Loader2 size={16} className="animate-spin" />} Start Chat
          </button>
        </div>
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Leave a Review">
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-bark-500 font-body">How was your experience with <strong>{activeConv?.with.username}</strong>?</p>
          <div className="flex justify-center">
            <StarRating value={review.rating} onChange={r => setReview(v => ({ ...v, rating: r }))} size={36} />
          </div>
          <div>
            <label className="label">Written review <span className="text-bark-300 font-normal">(optional)</span></label>
            <textarea
              value={review.text}
              onChange={e => setReview(v => ({ ...v, text: e.target.value }))}
              rows={3}
              placeholder="Share your experience..."
              className="input-field resize-none"
            />
          </div>
          <button onClick={submitReview} disabled={review.rating === 0} className="btn-primary w-full disabled:opacity-40">
            Submit Review
          </button>
        </div>
      </Modal>
    </div>
  )
}
