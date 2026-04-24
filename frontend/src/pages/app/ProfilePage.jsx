import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import Avatar from '../../components/Avatar'
import RoleBadge from '../../components/RoleBadge'
import StarRating from '../../components/StarRating'
import Modal from '../../components/Modal'
import TagInput from '../../components/TagInput'
import ImageUploader from '../../components/ImageUploader'
import { MapPin, Edit2, MessageCircle, Link, Share2, Hash } from 'lucide-react'
import { PREDEFINED_CROPS, PREDEFINED_TOOLS } from '../../data/mockAI'

const ROLES = ['Farmer', 'Vendor', 'Supplier']
const FARMER_TYPES = [{ id: 'new', label: 'New Farmer' }, { id: 'existing', label: 'Experienced Farmer' }]
const GENDERS = ['Male', 'Female', 'Prefer not to say']

function RoleInfo({ user }) {
  if (user.role === 'Farmer') return (
    <div className="flex flex-col gap-6">
      {user.farmerType && (
        <div className="bg-cream-50 rounded-xl p-5 border border-cream-200 shadow-inner-sm w-fit pr-8">
          <span className="text-xs font-body font-bold tracking-widest text-forest-600 uppercase block mb-1">Status</span>
          <span className="text-base font-body font-bold text-bark-700">
            {user.farmerType === 'new' ? 'New Farmer 🌱' : 'Experienced Farmer 🚜'}
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {user.placeOfCultivation && (
          <div className="flex items-center gap-4 text-bark-600 font-body p-4 rounded-xl bg-white border border-cream-200 shadow-sm transition-all hover:shadow-md hover:border-cream-300">
            <div className="w-10 h-10 rounded-full bg-forest-50 flex items-center justify-center text-forest-600 flex-shrink-0 shadow-inner-sm">
              <MapPin size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-bark-400 font-semibold uppercase tracking-wider">Place of Cultivation</span>
              <span className="font-semibold text-sm">{user.placeOfCultivation}</span>
            </div>
          </div>
        )}

        {user.landSize && (
          <div className="flex items-center gap-4 text-bark-600 font-body p-4 rounded-xl bg-white border border-cream-200 shadow-sm transition-all hover:shadow-md hover:border-cream-300">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-inner-sm">
              <span className="font-bold text-sm">📐</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-bark-400 font-semibold uppercase tracking-wider">Land Size</span>
              <span className="font-semibold text-sm">{user.landSize} {user.landUnit}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {user.crops?.length > 0 && (
          <div className="bg-white p-5 rounded-xl border border-cream-200 shadow-sm flex flex-col items-start min-h-[120px]">
            <span className="text-xs font-body font-bold tracking-widest text-forest-600 uppercase block mb-3">Crops Grown</span>
            <div className="flex flex-wrap gap-2">
              {user.crops.map(c => <span key={c} className="bg-forest-50 border border-forest-200 text-forest-700 text-sm font-semibold px-4 py-1.5 rounded-pill shadow-sm">{c}</span>)}
            </div>
          </div>
        )}

        {user.toolsAvailable?.length > 0 && (
          <div className="bg-white p-5 rounded-xl border border-cream-200 shadow-sm flex flex-col items-start min-h-[120px]">
            <span className="text-xs font-body font-bold tracking-widest text-amber-600 uppercase block mb-3">Tools Available</span>
            <div className="flex flex-wrap gap-2">
              {user.toolsAvailable.map(t => <span key={t} className="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-1.5 rounded-pill shadow-sm">{t}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (user.role === 'Vendor') return (
    <div className="flex flex-col gap-5 bg-blue-50/60 p-8 rounded-2xl border border-blue-100 shadow-inner-sm">
      {user.location && (
        <div className="flex items-center gap-3 text-blue-800 font-body mb-2 bg-white w-fit px-4 py-2.5 rounded-xl border border-blue-200 shadow-sm">
          <MapPin size={16} className="text-blue-600" />
          <span className="font-bold text-sm tracking-wide text-bark-600 uppercase">Operating Location: <span className="font-bold text-blue-700 capitalize">{user.location}</span></span>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
        <span className="text-xs font-body font-bold tracking-widest text-blue-600 uppercase block mb-4">Crops looking to buy</span>
        <div className="flex flex-wrap gap-3">
          {(user.cropsWanted ?? []).map(c => <span key={c} className="bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold px-5 py-2.5 rounded-pill shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">{c}</span>)}
        </div>
      </div>
      
      <p className="text-sm font-body text-blue-600/70 font-medium italic mt-2 flex items-center gap-2">
        <MessageCircle size={16} /> Connect via Chat to discuss pricing and quantities
      </p>
    </div>
  )

  if (user.role === 'Supplier') return (
    <div className="flex flex-col gap-5 bg-amber-50/60 p-8 rounded-2xl border border-amber-100 shadow-inner-sm">
      {user.location && (
        <div className="flex items-center gap-3 text-amber-800 font-body mb-2 bg-white w-fit px-4 py-2.5 rounded-xl border border-amber-200 shadow-sm">
          <MapPin size={16} className="text-amber-600" />
          <span className="font-bold text-sm tracking-wide text-bark-600 uppercase">Operating Location: <span className="font-bold text-amber-700 capitalize">{user.location}</span></span>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
        <span className="text-xs font-body font-bold tracking-widest text-amber-600 uppercase block mb-4">Tools & equipment provided</span>
        <div className="flex flex-wrap gap-3">
          {(user.toolsProvided ?? []).map(t => <span key={t} className="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold px-5 py-2.5 rounded-pill shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">{t}</span>)}
        </div>
      </div>
      
      <p className="text-sm font-body text-amber-600/70 font-medium italic mt-2 flex items-center gap-2">
        <MessageCircle size={16} /> Connect via Chat to discuss availability and pricing
      </p>
    </div>
  )

  return null
}

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me, updateUser } = useAuth()

  const isOwn = !id || id === me?.username
  const [profileUser, setProfileUser] = useState(isOwn ? me : null)
  const [loading, setLoading] = useState(!isOwn)

  useEffect(() => {
    if (isOwn) {
      setProfileUser(me)
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      setLoading(true)
      try {
        const d = await getDoc(doc(db, 'users', id))
        if (d.exists()) {
          setProfileUser({ username: d.id, ...d.data() })
        } else {
          setProfileUser(null)
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    fetchUser()
  }, [id, isOwn, me])

  const profile = profileUser

  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState(null)

  const openEdit = () => {
    setEditData({ ...me })
    setEditOpen(true)
  }

  const saveEdit = () => {
    // Authorization guard: only allow editing own profile
    if (!isOwn || !me?.username) return
    updateUser(editData)
    setEditOpen(false)
  }

  const setField = (k, v) => setEditData(d => ({ ...d, [k]: v }))

  if (loading) return <div className="w-[85%] max-w-4xl mx-auto px-4 pb-28 pt-8 text-center text-bark-400 font-body">Loading profile...</div>
  if (!profile) return <div className="w-[85%] max-w-4xl mx-auto px-4 pb-28 pt-8 text-center text-bark-400 font-body">User not found.</div>

  // Dynamic SEO based on Profile
  useEffect(() => {
    if (profile) {
      document.title = `${profile.username} | CropNGo Profile`
      
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.name = 'keywords'
        document.head.appendChild(metaKeywords)
      }
      
      const tags = [
        'cropngo', 'farm', 'agriculture', profile.role, profile.location, 
        ...(profile.crops || []), 
        ...(profile.toolsAvailable || []), 
        ...(profile.cropsWanted || []), 
        ...(profile.toolsProvided || [])
      ].filter(Boolean)
      
      metaKeywords.content = tags.join(', ')
      
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.name = 'description'
        document.head.appendChild(metaDesc)
      }
      metaDesc.content = profile.bio || `Check out ${profile.username}'s profile on CropNGo.`
    }
  }, [profile])

  const AvatarDisplay = () => {
    const initials = profile.username ? profile.username.slice(0, 2).toUpperCase() : '?'
    return (
      <div className="w-[96px] h-[96px] rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ring-4 ring-white shadow-md mb-3 bg-[#2D6A4F] z-10 relative text-white">
        {profile.avatar 
          ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-3xl font-display font-bold">
              {initials}
            </div>
        }
      </div>
    )
  }

  return (
    <div className="w-[85%] max-w-4xl mx-auto pb-28 animate-fade-in flex flex-col gap-6 items-center">
      
      {/* 1. Header Card */}
      <div className="card w-full mt-6 relative overflow-hidden group border-cream-200 bg-white">
        <div className="h-[180px] w-full relative">
           <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&q=80" className="w-full h-full object-cover" alt="Farm field" />
           <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,30,15,0.2) 0%, rgba(10,30,15,0.5) 100%)' }} />
        </div>
        
        <div className="px-8 pb-8 relative -mt-12 flex flex-col items-center w-full">
          <AvatarDisplay />
          
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="flex items-center justify-center gap-3">
              <h1 className="font-display font-bold text-3xl text-bark-700 tracking-tight leading-none">{profile.username}</h1>
              <RoleBadge role={profile.role} />
            </div>
            
            <div className="flex items-center gap-2 text-bark-500 font-body">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-forest-500" />
                  <span className="text-sm font-medium">{profile.location}</span>
                </div>
              )}
              {profile.location && profile.age && <span>·</span>}
              {profile.age && (
                <span className="text-sm font-medium">
                  {profile.age} yrs · {profile.gender}
                </span>
              )}
            </div>
          </div>

          {(profile.socials?.linkedin || profile.socials?.facebook || profile.socials?.whatsapp || profile.socials?.twitter) && (
            <div className="flex gap-2.5 mb-5 items-center justify-center">
              {profile.socials?.whatsapp && (
                <a href={`https://wa.me/${profile.socials.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-cream-200 bg-cream-50 flex items-center justify-center text-bark-400 hover:bg-forest-600 hover:text-white hover:border-forest-600 transition-all">
                  <MessageCircle size={14} />
                </a>
              )}
              {profile.socials?.linkedin && (
                <a href={`https://${profile.socials.linkedin}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-cream-200 bg-cream-50 flex items-center justify-center text-bark-400 hover:bg-forest-600 hover:text-white hover:border-forest-600 transition-all">
                  <Link size={14} />
                </a>
              )}
              {profile.socials?.facebook && (
                <a href={`https://${profile.socials.facebook}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-cream-200 bg-cream-50 flex items-center justify-center text-bark-400 hover:bg-forest-600 hover:text-white hover:border-forest-600 transition-all">
                  <Share2 size={14} />
                </a>
              )}
              {profile.socials?.twitter && (
                <a href={`https://twitter.com/${profile.socials.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-cream-200 bg-cream-50 flex items-center justify-center text-bark-400 hover:bg-forest-600 hover:text-white hover:border-forest-600 transition-all">
                  <Hash size={14} />
                </a>
              )}
            </div>
          )}

          <div className="w-full flex justify-center mt-2">
            {isOwn
              ? <button onClick={openEdit} className="btn-primary flex items-center gap-2 px-8">
                  <Edit2 size={16} /> Edit Profile
                </button>
              : <button onClick={() => navigate('/app/chat')} className="btn-primary flex items-center gap-2 px-8">
                  <MessageCircle size={18} /> Send Message
                </button>
            }
          </div>
        </div>
      </div>

      {/* 2. About Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-8 w-full group overflow-hidden relative">
        <h2 className="font-display font-semibold text-xl text-bark-700 pl-3 border-l-[3px] border-forest-600 mb-4 z-10 relative">About</h2>
        
        {profile.bio ? (
          <p className="text-base font-body text-bark-600 leading-relaxed z-10 relative">{profile.bio}</p>
        ) : (
          isOwn ? (
            <p className="text-base font-body text-bark-400 italic z-10 relative cursor-pointer hover:text-forest-600 transition-colors" onClick={openEdit}>
              Add a bio to let others know more about you...
            </p>
          ) : (
            <p className="text-base font-body text-bark-400 italic z-10 relative">No bio provided.</p>
          )
        )}
      </div>

      {/* 3. Role Context Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-8 w-full overflow-hidden">
        <h2 className="font-display font-semibold text-xl text-bark-700 pl-3 border-l-[3px] border-forest-600 mb-6">
          {profile.role === 'Farmer' ? 'Farm Details' : profile.role === 'Vendor' ? 'Buying Interests' : 'Products & Equipment'}
        </h2>
        <RoleInfo user={profile} />
      </div>

      {/* 4. Reviews & Ratings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="font-display font-semibold text-xl text-bark-700 pl-3 border-l-[3px] border-forest-600">Reviews & Ratings</h2>
          
          <div className="flex items-center gap-3 bg-cream-50 px-4 py-2 rounded-2xl border border-cream-200 shadow-inner-sm">
            <StarRating value={profile.rating || 0} readOnly size={24} />
            <div className="flex flex-col">
              <span className="font-bold text-bark-700 text-lg leading-none">{profile.rating || 0}</span>
              <span className="text-xs text-bark-400 font-semibold">{profile.reviewCount || 0} reviews</span>
            </div>
          </div>
        </div>

        {profile.reviews?.length > 0 ? (
          <div className="flex flex-col gap-4">
            {profile.reviews.map(r => (
              <div key={r.id} className="p-5 rounded-xl border border-cream-200 bg-cream-50/50 hover:bg-cream-50 transition-colors flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.authorName} role={r.role} size="sm" />
                    <div>
                       <div className="flex items-center gap-2 mb-0.5">
                         <span className="font-bold text-bark-700 text-sm">{r.authorName}</span>
                         <div className="scale-75 origin-left">
                           <RoleBadge role={r.role} />
                         </div>
                       </div>
                       <span className="text-xs text-bark-400 font-semibold">{r.date}</span>
                    </div>
                  </div>
                  <StarRating value={r.rating} readOnly size={14} />
                </div>
                <p className="text-sm text-bark-600 font-body leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-cream-200 rounded-xl bg-cream-50/30">
             <MessageCircle size={32} className="mx-auto text-cream-300 mb-3" />
             <p className="text-bark-500 font-medium font-body text-base">No reviews yet.</p>
             <p className="text-sm text-bark-400 mt-1 font-body">Reviews appear after chat interactions.</p>
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        {editData && (
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col items-center">
              <ImageUploader value={editData.avatar} onChange={v => setField('avatar', v)} shape="circle" label="Change photo" />
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea
                value={editData.bio ?? ''}
                onChange={e => setField('bio', e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="label">Location</label>
              <input type="text" value={editData.location ?? ''} onChange={e => setField('location', e.target.value)} className="input-field" placeholder="City, State" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Age</label>
                <input type="number" value={editData.age ?? ''} onChange={e => setField('age', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Gender</label>
                <select value={editData.gender ?? ''} onChange={e => setField('gender', e.target.value)} className="input-field">
                  <option value="">—</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setField('role', r)}
                    className={`py-2 rounded-xl border-2 text-sm font-body font-semibold transition-all duration-200
                      ${editData.role === r ? 'border-forest-500 bg-forest-50 text-forest-700' : 'border-cream-200 text-bark-500 hover:border-cream-300'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {editData.role === 'Farmer' && (
              <>
                <div>
                  <label className="label">Farmer status</label>
                  <div className="flex gap-2">
                    {FARMER_TYPES.map(t => (
                      <button key={t.id} type="button" onClick={() => setField('farmerType', t.id)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-body transition-all ${editData.farmerType === t.id ? 'border-forest-500 bg-forest-50 text-forest-700 font-semibold' : 'border-cream-200 text-bark-500'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <TagInput label="Crops grown" options={PREDEFINED_CROPS} selected={editData.crops ?? []} onChange={v => setField('crops', v)} allowOther />
                <TagInput label="Tools available" options={PREDEFINED_TOOLS} selected={editData.toolsAvailable ?? []} onChange={v => setField('toolsAvailable', v)} allowOther />
              </>
            )}
            {editData.role === 'Vendor' && (
              <TagInput label="Crops looking to buy" options={PREDEFINED_CROPS} selected={editData.cropsWanted ?? []} onChange={v => setField('cropsWanted', v)} allowOther />
            )}
            {editData.role === 'Supplier' && (
              <TagInput label="Equipment provided" options={PREDEFINED_TOOLS} selected={editData.toolsProvided ?? []} onChange={v => setField('toolsProvided', v)} allowOther />
            )}

            <button onClick={saveEdit} className="btn-primary w-full mt-1">Save Changes</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
