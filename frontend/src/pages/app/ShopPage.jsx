import { useState, useMemo, useEffect } from 'react'
import { Search, SlidersHorizontal, X, Tractor, Wrench, Megaphone, ChevronDown, Loader2, Tag, Copy, ExternalLink } from 'lucide-react'
import { collection, addDoc, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'
import { CATEGORIES } from '../../data/mockListings'
import ListingCard from '../../components/ListingCard'
import WantedCard from '../../components/WantedCard'
import FloatingActionButton from '../../components/FloatingActionButton'
import Modal from '../../components/Modal'
import ImageUploader from '../../components/ImageUploader'
import TagInput from '../../components/TagInput'
import { useAuth } from '../../context/AuthContext'

const TABS = ['Crops', 'Equipment', 'Wanted']

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Most Relevant' },
  { value: 'nearest', label: 'Nearest First' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'lowest_price', label: 'Lowest Price' },
]

const WANTED_CATEGORIES = [
  'Durian', 'Banana', 'Rambutan', 'Mango', 'Paddy', 'Vegetables', 'Fruits',
  'Rubber', 'Palm Oil', 'Coconut', 'Pineapple', 'Corn', 'Rice', 'Chili',
]

const UNITS = ['kg', 'g', 'tonne', 'piece', 'dozen', 'tray', 'set', 'bag', 'batch', 'bottle']

export default function ShopPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Crops')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sortInput, setSortInput] = useState('relevant')
  const [sort, setSort] = useState('relevant')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', category: '', maxDistance: '', minRating: 0 })
  const [addOpen, setAddOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [newListing, setNewListing] = useState({ name: '', description: '', price: '', category: '', unit: '', image: null, isDraft: false, tags: [], keyword: '' })
  const [showOtherUnit, setShowOtherUnit] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState(null)

  // Wanted-specific state
  const [wantedOpen, setWantedOpen] = useState(false)
  const [newWanted, setNewWanted] = useState({ name: '', category: '', customCategory: '', price: '', unit: 'kg' })
  const [publishingWanted, setPublishingWanted] = useState(false)

  // Firestore listings state
  const [allListings, setAllListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)

  const fetchListings = async () => {
    setLoadingListings(true)
    try {
      const snapshot = await getDocs(collection(db, 'listings'))
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      items.sort((a, b) => {
        const ta = a.createdAt || ''
        const tb = b.createdAt || ''
        return tb > ta ? 1 : ta > tb ? -1 : 0
      })
      setAllListings(items)
    } catch (e) {
      console.error('Failed to fetch listings:', e)
    }
    setLoadingListings(false)
  }

  useEffect(() => { fetchListings() }, [])

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const dLat1 = lat1 ?? 3.1390, dLon1 = lon1 ?? 101.6869
    const dLat2 = lat2 ?? 3.1390, dLon2 = lon2 ?? 101.6869
    const R = 6371, rad = Math.PI / 180
    const dLat = (dLat2 - dLat1) * rad, dLon = (dLon2 - dLon1) * rad
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(dLat1 * rad) * Math.cos(dLat2 * rad) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const uploadImage = async (base64DataUrl) => {
    const uploadTask = async () => {
      const res = await fetch(base64DataUrl)
      const blob = await res.blob()
      const fileName = `listings/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
      const storageRef = ref(storage, fileName)
      await uploadBytes(storageRef, blob)
      return await getDownloadURL(storageRef)
    }
    const timeoutTask = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timed out')), 10000)
    )
    return Promise.race([uploadTask(), timeoutTask])
  }

  const normalizeKeyword = (value) => value.trim().replace(/\s+/g, ' ')

  // Generate unique keyword: if same keyword exists (case-sensitive), append number
  const generateUniqueKeyword = (keyword) => {
    const existing = allListings.filter(l => {
      if (l.keyword === keyword) return true
      const match = l.keyword?.match(new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (\\d+)$`))
      return !!match
    })
    if (existing.length === 0) return keyword
    // Find the highest number
    let maxNum = 0
    existing.forEach(l => {
      if (l.keyword === keyword) maxNum = Math.max(maxNum, 0)
      const m = l.keyword?.match(new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (\\d+)$`))
      if (m) maxNum = Math.max(maxNum, parseInt(m[1]))
    })
    return `${keyword} ${maxNum + 1}`
  }

  const publishListing = async () => {
    if (!newListing.name.trim()) return alert('Please enter a product name.')
    const normalizedKeyword = normalizeKeyword(newListing.keyword)
    if (!normalizedKeyword) return alert('Please enter a keyword for your product page.')
    if (normalizedKeyword.includes(',')) return alert('Only one keyword is allowed. Please remove commas.')

    setPublishing(true)

    if (newListing.isDraft) {
      localStorage.setItem('cropngo_shop_draft', JSON.stringify(newListing))
      setAddOpen(false)
      setPublishing(false)
      return
    }

    const formToSubmit = { ...newListing }
    setAddOpen(false)
    setNewListing({ name: '', description: '', price: '', category: '', unit: '', image: null, isDraft: false, tags: [], keyword: '' })
    setShowOtherUnit(false)
    localStorage.removeItem('cropngo_shop_draft')

    try {
      let imageUrl = null
      if (formToSubmit.image) {
        try { imageUrl = await uploadImage(formToSubmit.image) }
        catch (imgErr) { console.warn('Image upload failed:', imgErr) }
      }

      const uniqueKeyword = generateUniqueKeyword(normalizedKeyword)
      const keywordSlug = encodeURIComponent(uniqueKeyword)

      const listingData = {
        tab,
        name: formToSubmit.name.trim(),
        description: formToSubmit.description.trim(),
        price: formToSubmit.price ? parseFloat(formToSubmit.price) : null,
        unit: formToSubmit.unit || 'piece',
        category: formToSubmit.category || 'General',
        imageUrl,
        sellerId: user.username,
        sellerName: user.username,
        sellerRole: user.role || 'Farmer',
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        rating: 0,
        reviewCount: 0,
        isDraft: false,
        tags: formToSubmit.tags,
        keyword: uniqueKeyword,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, 'listings'), listingData)
      await fetchListings()

      const productUrl = `${window.location.origin}/app/shop/product/${keywordSlug}`
      setPublishedUrl(productUrl)
      setPublishing(false)
    } catch (e) {
      console.error('Failed to publish listing:', e)
      alert('Failed to publish listing.')
      setPublishing(false)
    }
  }

  // Publish a Wanted listing + send notifications
  const publishWanted = async () => {
    const cat = newWanted.category === '__custom__' ? newWanted.customCategory.trim() : newWanted.category
    if (!newWanted.name.trim()) return alert('Please enter a name.')
    if (!cat) return alert('Please choose a category.')

    setPublishingWanted(true)
    try {
      const wantedData = {
        tab: 'Wanted',
        name: newWanted.name.trim(),
        description: '',
        price: newWanted.price ? parseFloat(newWanted.price) : null,
        unit: newWanted.unit || 'kg',
        category: cat,
        imageUrl: null,
        sellerId: user.username,
        sellerName: user.username,
        sellerRole: user.role || 'Farmer',
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        rating: 0, reviewCount: 0, isDraft: false, tags: [],
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, 'listings'), wantedData)

      // Send notification to all farmers and vendors
      const priceStr = newWanted.price ? `RM ${newWanted.price}/${newWanted.unit}` : 'Negotiable'
      const notifText = `I want ${cat} with demanding price ${priceStr}`
      try {
        const usersSnap = await getDocs(collection(db, 'users'))
        const notifPromises = []
        usersSnap.docs.forEach(userDoc => {
          const userData = userDoc.data()
          if (userDoc.id !== user.username && (userData.role === 'Farmer' || userData.role === 'Vendor')) {
            const notif = {
              text: notifText,
              from: user.username,
              type: 'wanted',
              time: new Date().toISOString(),
            }
            notifPromises.push(updateDoc(doc(db, 'users', userDoc.id), {
              notifications: arrayUnion(notif)
            }).catch(() => {}))
          }
        })
        await Promise.all(notifPromises)
      } catch (notifErr) {
        console.warn('Notification send failed:', notifErr)
      }

      await fetchListings()
      setWantedOpen(false)
      setNewWanted({ name: '', category: '', customCategory: '', price: '', unit: 'kg' })
    } catch (e) {
      console.error('Failed to publish wanted:', e)
      alert('Failed to post wanted item.')
    }
    setPublishingWanted(false)
  }

  useEffect(() => {
    if (addOpen) {
      const saved = localStorage.getItem('cropngo_shop_draft')
      if (saved) { try { setNewListing(JSON.parse(saved)) } catch {} }
    }
  }, [addOpen])

  // PLACEHOLDER_RENDER
  const filtered = useMemo(() => {
    let items = allListings.filter(l => l.tab === tab && !l.isDraft)
    items = items.map(l => ({ ...l, distance: getDistance(user?.latitude, user?.longitude, l.latitude, l.longitude) }))
    if (search) {
      const s = search.toLowerCase()
      items = items.filter(l =>
        l.name.toLowerCase().includes(s) ||
        l.category.toLowerCase().includes(s) ||
        l.tags?.some(t => t.toLowerCase().includes(s))
      )
    }
    if (tab !== 'Wanted') {
      if (filters.category) items = items.filter(l => l.category === filters.category)
      if (filters.minPrice) items = items.filter(l => l.price >= parseFloat(filters.minPrice))
      if (filters.maxPrice) items = items.filter(l => l.price <= parseFloat(filters.maxPrice))
      if (filters.maxDistance) items = items.filter(l => (l.distance || 0) <= parseFloat(filters.maxDistance))
      if (filters.minRating > 0) items = items.filter(l => (l.rating || 0) >= filters.minRating)
      if (sort === 'nearest') items = [...items].sort((a, b) => (a.distance || 0) - (b.distance || 0))
      else if (sort === 'highest_rated') items = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0))
      else if (sort === 'lowest_price') items = [...items].sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999))
    }
    return items
  }, [tab, search, sort, filters, allListings, user])

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== 0).length
  const isWanted = tab === 'Wanted'

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-[#F8F3E8] border-b border-cream-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-6">
          <div className="pt-6 pb-4">
            <h1 className="font-display font-bold text-3xl text-bark-700">Marketplace</h1>
          </div>
          <div className="flex gap-4">
            {TABS.map(t => (
              <button key={t} id={`shop-tab-${t.toLowerCase()}`} onClick={() => setTab(t)}
                className={`py-3 text-[15px] border-b-[3px] transition-all duration-200
                  ${tab === t ? 'border-forest-600 text-[#2D6A4F] font-bold' : 'border-transparent text-bark-400 font-medium hover:text-forest-600 hover:border-forest-200'}`}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Search bar */}
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-bark-400" />
            <input id="shop-search" type="text" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setSort(sortInput) } }}
              placeholder={`Search ${tab.toLowerCase()}...`}
              className="w-full bg-[#F8F6F1] border border-[#E0D9CC] rounded-full pl-11 pr-10 py-3 text-[15px] text-bark-700 placeholder-bark-400 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all font-body shadow-inner-sm"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch('') }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-700 bg-[#E0D9CC]/30 rounded-full p-1">
                <X size={14} />
              </button>
            )}
          </div>
          {!isWanted && (
            <button id="shop-filters-btn" onClick={() => setShowFilters(x => !x)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-body font-bold transition-all duration-200 shadow-sm
                ${showFilters || activeFilterCount > 0 ? 'bg-forest-700 text-white shadow-md' : 'bg-[#2D6A4F] text-white hover:-translate-y-0.5 hover:shadow-md'}`}>
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && <span className="bg-white text-forest-700 text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center -ml-0.5">{activeFilterCount}</span>}
            </button>
          )}
        </div>

        {/* Filter panel (only for Crops/Equipment) */}
        {!isWanted && showFilters && (
          <div className="card p-4 mb-3 flex flex-col gap-3 animate-slide-down">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label text-xs">Min Price (RM)</label>
                <input type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} placeholder="0" className="input-field py-2 text-sm" /></div>
              <div><label className="label text-xs">Max Price (RM)</label>
                <input type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} placeholder="Any" className="input-field py-2 text-sm" /></div>
            </div>
            <div><label className="label text-xs">Category</label>
              <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="input-field py-2 text-sm">
                <option value="">All categories</option>
                {(CATEGORIES[tab] ?? []).map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="label text-xs">Max Distance (km)</label>
              <input type="number" value={filters.maxDistance} onChange={e => setFilter('maxDistance', e.target.value)} placeholder="Any" className="input-field py-2 text-sm" /></div>
            <div><label className="label text-xs">Min Star Rating</label>
              <div className="flex gap-2">
                {[0, 3, 4, 4.5].map(v => (
                  <button key={v} type="button" onClick={() => setFilter('minRating', v)}
                    className={`px-3 py-1.5 rounded-pill text-xs font-body border transition-all ${filters.minRating === v ? 'border-forest-500 bg-forest-100 text-forest-700 font-semibold' : 'border-cream-200 text-bark-400'}`}>
                    {v === 0 ? 'Any' : `${v}★+`}</button>
                ))}</div></div>
            <button onClick={() => setFilters({ minPrice: '', maxPrice: '', category: '', maxDistance: '', minRating: 0 })}
              className="text-xs text-bark-400 hover:text-red-500 transition-colors font-body text-left">Clear filters</button>
          </div>
        )}

        {/* Sort (only for Crops/Equipment) */}
        {!isWanted && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-body font-semibold text-bark-400 tracking-wide uppercase">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            <div className="relative">
              <select value={sortInput} onChange={e => setSortInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setSort(sortInput); setSearch(searchInput) } }}
                className="appearance-none font-body font-semibold border border-[#E0D9CC] rounded-full px-4 py-1.5 bg-[#F8F6F1] text-bark-600 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest-500/20 pr-8 shadow-sm">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-bark-400"><ChevronDown size={14} /></div>
            </div>
          </div>
        )}

        {/* Wanted: simple count */}
        {isWanted && (
          <div className="mb-4">
            <span className="text-[13px] font-body font-semibold text-bark-400 tracking-wide uppercase">{filtered.length} wanted request{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Listings Grid / Wanted List */}
        {loadingListings ? (
          <div className="text-center py-16 text-bark-400 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-forest-500" />
            <p className="font-body">Loading listings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-bark-400 flex flex-col items-center">
            <div className="mb-2 p-3 bg-cream-100 rounded-full text-bark-400">
              {tab === 'Crops' ? <Tractor size={32} /> : tab === 'Equipment' ? <Wrench size={32} /> : <Megaphone size={32} />}
            </div>
            <p className="font-body">No {tab.toLowerCase()} listings found.</p>
            <p className="font-body text-xs text-bark-300 mt-1">Be the first to add one!</p>
          </div>
        ) : isWanted ? (
          <div className="flex flex-col gap-3">
            {filtered.map(l => <WantedCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      {/* FAB */}
      <FloatingActionButton onClick={() => isWanted ? setWantedOpen(true) : setAddOpen(true)} label={isWanted ? 'Post Wanted' : 'Add Listing'} />

      {/* Add Listing Modal (Crops/Equipment) */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Listing">
        <div className="p-5 flex flex-col gap-4">
          <ImageUploader value={newListing.image} onChange={v => setNewListing(l => ({ ...l, image: v }))} shape="rect" label="Upload product photo" />
          <div><label className="label">Name</label>
            <input type="text" value={newListing.name} onChange={e => setNewListing(l => ({ ...l, name: e.target.value }))} className="input-field" placeholder="e.g. Musang King Durian" /></div>
          <div>
            <label className="label flex items-center gap-2"><Tag size={14} className="text-forest-600" /> Keyword <span className="text-xs text-bark-400 font-normal">(one keyword only — used for your product page URL)</span></label>
            <input type="text" value={newListing.keyword} onChange={e => setNewListing(l => ({ ...l, keyword: e.target.value }))} className="input-field" placeholder="e.g. musang king durian" />
            {newListing.keyword && (
              <p className="text-xs text-forest-600 mt-1 font-body">
                Your product page: <span className="font-bold">{window.location.origin}/app/shop/product/{encodeURIComponent(normalizeKeyword(newListing.keyword))}</span>
              </p>
            )}
          </div>
          <div><label className="label">Description</label>
            <textarea value={newListing.description} onChange={e => setNewListing(l => ({ ...l, description: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Describe your listing..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Price (RM)</label>
              <input type="number" value={newListing.price} onChange={e => setNewListing(l => ({ ...l, price: e.target.value }))} className="input-field" placeholder="0.00" /></div>
            <div><label className="label">Unit</label>
              <select value={showOtherUnit ? 'other' : newListing.unit}
                onChange={e => { if (e.target.value === 'other') { setShowOtherUnit(true); setNewListing(l => ({ ...l, unit: '' })) } else { setShowOtherUnit(false); setNewListing(l => ({ ...l, unit: e.target.value })) } }}
                className="input-field">
                <option value="">Select unit...</option>
                {[...UNITS, 'other'].map(u => <option key={u} value={u}>{u}</option>)}
              </select></div>
          </div>
          {showOtherUnit && (
            <div className="animate-slide-down"><label className="label italic text-bark-400">Specify other unit</label>
              <input type="text" value={newListing.unit} onChange={e => setNewListing(l => ({ ...l, unit: e.target.value }))} className="input-field" placeholder="e.g. box, crate..." /></div>
          )}
          <div><label className="label">Category</label>
            <select value={newListing.category} onChange={e => setNewListing(l => ({ ...l, category: e.target.value }))} className="input-field">
              <option value="">Select category...</option>
              {(CATEGORIES[tab] ?? []).map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <TagInput label="Tags/Keywords (for searchability)" options={[]} selected={newListing.tags} onChange={tags => setNewListing(l => ({ ...l, tags }))} allowOther placeholder="Add tags..." />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setNewListing(l => ({ ...l, isDraft: !l.isDraft }))}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${newListing.isDraft ? 'bg-bark-400' : 'bg-forest-500'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${newListing.isDraft ? 'left-0.5' : 'left-5'}`} />
            </button>
            <span className="text-sm font-body text-bark-600">{newListing.isDraft ? 'Save as Draft' : 'Publish Immediately'}</span>
          </div>
          <div className="flex gap-3 mt-1">
            <button className="btn-secondary flex-1" onClick={() => setAddOpen(false)} disabled={publishing}>Cancel</button>
            <button className="btn-primary flex-[2] flex items-center justify-center gap-2" onClick={publishListing} disabled={publishing}>
              {publishing ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : newListing.isDraft ? 'Save Draft' : 'Publish Listing'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Wanted Modal */}
      <Modal open={wantedOpen} onClose={() => setWantedOpen(false)} title="Post Wanted Item">
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <Megaphone size={28} className="mx-auto text-amber-600 mb-2" />
            <p className="text-sm font-body text-amber-800 font-semibold">All farmers & vendors will be notified about your request!</p>
          </div>
          <div><label className="label">What do you need?</label>
            <input type="text" value={newWanted.name} onChange={e => setNewWanted(w => ({ ...w, name: e.target.value }))} className="input-field" placeholder="e.g. Fresh Musang King Durian" /></div>
          <div><label className="label">Category</label>
            <select value={newWanted.category} onChange={e => setNewWanted(w => ({ ...w, category: e.target.value }))}
              className="input-field">
              <option value="">Select category...</option>
              {WANTED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">Type my own...</option>
            </select>
            {newWanted.category === '__custom__' && (
              <input type="text" value={newWanted.customCategory} onChange={e => setNewWanted(w => ({ ...w, customCategory: e.target.value }))}
                className="input-field mt-2" placeholder="Enter your category..." />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Wanted Price (RM)</label>
              <input type="number" value={newWanted.price} onChange={e => setNewWanted(w => ({ ...w, price: e.target.value }))} className="input-field" placeholder="0.00" /></div>
            <div><label className="label">Unit</label>
              <select value={newWanted.unit} onChange={e => setNewWanted(w => ({ ...w, unit: e.target.value }))} className="input-field">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select></div>
          </div>
          <div className="flex gap-3 mt-2">
            <button className="btn-secondary flex-1" onClick={() => setWantedOpen(false)} disabled={publishingWanted}>Cancel</button>
            <button className="btn-primary flex-[2] flex items-center justify-center gap-2" onClick={publishWanted} disabled={publishingWanted}>
              {publishingWanted ? <><Loader2 size={16} className="animate-spin" /> Posting...</> : 'Post Wanted'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal open={!!publishedUrl} onClose={() => setPublishedUrl(null)} title="Listing Published!">
        <div className="p-5 flex flex-col gap-4 text-center items-center">
          <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center text-forest-600 mb-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 className="font-display font-bold text-xl text-bark-700">Success!</h3>
          <p className="text-sm font-body text-bark-500">Your listing is now live with its own product page.</p>
          <div className="bg-[#F8F6F1] border border-[#E0D9CC] rounded-xl p-3 w-full flex items-center justify-between mt-2 overflow-hidden gap-2">
            <a href={publishedUrl} target="_blank" rel="noreferrer" className="text-forest-600 font-semibold text-sm truncate hover:underline text-left flex items-center gap-1">
              <ExternalLink size={14} /> {publishedUrl}
            </a>
            <button onClick={() => { navigator.clipboard.writeText(publishedUrl); alert('Copied!') }}
              className="px-3 py-1.5 bg-white border border-cream-200 rounded-lg text-xs font-bold text-bark-600 hover:bg-cream-50 transition-colors shadow-sm whitespace-nowrap flex items-center gap-1">
              <Copy size={12} /> Copy
            </button>
          </div>
          <button onClick={() => setPublishedUrl(null)} className="btn-primary w-full mt-2">Close</button>
        </div>
      </Modal>
    </div>
  )
}
