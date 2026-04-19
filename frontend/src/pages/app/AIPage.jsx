import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PREDEFINED_CROPS, PREDEFINED_TOOLS } from '../../data/mockAI'
import { mockUsers } from '../../data/mockUsers'
import TagInput from '../../components/TagInput'
import ImageUploader from '../../components/ImageUploader'
import UserCard from '../../components/UserCard'
import StarRating from '../../components/StarRating'
import { Send, Bot, Loader2, Sprout, Search, WifiOff, ArrowUp } from 'lucide-react'
import { db } from '../../firebase'
import { collection, addDoc } from 'firebase/firestore'

// ── Helpers ────────────────────────────────────────────────────────────────
const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const CHAT_STORAGE_KEY_PREFIX = 'cropngo_chat_history_'

const parseMarkdown = (text) => {
  if (!text) return { __html: '' }
  let html = text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#2D6A4F] underline font-bold hover:text-forest-700">$1</a>')
  html = html.replace(/(^|\s|\()(https?:\/\/[^\s<)\]]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#2D6A4F] underline font-bold hover:text-forest-700">$2</a>')
  html = html.replace(/\n/g, '<br/>')
  return { __html: html }
}

// ── AI Chat Shell (Issue #7: persists chat across refresh/navigation) ──────
function AIChat({ role }) {
  const { user, updateUser } = useAuth()
  const initMessages = [{ role: 'assistant', text: `Hello! I am your AI assistant. How can I help you today?` }]
  const chatKey = `cropngo_chat_history_${user?.username || 'anon'}`

  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(chatKey)
      if (stored) return JSON.parse(stored)
    } catch {}
    return initMessages
  })
  
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [backendOnline, setBackendOnline] = useState(null)
  const endRef = useRef(null)

  // Persist chat history to localStorage
  useEffect(() => {
    if (user?.username) {
      localStorage.setItem(chatKey, JSON.stringify(messages))
    }
  }, [messages, chatKey, user?.username])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/health`, { method: 'GET', signal: AbortSignal.timeout(8000) })
        setBackendOnline(res.ok)
      } catch { setBackendOnline(false) }
    }
    checkHealth()
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading || !user) return
    const userText = input.trim()
    setMessages(m => [...m, { role: 'user', text: userText }])
    setInput('')
    setLoading(true)
    const API_URL = getApiUrl()
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: user.description || '', role: user.role || 'Farmer', question: userText })
      })
      const data = await response.json()
      const aiText = data.response || "No response received."
      setMessages(m => [...m, { role: 'assistant', text: aiText }])
      setBackendOnline(true)
      
      // Save to history collection instead of description
      try {
        await addDoc(collection(db, 'users', user.username, 'history'), {
          question: userText,
          answer: aiText,
          timestamp: new Date().toISOString()
        })
      } catch (err) {
        console.warn("Failed to save chat history to database:", err)
      }
    } catch (e) {
      setBackendOnline(false)
      setMessages(m => [...m, { role: 'assistant', text: `**Could not connect to the AI agent.**\n\nThe backend at \`${API_URL}\` is not reachable.` }])
    }
    setLoading(false)
  }

  const clearChat = () => {
    setMessages(initMessages)
    localStorage.removeItem(chatKey)
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  const statusDot = backendOnline === null
    ? 'w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse'
    : backendOnline
      ? 'w-2 h-2 bg-[#86efac] rounded-full shadow-[0_0_8px_rgba(134,239,172,0.8)]'
      : 'w-2 h-2 bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.8)]'
  const statusText = backendOnline === null ? 'Checking…' : backendOnline ? 'Online' : 'Offline'

  return (
    <div className="card overflow-hidden mb-8 border border-cream-200">
      <div className="bg-[#2D6A4F] px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shadow-sm"><Bot size={20} className="text-white" /></div>
        <div>
          <p className="text-white font-display font-bold text-[16px] leading-snug">CropNGo AI</p>
          <p className="text-white/80 text-[12px] font-body mt-0.5">Powered by AI</p>
        </div>
        <button onClick={clearChat} className="ml-auto mr-3 text-white/60 hover:text-white text-[11px] font-body font-bold uppercase tracking-wider transition-colors">Clear</button>
        <span className="flex items-center gap-1.5 text-[13px] text-white/80 font-body font-semibold">
          <span className={statusDot} /> {statusText}
        </span>
      </div>
      {backendOnline === false && (
        <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center gap-3 animate-fade-in">
          <WifiOff size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-[13px] font-body"><span className="font-bold">Backend unavailable.</span> The AI agent at <code className="bg-red-100 px-1 rounded text-[12px]">{getApiUrl()}</code> is not responding.</p>
        </div>
      )}
      <div className="h-72 overflow-y-auto p-5 space-y-4 bg-[#FAFAF5]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-auto shadow-sm"><Bot size={16} className="text-[#2D6A4F]" /></div>
            )}
            <div className={`max-w-[82%] px-[18px] py-[14px] text-[15px] font-body leading-relaxed shadow-sm
              ${msg.role === 'user' ? 'bg-[#2D6A4F] text-white rounded-2xl rounded-br-sm' : 'bg-white border border-[#E0D9CC] text-[#1A1A1A] rounded-2xl rounded-bl-sm'}`}
              dangerouslySetInnerHTML={parseMarkdown(msg.text)} />
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 bg-forest-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0"><Bot size={14} className="text-forest-600" /></div>
            <div className="bg-white border border-cream-200 text-bark-400 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> <span className="text-sm font-body">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="px-5 py-4 border-t border-[#E0D9CC] bg-white flex items-end gap-3 relative">
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask me anything..." rows={1}
          className="w-full bg-[#F8F6F1] border border-[#E0D9CC] rounded-full pl-5 pr-[60px] py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-forest-500/30 transition-all font-body text-[#1A1A1A] placeholder-bark-400 resize-none max-h-32 shadow-inner-sm overflow-hidden" />
        <button id="ai-chat-send" onClick={send} disabled={!input.trim() || loading}
          className="absolute right-[26px] bottom-[22px] w-[40px] h-[40px] bg-[#2D6A4F] hover:bg-forest-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md">
          <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
        </button>
      </div>
    </div>
  )
}

function WebSearchSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-bark-400 uppercase tracking-wider">Web Search</span>
      <select value={value ? "yes" : "no"} onChange={e => onChange(e.target.value === "yes")}
        className="bg-cream-100 border-none text-[12px] font-bold text-forest-700 px-3 py-1 rounded-full focus:ring-0 cursor-pointer shadow-sm hover:bg-cream-200 transition-colors">
        <option value="yes">YES</option>
        <option value="no">NO</option>
      </select>
    </div>
  )
}

// ── Issue #3: Farmer Suitability Checker (now uses FarmerSearch format) ────
function FarmerAI() {
  const { user, updateUser } = useAuth()
  
  const CACHE_KEY = 'cropngo_farmer_cache'
  const loadCache = () => {
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return null
  }
  const cached = loadCache()

  const [form, setForm] = useState(cached?.form || { plant: '', place: '', landSize: '', landUnit: 'acres', tools: [], soilPhoto: null })
  const [analysed, setAnalysed] = useState(cached?.analysed || false)
  const [aiResponse, setAiResponse] = useState(cached?.aiResponse || '')
  const [loading, setLoading] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ form, analysed, aiResponse }))
  }, [form, analysed, aiResponse])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const analyse = async () => {
    setLoading(true)
    setAnalysed(false)
    try {
      const API_URL = getApiUrl()
      // Use the structured FarmerSearch format that triggers full pipeline
      const question = `Background:\n  Type of plant: ${form.plant}\n  Place of cultivation: ${form.place}\n  Land size: ${form.landSize} ${form.landUnit}\n  Tools available: ${form.tools.join(', ') || 'None'}\n\nYour task: Based on the context and question given, analyse items needed by the farmer. Then search the items in the app and website.`

      const response = await fetch(`${API_URL}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: user.description || '',
          role: 'Farmer',
          web_search: user.web_search ?? true,
          question,
          image_data: form.soilPhoto
        })
      })
      const data = await response.json()
      setAiResponse(data.response || "No analysis generated.")
      setAnalysed(true)
    } catch (e) {
      setAiResponse("**Error:** Could not connect to the AI Agent. Please ensure the backend is running.")
      setAnalysed(true)
    }
    setLoading(false)
  }

  const handleProceed = () => {
    setAnalysed(false)
    setAiResponse('')
    setForm({ plant: '', place: '', landSize: '', landUnit: 'acres', tools: [], soilPhoto: null })
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-2xl text-bark-700 flex items-center gap-3">
          <Sprout size={28} className="text-forest-500" /> Farm Suitability Checker
        </h2>
        <WebSearchSelector value={user.web_search ?? true} onChange={v => updateUser({ web_search: v })} />
      </div>
      <p className="text-base text-bark-500 font-body mb-6">Enter your farm details to get AI-powered crop suitability, demand, and product analysis.</p>

      <div ref={formRef} className="card p-6 flex flex-col gap-5 mb-8 border-t-4 border-t-forest-500 shadow-lg">
        <div>
          <label className="label">Type of plant / crop</label>
          <input type="text" value={form.plant} onChange={e => set('plant', e.target.value)} className="input-field" placeholder="e.g. Paddy, Durian" />
        </div>
        <div>
          <label className="label">Place of cultivation</label>
          <input type="text" value={form.place} onChange={e => set('place', e.target.value)} className="input-field" placeholder="e.g. Kedah lowlands" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label">Land size</label>
            <input type="number" value={form.landSize} onChange={e => set('landSize', e.target.value)} className="input-field" placeholder="e.g. 8" />
          </div>
          <div className="w-32">
            <label className="label">Unit</label>
            <select value={form.landUnit} onChange={e => set('landUnit', e.target.value)} className="input-field">
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </select>
          </div>
        </div>
        <TagInput label="Tools available" options={PREDEFINED_TOOLS} selected={form.tools} onChange={v => set('tools', v)} allowOther />
        <div>
          <label className="label">Soil quality photo <span className="text-bark-300 font-normal">(optional)</span></label>
          <ImageUploader value={form.soilPhoto} onChange={v => set('soilPhoto', v)} shape="rect" label="Upload soil photo" />
        </div>
        <button id="ai-analyse-btn" onClick={analyse} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Analysing…</> : '🔍 Analyse Suitability'}
        </button>
      </div>

      {analysed && (
        <div className="card p-5 flex flex-col gap-4 animate-slide-up border-t-2 border-[#2D6A4F]">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-forest-100 text-forest-700 border border-forest-200 font-body font-bold text-sm flex items-center gap-2">
              <Bot size={14} /> AI Analysis Result
            </span>
          </div>
          <div className="text-[15px] font-body text-[#1A1A1A] leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={parseMarkdown(aiResponse)} />

          {/* Shop link button */}
          <a href="/app/shop" className="flex items-center justify-center gap-2 w-full text-[14px] font-bold font-body border border-[#2D6A4F] text-[#2D6A4F] rounded-full px-4 py-2.5 transition-colors hover:bg-forest-50 mt-2">
            🛒 Browse Products in Shop
          </a>

          {/* Issue #8: Proceed button */}
          <button onClick={handleProceed}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            <ArrowUp size={16} /> Proceed — New Analysis
          </button>
        </div>
      )}
    </div>
  )
}

// ── Issue #4: Vendor — Find Farmers Fast + Web Search ─────────────────────
function VendorAI() {
  const { user, updateUser } = useAuth()
  
  const CACHE_KEY = 'cropngo_vendor_cache'
  const loadCache = () => {
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return null
  }
  const cached = loadCache()

  const [crops, setCrops] = useState(cached?.crops || [])
  const [searched, setSearched] = useState(cached?.searched || false)
  const [webResults, setWebResults] = useState(cached?.webResults || '')
  const [loading, setLoading] = useState(false)
  const [webLoading, setWebLoading] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ crops, searched, webResults }))
  }, [crops, searched, webResults])

  const farmers = mockUsers.filter(u => u.role === 'Farmer')

  const search = async () => {
    setLoading(true)
    setWebResults('')
    await new Promise(r => setTimeout(r, 400))
    setSearched(true)
    setLoading(false)

    // If web search is enabled, also call backend for web results
    if (user.web_search) {
      setWebLoading(true)
      try {
        const API_URL = getApiUrl()
        const response = await fetch(`${API_URL}/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: user.description || '',
            role: 'Vendor',
            web_search: true,
            question: `Find suppliers that sell: ${crops.join(', ')}. Search the web for external suppliers.`
          })
        })
        const data = await response.json()
        setWebResults(data.response || '')
      } catch (e) {
        setWebResults('**Error:** Could not connect to the AI Agent for web search.')
      }
      setWebLoading(false)
    }
  }

  const results = searched
    ? farmers.filter(f => crops.length === 0 || f.crops?.some(c => crops.includes(c)))
    : []

  const handleProceed = () => {
    setSearched(false)
    setWebResults('')
    setCrops([])
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-[22px] text-[#1A1A1A] flex items-center gap-3 border-l-[3px] border-[#2D6A4F] pl-3">
          <Search size={24} className="text-[#2D6A4F]" /> Find Farmers Fast
        </h2>
        <WebSearchSelector value={user.web_search ?? true} onChange={v => updateUser({ web_search: v })} />
      </div>
      <p className="text-[15px] text-bark-500 font-body mb-6">Describe what you need, and AI will find the best matching farmers{user.web_search ? ' and web suppliers' : ''}.</p>

      <div ref={formRef} className="card p-6 flex flex-col gap-5 mb-8 border-t-0 shadow-md">
        <TagInput label="Type of crop" options={PREDEFINED_CROPS} selected={crops} onChange={setCrops} allowOther placeholder="Search crops..." max={5} />
        <button id="ai-vendor-search" onClick={search} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Searching…</> : '🔍 Find Farmers'}
        </button>
      </div>

      {searched && (
        <div className="flex flex-col gap-3 animate-slide-up">
          <p className="text-sm text-bark-400 font-body font-bold uppercase tracking-wider">App Results — {results.length} farmer{results.length !== 1 ? 's' : ''} found</p>
          {results.map(u => <UserCard key={u.id} user={u} />)}

          {/* Web search results */}
          {user.web_search && (
            <div className="mt-6">
              <p className="text-sm text-bark-400 font-body font-bold uppercase tracking-wider mb-3">🌐 Web Search Results</p>
              {webLoading ? (
                <div className="card p-6 flex items-center gap-3 text-bark-400">
                  <Loader2 size={18} className="animate-spin text-forest-500" />
                  <span className="font-body">Searching the web for suppliers...</span>
                </div>
              ) : webResults ? (
                <div className="card p-5 border-t-2 border-forest-500">
                  <div className="text-[15px] font-body text-[#1A1A1A] leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={parseMarkdown(webResults)} />
                </div>
              ) : null}
            </div>
          )}

          {/* Issue #8: Proceed button */}
          <button onClick={handleProceed} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
            <ArrowUp size={16} /> Proceed — New Search
          </button>
        </div>
      )}
    </div>
  )
}

// ── Issue #6: Supplier — Equipment Demand Insights (wired to backend) ─────
function SupplierAI() {
  const { user, updateUser } = useAuth()
  
  const CACHE_KEY = 'cropngo_supplier_cache'
  const loadCache = () => {
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return null
  }
  const cached = loadCache()

  const [equipments, setEquipments] = useState(cached?.equipments || [])
  const [result, setResult] = useState(cached?.result || '')
  const [searched, setSearched] = useState(cached?.searched || false)
  const [loading, setLoading] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ equipments, result, searched }))
  }, [equipments, result, searched])

  const analyse = async () => {
    if (equipments.length === 0) return alert('Please select at least one equipment.')
    setLoading(true)
    setSearched(false)
    try {
      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: user.description || '',
          role: 'Supplier',
          web_search: user.web_search ?? true,
          question: `Is there high demand for ${equipments.join(', ')} in the agricultural market? Search the web and app to assess demand.`
        })
      })
      const data = await response.json()
      setResult(data.response || "No analysis generated.")
      setSearched(true)
    } catch (e) {
      setResult("**Error:** Could not connect to the AI Agent. Please ensure the backend is running.")
      setSearched(true)
    }
    setLoading(false)
  }

  const handleProceed = () => {
    setSearched(false)
    setResult('')
    setEquipments([])
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-[22px] text-[#1A1A1A] flex items-center gap-3 border-l-[3px] border-[#2D6A4F] pl-3">
          <Bot size={24} className="text-[#2D6A4F]" /> Equipment Demand Insights
        </h2>
        <WebSearchSelector value={user.web_search ?? true} onChange={v => updateUser({ web_search: v })} />
      </div>

      <div ref={formRef} className="card p-6 flex flex-col gap-4 mb-4 shadow-md overflow-visible relative z-20">
        <TagInput label="Select Equipments" options={PREDEFINED_TOOLS} selected={equipments}
          onChange={setEquipments} allowOther placeholder="e.g. Tractor, Irrigation" max={5} />
        <button onClick={analyse} disabled={loading}
          className="btn-primary flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Analysing…</> : <><Search size={16} /> Get Demand Analysis</>}
        </button>
      </div>

      {!searched && (
        <div className="bg-white border border-[#E0D9CC] rounded-2xl p-6 mb-8 shadow-sm">
          <p className="text-[13px] font-body font-bold text-bark-400 tracking-wider mb-4">EXAMPLES</p>
          <div className="flex flex-wrap gap-2 opacity-60 pointer-events-none">
            {['Tractors for Kedah', 'Sprinklers Demand', 'Plows in Perak'].map(s => (
              <div key={s} className="px-4 py-2 border border-[#2D6A4F] text-[#2D6A4F] text-[13px] font-bold font-body rounded-full">{s}</div>
            ))}
          </div>
        </div>
      )}

      {searched && (
        <div className="card p-5 flex flex-col gap-4 animate-slide-up border-t-2 border-[#2D6A4F] mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-forest-100 text-forest-700 border border-forest-200 font-body font-bold text-sm flex items-center gap-2">
              <Bot size={14} /> Demand Analysis Result
            </span>
          </div>
          <div className="text-[15px] font-body text-[#1A1A1A] leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={parseMarkdown(result)} />

          {/* Issue #8: Proceed button */}
          <button onClick={handleProceed} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            <ArrowUp size={16} /> Proceed — New Analysis
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main AI Page ───────────────────────────────────────────────────────────
export default function AIPage() {
  const { user } = useAuth()
  const role = user?.role ?? 'Farmer'

  const roleSubtitles = {
    Farmer: 'Analyze crop viability, plan yields, and explore agricultural data.',
    Vendor: 'Search for farmers, analyse crop availability, and get market insights.',
    Supplier: 'Track equipment demands and connect with local farming cooperatives.',
  }

  return (
    <div className="page-container animate-fade-in relative pb-8">
      <div className="pt-8 pb-6 mb-3">
        <h1 className="font-display font-bold text-[36px] text-[#1A1A1A]">AI Assistant</h1>
        <p className="text-[15px] text-bark-500 font-body mt-1">Get superhuman insights and answers instantly.</p>
        <p className="text-[14px] text-bark-400 font-body italic mt-1">{roleSubtitles[role]}</p>
      </div>

      <AIChat role={role} />

      {role === 'Farmer' && <FarmerAI />}
      {role === 'Vendor' && <VendorAI />}
      {role === 'Supplier' && <SupplierAI />}
    </div>
  )
}
