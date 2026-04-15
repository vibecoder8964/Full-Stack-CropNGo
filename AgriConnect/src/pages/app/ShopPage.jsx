import { useState, useMemo, useEffect } from 'react'
import { Search, SlidersHorizontal, X, Tractor, Wrench, Megaphone, ChevronDown, Loader2 } from 'lucide-react'
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'
import { CATEGORIES } from '../../data/mockListings'
import ListingCard from '../../components/ListingCard'
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
  const [newListing, setNewListing] = useState({ name: '', description: '', price: '', category: '', image: null, isDraft: false, tags: [] })

  // ── Firestore listings state ─────────────────────────────────────────────
  const [allListings, setAllListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)

  // ── Fetch all listings from Firestore on mount ───────────────────────────
  const fetchListings = async () => {
    setLoadingListings(true)
    try {
      const snapshot = await getDocs(collection(db, 'listings'))
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Sort by createdAt descending (newest first)
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

  // ── Upload image to Firebase Storage and return download URL ─────────────
  const uploadImage = async (base64DataUrl) => {
    // Convert base64 data URL to blob
    const res = await fetch(base64DataUrl)
    const blob = await res.blob()
    const fileName = `listings/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
    const storageRef = ref(storage, fileName)
    await uploadBytes(storageRef, blob)
    return await getDownloadURL(storageRef)
  }

  // ── Publish listing to Firestore ─────────────────────────────────────────
  const publishListing = async () => {
    if (!newListing.name.trim()) return alert('Please enter a product name.')
    if (!newListing.category) return alert('Please select a category.')

    setPublishing(true)
    try {
      // Image upload is optional — if it fails, we still publish without an image
      let imageUrl = null
      if (newListing.image) {
        try {
          imageUrl = await uploadImage(newListing.image)
        } catch (imgErr) {
          console.warn('Image upload failed, publishing without image:', imgErr)
          // Continue without image — don't block the listing
        }
      }

      const listingData = {
        tab,
        name: newListing.name.trim(),
        description: newListing.description.trim(),
        price: newListing.price ? parseFloat(newListing.price) : null,
        unit: tab === 'Wanted' ? null : 'per unit',
        category: newListing.category,
        imageUrl: imageUrl,
        sellerId: user.username,
        sellerName: user.username,
        sellerRole: user.role || 'Farmer',
        rating: 0,
        reviewCount: 0,
        distance: 0,
        isDraft: newListing.isDraft,
        tags: newListing.tags,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, 'listings'), listingData)

      // Reset form and close modal
      setNewListing({ name: '', description: '', price: '', category: '', image: null, isDraft: false, tags: [] })
      setAddOpen(false)

      // Refresh listings
      await fetchListings()
    } catch (e) {
      console.error('Failed to publish listing:', e)
      const errorDetail = e?.code === 'permission-denied'
        ? 'Permission denied. Check your Firestore security rules.'
        : e?.code === 'unavailable'
          ? 'Firestore is temporarily unavailable. Please try again in a moment.'
          : `Error: ${e.message || 'Unknown error'}`
      alert(`Failed to publish listing.\n${errorDetail}`)
    }
    setPublishing(false)
  }

  // ── Filter + Sort ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = allListings.filter(l => l.tab === tab && !l.isDraft)
    if (search) items = items.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.category.toLowerCase().includes(search.toLowerCase()))
    if (filters.category) items = items.filter(l => l.category === filters.category)
    if (filters.minPrice) items = items.filter(l => l.price >= parseFloat(filters.minPrice))
    if (filters.maxPrice) items = items.filter(l => l.price <= parseFloat(filters.maxPrice))
    if (filters.maxDistance) items = items.filter(l => (l.distance || 0) <= parseFloat(filters.maxDistance))
    if (filters.minRating > 0) items = items.filter(l => (l.rating || 0) >= filters.minRating)
    if (sort === 'nearest') items = [...items].sort((a, b) => (a.distance || 0) - (b.distance || 0))
    else if (sort === 'highest_rated') items = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    else if (sort === 'lowest_price') items = [...items].sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999))
    return items
  }, [tab, search, sort, filters, allListings])

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== 0).length

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-[#F8F3E8] border-b border-cream-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-6">
          {/* Title */}
          <div className="pt-6 pb-4">
            <h1 className="font-display font-bold text-3xl text-bark-700">Marketplace</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            {TABS.map(t => (
              <button
                key={t}
                id={`shop-tab-${t.toLowerCase()}`}
                onClick={() => setTab(t)}
                className={`py-3 text-[15px] border-b-[3px] transition-all duration-200
                  ${tab === t ? 'border-forest-600 text-[#2D6A4F] font-bold' : 'border-transparent text-bark-400 font-medium hover:text-forest-600 hover:border-forest-200'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Search + Filter bar */}
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-bark-400" />
            <input
              id="shop-search"
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setSearch(searchInput)
                  setSort(sortInput)
                }
              }}
              placeholder={`Search ${tab.toLowerCase()}...`}
              className="w-full bg-[#F8F6F1] border border-[#E0D9CC] rounded-full pl-11 pr-10 py-3 text-[15px] text-bark-700 placeholder-bark-400 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all font-body shadow-inner-sm"
            />
            {searchInput && (
              <button 
                onClick={() => { setSearchInput(''); setSearch(''); }} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-700 bg-[#E0D9CC]/30 rounded-full p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            id="shop-filters-btn"
            onClick={() => setShowFilters(x => !x)}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-body font-bold transition-all duration-200 shadow-sm
              ${showFilters || activeFilterCount > 0 ? 'bg-forest-700 text-white shadow-md' : 'bg-[#2D6A4F] text-white hover:-translate-y-0.5 hover:shadow-md'}`}
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && <span className="bg-white text-forest-700 text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center -ml-0.5">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-4 mb-3 flex flex-col gap-3 animate-slide-down">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label text-xs">Min Price (RM)</label>
                <input type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} placeholder="0" className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="label text-xs">Max Price (RM)</label>
                <input type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} placeholder="Any" className="input-field py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="label text-xs">Category</label>
              <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="input-field py-2 text-sm">
                <option value="">All categories</option>
                {(CATEGORIES[tab] ?? []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Max Distance (km)</label>
              <input type="number" value={filters.maxDistance} onChange={e => setFilter('maxDistance', e.target.value)} placeholder="Any" className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="label text-xs">Min Star Rating</label>
              <div className="flex gap-2">
                {[0, 3, 4, 4.5].map(v => (
                  <button key={v} type="button" onClick={() => setFilter('minRating', v)}
                    className={`px-3 py-1.5 rounded-pill text-xs font-body border transition-all ${filters.minRating === v ? 'border-forest-500 bg-forest-100 text-forest-700 font-semibold' : 'border-cream-200 text-bark-400'}`}>
                    {v === 0 ? 'Any' : `${v}★+`}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setFilters({ minPrice: '', maxPrice: '', category: '', maxDistance: '', minRating: 0 })}
                    className="text-xs text-bark-400 hover:text-red-500 transition-colors font-body text-left">
              Clear filters
            </button>
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-body font-semibold text-bark-400 tracking-wide uppercase">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          <div className="relative">
             <select 
               value={sortInput} 
               onChange={e => setSortInput(e.target.value)}
               onKeyDown={e => {
                 if (e.key === 'Enter') {
                   setSort(sortInput)
                   setSearch(searchInput)
                 }
               }}
               className="appearance-none font-body font-semibold border border-[#E0D9CC] rounded-full px-4 py-1.5 bg-[#F8F6F1] text-bark-600 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest-500/20 pr-8 shadow-sm"
             >
               {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-bark-400">
                <ChevronDown size={14} />
             </div>
          </div>
        </div>

        {/* Grid */}
        {loadingListings ? (
          <div className="text-center py-16 text-bark-400 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-forest-500" />
            <p className="font-body">Loading listings...</p>
          </div>
        ) : filtered.length === 0
          ? <div className="text-center py-16 text-bark-400 flex flex-col items-center">
              <div className="mb-2 p-3 bg-cream-100 rounded-full text-bark-400">
                {tab === 'Crops' ? <Tractor size={32} /> : tab === 'Equipment' ? <Wrench size={32} /> : <Megaphone size={32} />}
              </div>
              <p className="font-body">No {tab.toLowerCase()} listings found.</p>
              <p className="font-body text-xs text-bark-300 mt-1">Be the first to add one!</p>
            </div>
          : <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
        }
      </div>

      {/* FAB */}
      <FloatingActionButton onClick={() => setAddOpen(true)} label="Add Listing" />

      {/* Add Listing Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Listing">
        <div className="p-5 flex flex-col gap-4">
          <ImageUploader value={newListing.image} onChange={v => setNewListing(l => ({ ...l, image: v }))} shape="rect" label="Upload product photo" />
          <div>
            <label className="label">Name</label>
            <input type="text" value={newListing.name} onChange={e => setNewListing(l => ({ ...l, name: e.target.value }))} className="input-field" placeholder="e.g. Musang King Durian" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={newListing.description} onChange={e => setNewListing(l => ({ ...l, description: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Describe your listing..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Price (RM)</label>
              <input type="number" value={newListing.price} onChange={e => setNewListing(l => ({ ...l, price: e.target.value }))} className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={newListing.category} onChange={e => setNewListing(l => ({ ...l, category: e.target.value }))} className="input-field">
                <option value="">Select...</option>
                {(CATEGORIES[tab] ?? []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <TagInput label="Tags / Keywords" options={[]} selected={newListing.tags} onChange={tags => setNewListing(l => ({ ...l, tags }))} allowOther placeholder="Add tags..." />
          {/* Draft toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNewListing(l => ({ ...l, isDraft: !l.isDraft }))}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${newListing.isDraft ? 'bg-bark-400' : 'bg-forest-500'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${newListing.isDraft ? 'left-0.5' : 'left-5'}`} />
            </button>
            <span className="text-sm font-body text-bark-600">{newListing.isDraft ? 'Save as Draft' : 'Publish Immediately'}</span>
          </div>
          <button 
            className="btn-primary w-full flex items-center justify-center gap-2" 
            onClick={publishListing}
            disabled={publishing}
          >
            {publishing 
              ? <><Loader2 size={16} className="animate-spin" /> Publishing...</>
              : newListing.isDraft ? 'Save Draft' : 'Publish Listing'
            }
          </button>
        </div>
      </Modal>
    </div>
  )
}
