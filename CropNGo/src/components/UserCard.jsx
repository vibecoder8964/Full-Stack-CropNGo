import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import RoleBadge from './RoleBadge'
import StarRating from './StarRating'
import { MapPin } from 'lucide-react'

export default function UserCard({ user }) {
  const navigate = useNavigate()
  const cropInfo = user.role === 'Farmer'
    ? user.crops?.join(', ')
    : user.role === 'Vendor'
    ? user.cropsWanted?.join(', ')
    : user.toolsProvided?.join(', ')

  return (
    <button
      onClick={() => navigate(`/app/profile/${user.id}`)}
      className="card p-5 flex items-start gap-4 w-full text-left"
    >
      <Avatar name={user.username} role={user.role} size="xl" className="shadow-md" />
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-display font-bold text-lg text-bark-700">{user.username}</span>
          <RoleBadge role={user.role} size="xs" />
        </div>
        <div className="flex items-center gap-1.5 text-bark-400">
          <MapPin size={13} />
          <span className="text-xs font-body">{user.location}</span>
          {user.distance > 0 && <span className="text-xs font-body font-semibold">· {user.distance} km away</span>}
        </div>
        {cropInfo && <p className="text-sm text-bark-600 font-body mt-2 line-clamp-1">{cropInfo}</p>}
        <div className="flex items-center gap-1.5 mt-2.5">
          <StarRating value={user.rating} readOnly size={14} />
          <span className="text-xs text-bark-400 font-body font-semibold">({user.reviewCount} reviews)</span>
        </div>
      </div>
    </button>
  )
}
