import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Loader2, Info, Star } from 'lucide-react'
import { db } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import Avatar from '../../components/Avatar'
import RoleBadge from '../../components/RoleBadge'
import StarRating from '../../components/StarRating'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchListing() {
      try {
        const docRef = doc(db, 'listings', id)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          setListing({ id: snap.id, ...snap.data() })
        } else {
          setError('Product not found.')
        }
      } catch (e) {
        console.error(e)
        setError('Failed to load product.')
      } finally {
        setLoading(false)
      }
    }
    fetchListing()
  }, [id])

  if (loading) {
    return (
      <div className="bg-[#FAFAF5] min-h-[calc(100dvh-4rem)] flex items-center justify-center">
        <Loader2 className="animate-spin text-forest-600 mb-2" size={32} />
      </div>
    )
  }

  // Dynamic SEO based on Product
  useEffect(() => {
    if (listing) {
      document.title = `${listing.name} | CropNGo Marketplace`
      
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.name = 'keywords'
        document.head.appendChild(metaKeywords)
      }
      
      const tags = [
        'cropngo', 'farm', 'agriculture', 'buy', 'sell',
        listing.category, listing.name, ...(listing.tags || [])
      ].filter(Boolean)
      
      metaKeywords.content = tags.join(', ')
      
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.name = 'description'
        document.head.appendChild(metaDesc)
      }
      metaDesc.content = listing.description ? listing.description.slice(0, 160) : `Buy ${listing.name} on CropNGo Marketplace.`
    }
  }, [listing])

  if (error || !listing) {
    return (
      <div className="bg-[#FAFAF5] min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center p-6 text-center">
        <Info className="text-bark-400 mb-4" size={48} />
        <h2 className="text-2xl font-display font-bold text-bark-700 mb-2">Product Not Found</h2>
        <p className="text-bark-500 mb-6">{error}</p>
        <button onClick={() => navigate('/app/shop')} className="btn-primary">
          Back to Shop
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[#FAFAF5] min-h-[calc(100dvh-4rem)] pb-20 animate-fade-in relative pt-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-6">
        
        {/* Header Navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-bark-500 hover:text-bark-700 font-body font-bold text-sm w-fit transition-colors mb-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Main Product Section */}
        <div className="flex flex-col md:flex-row gap-8 bg-white border border-cream-200 rounded-[32px] p-6 md:p-8 shadow-sm">
          
          {/* Left: Image */}
          <div className="w-full md:w-1/2 shrink-0">
            <div className="aspect-square rounded-[24px] overflow-hidden bg-[#F8F6F1] flex items-center justify-center border border-cream-200 shadow-inner-sm">
              {listing.imageUrl ? (
                <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[100px] leading-none opacity-80 select-none">
                  {listing.category === 'Durian' || listing.category === 'Fruits' ? '🍎' : '🌾'}
                </span>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="w-full md:w-1/2 flex flex-col pt-2">
            <span className="text-xs font-bold uppercase tracking-widest text-forest-600 mb-2">
              {listing.category}
            </span>
            <h1 className="font-display font-bold tracking-tight text-3xl md:text-4xl text-[#1A1A1A] mb-4 leading-tight">
              {listing.name}
            </h1>

            <div className="flex items-center justify-between mb-8 pb-6 border-b border-cream-200/60">
              {listing.price ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-display font-bold text-[#2D6A4F]">
                    RM {listing.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-body text-bark-400 font-medium">/{listing.unit}</span>
                </div>
              ) : (
                <span className="text-2xl font-display font-bold text-bark-500 italic">Negotiable</span>
              )}
              
              <div className="flex items-center gap-1.5 bg-[#F8F6F1] px-3 py-1.5 rounded-full border border-cream-200">
                <MapPin size={14} className="text-bark-500" />
                <span className="text-sm font-body font-bold text-bark-600">
                  {typeof listing.distance === 'number' ? `${listing.distance.toFixed(1)} km away` : 'Local Area'}
                </span>
              </div>
            </div>

            <div className="mb-6 flex-1">
              <h3 className="font-body font-bold text-[#1A1A1A] mb-3 text-lg">Product Description</h3>
              <p className="font-body text-[15px] text-bark-600 leading-relaxed whitespace-pre-wrap">
                {listing.description || "No description provided by the seller."}
              </p>
            </div>

            {/* Seller Contact Strip */}
            <div className="mt-auto pt-6 border-t border-cream-200/60">
              <h3 className="font-body font-bold text-[#1A1A1A] mb-4 text-sm opacity-60 uppercase tracking-widest">Sold By</h3>
              <div 
                onClick={() => navigate(`/app/profile/${listing.sellerId}`)}
                className="flex items-center hover:bg-[#F8F6F1] transition-colors p-4 rounded-2xl border border-cream-200 cursor-pointer shadow-sm group"
              >
                <Avatar name={listing.sellerName} role={listing.sellerRole} size="lg" className="ring-2 ring-white shadow-sm" />
                <div className="ml-4 flex flex-col">
                  <span className="font-display font-bold text-lg text-bark-800 group-hover:text-forest-700 transition-colors">
                    {listing.sellerName}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={listing.sellerRole} />
                    <div className="w-1 h-1 rounded-full bg-cream-300" />
                    <div className="flex items-center gap-1">
                      <StarRating value={listing.rating} readOnly size={14} />
                      <span className="text-xs text-bark-500 font-bold ml-1">({listing.reviewCount})</span>
                    </div>
                  </div>
                </div>
                <div className="ml-auto flex items-center justify-center w-10 h-10 rounded-full bg-forest-50 text-forest-600 group-hover:bg-forest-600 group-hover:text-white transition-colors">
                  <ArrowLeft size={20} className="rotate-180" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
