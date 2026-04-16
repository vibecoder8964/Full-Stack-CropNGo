import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, X, CalendarOff, RefreshCw, MapPin, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import EventCard from '../../components/EventCard'

const FILTERS = ['All', 'Expo', 'Workshop', 'Webinar', 'Competition']
const CACHE_KEY = 'agriconnect_events_cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

const profileMessages = {
  'newbie-false': "Showing learning events — perfect for getting started",
  'newbie-true': "You've harvested! Here are places to show your produce",
  'intermediate-true': "Opportunities and events to grow your farming business",
  'experienced-true': "Premium opportunities to expand your agricultural network",
}

// ── Module-level state: persists even when user navigates away ──────────
let _bgFetchPromise = null
let _bgFetchResult = null
let _bgFetchError = null
let _bgFetchLoading = false
let _bgFetchListeners = new Set()

function notifyListeners() {
  _bgFetchListeners.forEach(fn => fn())
}

function startBackgroundFetch(user) {
  if (_bgFetchLoading) return // Already fetching
  
  _bgFetchLoading = true
  _bgFetchError = null
  notifyListeners()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  _bgFetchPromise = fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user.username,
      description: user.bio || '',
      location: user.location || 'Malaysia',
      web_search: user.web_search ?? true,
    }),
  })
    .then(res => {
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      return res.json()
    })
    .then(result => {
      if (result.status === 'error') {
        throw new Error(result.message || 'Failed to fetch events')
      }
      _bgFetchResult = result
      _bgFetchError = null
      // Cache with timestamp
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), result }))
      return result
    })
    .catch(err => {
      console.error('Events fetch error:', err)
      _bgFetchError = err.message?.includes('model traffic') || err.message?.includes('occupied')
        ? 'Sorry, the LLM is occupied, Please try again later'
        : err.message
      return null
    })
    .finally(() => {
      _bgFetchLoading = false
      _bgFetchPromise = null
      notifyListeners()
    })
}

export default function EventsPage() {
  const { user } = useAuth()
  const [, forceUpdate] = useState(0)
  const [activeTab, setActiveTab] = useState('All')
  const [sortBy, setSortBy] = useState('relevance')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [estimate, setEstimate] = useState('Starting search...')
  const [hasStartedSearch, setHasStartedSearch] = useState(false)

  // Subscribe to background fetch state changes
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1)
    _bgFetchListeners.add(listener)
    return () => _bgFetchListeners.delete(listener)
  }, [])

  const ESTIMATES = [
    'Crawling web (approx. 45s)...',
    'Analyzing sources (30s)...',
    'Ranking results (15s)...',
    'Finalizing details (5s)...',
    'Almost there...'
  ]

  // Manage Estimate when loading
  useEffect(() => {
    let interval = null
    let step = 0
    if (_bgFetchLoading) {
      setEstimate(ESTIMATES[0])
      interval = setInterval(() => {
        step++
        const next = ESTIMATES[step] || 'Processing...'
        setEstimate(next)
      }, 5000)
    } else {
      setEstimate('Starting search...')
    }
    return () => { if (interval) clearInterval(interval) }
  }, [_bgFetchLoading])

  // On mount: check cache → if valid use it
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { timestamp, result } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_DURATION) {
          _bgFetchResult = result
          setHasStartedSearch(true)
          forceUpdate(n => n + 1)
        }
      }
    } catch {
      localStorage.removeItem(CACHE_KEY)
    }
  }, [])

  const startInitialSearch = () => {
    if (!_bgFetchLoading && user) {
      setHasStartedSearch(true)
      startBackgroundFetch(user)
    }
  }

  const handleRefresh = useCallback(() => {
    if (!user) return

    // Enforce 30-minute rule
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { timestamp } = JSON.parse(cached)
        const elapsed = Date.now() - timestamp
        if (elapsed < CACHE_DURATION) {
          const remainingMins = Math.ceil((CACHE_DURATION - elapsed) / 60000)
          alert(`Search cooldown: Please wait ${remainingMins} more minute(s) before refreshing, to save server resources.`)
          return
        }
      }
    } catch {}

    _bgFetchResult = null
    _bgFetchError = null
    localStorage.removeItem(CACHE_KEY)
    setLoadingSeconds(0)
    startBackgroundFetch(user)
  }, [user])

  const data = _bgFetchResult
  const loading = _bgFetchLoading
  const error = _bgFetchError

  const filteredEvents = useMemo(() => {
    if (!data?.all_events) return []
    let list = [...data.all_events]
    if (activeTab !== 'All') {
      list = list.filter(e => e.category === activeTab)
    }
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(e =>
        e.title?.toLowerCase().includes(s) ||
        e.description?.toLowerCase().includes(s) ||
        e.organiser?.toLowerCase().includes(s)
      )
    }
    if (sortBy === 'relevance') list.sort((a, b) => b.relevance_score - a.relevance_score)
    else if (sortBy === 'date') list.sort((a, b) => (a.date_raw || '').localeCompare(b.date_raw || ''))
    else if (sortBy === 'trusted') list.sort((a, b) => (b.is_trusted_source ? 1 : 0) - (a.is_trusted_source ? 1 : 0))
    return list
  }, [data, activeTab, search, sortBy])

  const topPicks = useMemo(() => data?.all_events?.filter(e => e.badge === '🏆 Top Pick') || [], [data])
  const opportunities = useMemo(() => data?.opportunities || [], [data])

  const userProfileMsg = useMemo(() => {
    if (!data?.user_profile) return "Personalised events for you"
    const key = `${data.user_profile.experience_level}-${data.user_profile.has_harvested}`
    return profileMessages[key] || "Personalised events for you"
  }, [data])

  // ── LANDING STATE ────────────────────────────────────────────────────────
  if (!hasStartedSearch && !data && !loading) {
    return (
      <div className="bg-[#FAFAF5] min-h-[calc(100dvh-4rem)] flex items-center justify-center p-6 animate-fade-in">
        <div className="max-w-xl w-full text-center">
          <div className="mb-8 relative">
            <div className="w-24 h-24 bg-forest-100 rounded-[32px] flex items-center justify-center mx-auto transform rotate-3 shadow-lg">
              <Sparkles className="text-forest-600 animate-pulse" size={40} />
            </div>
            <div className="absolute -top-2 -right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-200">
              AI Powered
            </div>
          </div>
          
          <h1 className="font-display font-bold text-4xl text-bark-700 mb-4 leading-tight">
            Discover What's Happening in Agri
          </h1>
          <p className="text-bark-500 font-body text-lg mb-10 max-w-sm mx-auto leading-relaxed">
            Let our AI Agent crawl the web and uncover the best expos, workshops, and opportunities tailored specifically to your profile.
          </p>
          
          <button 
            id="start-event-search"
            onClick={startInitialSearch}
            className="group relative bg-[#2D6A4F] text-white px-10 py-5 rounded-2xl font-display font-bold text-xl hover:bg-forest-700 transition-all duration-300 shadow-xl shadow-forest-500/20 hover:-translate-y-1 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Search size={24} className="group-hover:rotate-12 transition-transform" />
              <span>Search for Events</span>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <div className="mt-12 flex items-center justify-center gap-6 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
            <div className="text-center">
              <div className="text-lg font-bold">100+</div>
              <div className="text-[10px] uppercase font-bold tracking-tighter">Events</div>
            </div>
            <div className="w-px h-6 bg-bark-200" />
            <div className="text-center">
              <div className="text-lg font-bold">Daily</div>
              <div className="text-[10px] uppercase font-bold tracking-tighter">Updates</div>
            </div>
            <div className="w-px h-6 bg-bark-200" />
            <div className="text-center">
              <div className="text-lg font-bold">Free</div>
              <div className="text-[10px] uppercase font-bold tracking-tighter">Access</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── LOADING STATE ────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="bg-[#FAFAF5] min-h-[calc(100dvh-4rem)] pt-8 pb-12 flex flex-col animate-fade-in">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
          <div className="mb-8">
            <div className="h-10 w-48 bg-cream-200 rounded-lg shimmer mb-2" />
            <div className="h-5 w-64 bg-cream-200 rounded-lg shimmer" />
          </div>
          <div className="bg-forest-600 rounded-2xl p-6 mb-8 text-white shadow-xl flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Loader2 size={28} className="animate-spin flex-shrink-0" />
              <div>
                <p className="font-display text-lg font-bold">Searching for events near you…</p>
                <p className="text-sm text-forest-100 mt-1 font-body">Our AI agent is crawling the web for personalised agricultural events. This may take a moment.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <span className="text-xs uppercase tracking-wider font-bold">Progress: </span>
              <span className="font-mono text-sm">{estimate}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] bg-white rounded-2xl border border-cream-200 shimmer" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── ERROR STATE ──────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="bg-[#FAFAF5] min-h-[calc(100dvh-4rem)] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarOff size={32} />
          </div>
          <h2 className="text-xl font-display font-bold text-bark-700 mb-2">Unable to load events</h2>
          <p className="text-bark-500 mb-2">{error}</p>
          <p className="text-bark-400 text-sm mb-6">Switch to another page and come back to try again.</p>
          <button onClick={handleRefresh} className="btn-primary w-full shadow-lg shadow-forest-500/20">
            Retry Search
          </button>
        </div>
      </div>
    )
  }

  if (data?.status === 'no_results') {
    return (
      <div className="bg-[#FAFAF5] min-h-[calc(100dvh-4rem)] pt-8 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center py-20 bg-white rounded-3xl border border-cream-200 shadow-sm">
          <div className="w-20 h-20 bg-cream-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-forest-500">🌾</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-bark-700 mb-3">{data.message || "No results found"}</h2>
          <p className="text-bark-500 mb-8 max-w-sm mx-auto">Try enabling web search or broadening your location.</p>
          <button onClick={handleRefresh} className="btn-secondary px-8">Check Again Later</button>
        </div>
      </div>
    )
  }

  // ── MAIN VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#FAFAF5] min-h-[calc(100dvh-4rem)] pt-8 pb-12 flex flex-col animate-fade-in relative">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display font-bold text-[36px] text-[#1A1A1A] leading-tight">Events Near You</h1>
              {data?.location?.city && (
                <div className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-xs font-bold border border-forest-200 flex items-center gap-1">
                  <MapPin size={12} /> {data.location.city}
                </div>
              )}
            </div>
            <p className="text-[15px] text-bark-500 font-body">Personalised agricultural opportunities across Malaysia</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-cream-200 px-4 py-2 rounded-full text-sm font-bold text-bark-600 hover:border-forest-500 hover:text-forest-600 transition-all shadow-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {loading ? 'Searching...' : 'Refresh Results'}
          </button>
        </div>

        {/* PERSONALISATION BAR */}
        <div className="bg-forest-600 rounded-2xl p-4 md:p-6 mb-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Sparkles size={80} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-80 block mb-1">Personalised Recommendation</span>
              <p className="font-display text-lg md:text-xl font-bold leading-tight max-w-2xl">{userProfileMsg}</p>
              <p className="text-xs font-body opacity-90 mt-2 italic text-forest-100">"Based on AI search engine results, especially based on you~"</p>
            </div>
            <div className="flex items-center gap-4 border-l border-white/20 pl-4 md:pl-6 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-display font-bold">{data?.total_found || 0}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-80">Found</div>
              </div>
              <div className="w-[1px] h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-display font-bold">{data?.top_pick_count || 0}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-80">Top Picks</div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS & SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 z-30 bg-[#FAFAF5]/80 backdrop-blur-md py-4 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setActiveTab(f)}
                className={`shrink-0 px-5 py-2.5 rounded-full font-body font-bold text-[14px] transition-all duration-300 border
                  ${activeTab === f
                    ? 'bg-forest-600 text-white border-forest-600 shadow-md transform scale-105'
                    : 'bg-white text-bark-500 border-cream-200 hover:border-forest-400 hover:text-forest-600'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-bark-400" />
              <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
                placeholder="Search results..."
                className="w-full bg-white border border-cream-200 rounded-full pl-11 pr-10 py-2.5 text-[14px] text-bark-700 placeholder-bark-400 focus:outline-none focus:ring-2 focus:ring-forest-500/30 transition-all font-body shadow-sm" />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setSearch(''); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-700">
                  <X size={14} />
                </button>
              )}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-white border border-cream-200 rounded-full px-4 py-2.5 text-[14px] font-bold text-bark-600 focus:outline-none focus:ring-2 focus:ring-forest-500/30 shadow-sm cursor-pointer">
              <option value="relevance">Most Relevant</option>
              <option value="date">Earliest First</option>
              <option value="trusted">Official First</option>
            </select>
          </div>
        </div>

        {/* TOP PICKS */}
        {activeTab === 'All' && !search && topPicks.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl text-bark-700 flex items-center gap-2 mb-4">🏆 Top Picks For You</h2>
            <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x">
              {topPicks.map(event => (
                <div key={event.id} className="min-w-[300px] md:min-w-[380px] snap-start">
                  <EventCard event={event} showRelevance={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OPPORTUNITIES */}
        {activeTab === 'All' && !search && opportunities.length > 0 && (
          <div className="mb-12 bg-amber-50 rounded-[32px] p-8 md:p-10 border border-amber-200 shadow-inner-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Sparkles size={120} /></div>
            <div className="relative z-10">
              <h2 className="font-display font-bold text-2xl text-amber-900 flex items-center gap-2 mb-2">💡 Expose Your Business</h2>
              <p className="text-amber-700/80 font-body text-sm mt-1 mb-6">High-value opportunities to promote your products</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map(event => <EventCard key={event.id} event={event} showRelevance={true} />)}
              </div>
            </div>
          </div>
        )}

        {/* ALL EVENTS GRID */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-bark-700">
              {activeTab === 'All' ? 'All Upcoming Events' : `${activeTab}s`}
              <span className="text-bark-300 ml-2 font-normal text-lg">({filteredEvents.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-[24px] border border-cream-200 shadow-sm">
                <CalendarOff size={32} className="text-bark-400 mb-4" />
                <p className="text-lg text-bark-700 font-display font-bold mb-1">No matches found.</p>
                <p className="text-bark-400 font-body">Try adjusting your filters or search keywords.</p>
              </div>
            ) : filteredEvents.map(event => <EventCard key={event.id} event={event} showRelevance={true} />)}
          </div>
        </div>

        {data?.generated_at && (
          <div className="mt-16 text-center text-bark-400 text-xs font-body italic border-t border-cream-200 pt-8">
            Last updated: {new Date(data.generated_at).toLocaleString()} · Powered by AgriAgent
          </div>
        )}
      </div>
    </div>
  )
}
