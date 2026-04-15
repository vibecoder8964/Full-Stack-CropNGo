import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { mockConversations, mockMessages } from '../../data/mockMessages'
import Avatar from '../../components/Avatar'
import RoleBadge from '../../components/RoleBadge'
import ChatBubble from '../../components/ChatBubble'
import Modal from '../../components/Modal'
import StarRating from '../../components/StarRating'
import { ArrowLeft, ArrowUp, Star, Search, X, MailOpen } from 'lucide-react'

export default function ChatPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState(mockConversations)
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState(mockMessages)
  const [input, setInput] = useState('')
  const [searchQueryInput, setSearchQueryInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [review, setReview] = useState({ rating: 0, text: '' })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const activeConv = conversations.find(c => c.id === activeConvId)
  const activeMessages = messages[activeConvId] ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  const sendMessage = () => {
    if (!input.trim() || !activeConvId) return
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: user?.id ?? 'demo-user-1',
      text: input.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages(m => ({ ...m, [activeConvId]: [...(m[activeConvId] ?? []), newMsg] }))
    setConversations(cs => cs.map(c =>
      c.id === activeConvId ? { ...c, lastMessage: input.trim(), lastTimestamp: newMsg.timestamp, hasInteracted: true } : c
    ))
    setInput('')
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const submitReview = () => {
    setConversations(cs => cs.map(c => c.id === activeConvId ? { ...c, reviewed: true } : c))
    setReviewOpen(false)
    setReview({ rating: 0, text: '' })
  }

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return formatTime(ts)
    return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
  }

  const displayConvs = conversations.filter(c => c.with.username.toLowerCase().includes(searchQuery.toLowerCase()))

  // ── Conversation List ─────────────────────────────────────────────────────
  const ConvList = () => (
    <div className="flex flex-col gap-6 px-4 pt-8 max-w-2xl mx-auto w-full">
      {/* Header & Search */}
      <div className="flex flex-col gap-4">
        <h1 className="font-display font-bold text-[28px] text-[#1A1A1A] leading-none mb-1">Messages</h1>
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

      {/* Conv Card Wrapper */}
      <div className="bg-white rounded-[20px] shadow-sm border border-cream-200 overflow-hidden flex flex-col mb-10 w-full animate-fade-in">
        {displayConvs.length === 0 ? (
           <div className="p-12 flex flex-col items-center justify-center text-center gap-3 bg-[#F8F6F1]/30">
              <div className="w-12 h-12 rounded-full bg-white border border-[#E0D9CC] flex items-center justify-center text-bark-400 mb-1 shadow-sm">
                <MailOpen size={24} />
              </div>
              <p className="text-[13px] text-bark-500 font-body">Start a conversation by visiting someone's profile.</p>
           </div>
        ) : (
          displayConvs.map((conv, idx) => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`relative flex items-center gap-4 py-4 pr-4 pl-6 text-left transition-colors duration-200 hover:bg-[#F8F6F1]
                ${idx !== displayConvs.length - 1 ? 'border-b border-cream-200' : ''}`}
            >
              {conv.unread && (
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-forest-600" />
              )}
              
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
      {/* Thread header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E0D9CC] bg-white sticky top-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <button onClick={() => setActiveConvId(null)} className="p-2 -ml-2 rounded-full hover:bg-[#F8F6F1] transition-colors">
          <ArrowLeft size={20} className="text-bark-500" />
        </button>
        <Avatar name={activeConv?.with.username} role={activeConv?.with.role} size="sm" />
        <div className="flex flex-col items-start leading-[1.1] ml-1">
          <span className="font-display font-bold text-[#1A1A1A] text-[16px]">{activeConv?.with.username}</span>
          <div className="scale-[0.70] origin-top-left mt-[2px]"><RoleBadge role={activeConv?.with.role} /></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-4 space-y-2 relative bg-[#FAFAF7]">
        {/* Leave a Review Banner */}
        {activeConv?.hasInteracted && !activeConv?.reviewed && (
          <div className="w-full bg-[#E8F5E9] text-[#2D6A4F] px-4 py-3 rounded-[12px] mb-8 flex items-center justify-between border border-[#c8e6c9] shadow-sm animate-fade-in group cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => setReviewOpen(true)}>
             <div className="flex items-center gap-2.5">
                <div className="bg-white p-1 rounded-full shadow-sm"><Star size={12} className="text-[#2D6A4F] fill-[#2D6A4F]" /></div>
                <span className="text-[12px] font-bold font-body">You've connected with this user — leave a review ★</span>
             </div>
             <button onClick={(e) => { e.stopPropagation(); setReviewOpen(true); }} className="text-[#2D6A4F] opacity-70 hover:opacity-100 transition-opacity bg-white/50 rounded-full p-1">
                <X size={14} />
             </button>
          </div>
        )}

        {activeMessages.length === 0 && (
          <div className="text-center py-12 text-bark-400 text-[14px] font-body bg-white rounded-2xl border border-[#E0D9CC] shadow-sm mb-4">Start the conversation!</div>
        )}
        {activeMessages.map(msg => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === (user?.id ?? 'demo-user-1')}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Input Area */}
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
        ? <ConvList />
        : <div className="flex-1 w-full flex justify-center pt-6 px-4 sm:pt-8 sm:px-6"><ThreadView /></div>
      }
      
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
